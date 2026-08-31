import path from 'node:path'
import { PGlite } from '@electric-sql/pglite'

// PostgreSQL embebido, guardado en una carpeta local del bot. Existe para que
// una copia descargada funcione sin configurar nada: si no hay DATABASE_URL,
// los datos viven aqui y no salen de la maquina.
//
// Se eligio PostgreSQL embebido y no un JSON propio porque el bot ejecuta 280
// consultas SQL reales (19 con ON CONFLICT, 16 con RETURNING, 3 con CTE). Con
// esto funcionan sin tocar ni un plugin.

export const localDatabasePath = () =>
  path.resolve(process.env.LOCAL_DB_PATH || 'database')

// PGlite atiende una sola conexion. Un BEGIN...COMMIT de dos comandos a la vez
// se entrelazaria y corromperia la transaccion, asi que connect() entrega el
// cliente en exclusiva y lo libera al hacer release().
class Mutex {
  constructor() {
    this.cola = Promise.resolve()
  }

  adquirir() {
    let liberar
    const siguiente = new Promise(resolve => { liberar = resolve })
    const turno = this.cola.then(() => liberar)
    this.cola = this.cola.then(() => siguiente)
    return turno
  }
}

const comandoDe = texto => {
  const palabra = String(texto).trim().replace(/^\(+/, '').split(/[\s(]/)[0].toUpperCase()
  return ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'WITH', 'BEGIN', 'COMMIT', 'ROLLBACK'].includes(palabra)
    ? (palabra === 'WITH' ? 'SELECT' : palabra)
    : palabra
}

// pg devuelve rowCount = filas devueltas (SELECT/RETURNING) o afectadas (DML).
// PGlite separa rows y affectedRows, asi que se reconstruye igual.
const adaptarResultado = (resultado, texto) => ({
  rows: resultado.rows ?? [],
  rowCount: resultado.rows?.length ? resultado.rows.length : (resultado.affectedRows ?? 0),
  command: comandoDe(texto),
  fields: (resultado.fields ?? []).map(campo => ({
    name: campo.name,
    dataTypeID: campo.dataTypeID
  }))
})

class LocalPool {
  constructor(dataDir) {
    this.dataDir = dataDir
    this.mutex = new Mutex()
    this.oyentes = new Map()
    this.cerrado = false
    this.pglite = new PGlite(dataDir)
  }

  on(evento, oyente) {
    if (!this.oyentes.has(evento)) this.oyentes.set(evento, [])
    this.oyentes.get(evento).push(oyente)
    return this
  }

  emitir(evento, ...args) {
    for (const oyente of this.oyentes.get(evento) ?? []) {
      try { oyente(...args) } catch { /* un oyente roto no debe tumbar la consulta */ }
    }
  }

  async query(texto, params) {
    if (this.cerrado) throw new Error('La base local ya esta cerrada.')
    const sql = typeof texto === 'string' ? texto : texto?.text
    try {
      const resultado = await this.pglite.query(sql, params ?? [])
      return adaptarResultado(resultado, sql)
    } catch (error) {
      error.query = sql
      throw error
    }
  }

  // Devuelve un cliente exclusivo: mientras no se llame a release(), ninguna
  // otra parte del bot puede intercalar consultas dentro de su transaccion.
  async connect() {
    if (this.cerrado) throw new Error('La base local ya esta cerrada.')
    const liberar = await this.mutex.adquirir()
    let liberado = false
    return {
      query: (texto, params) => this.query(texto, params),
      release: () => {
        if (liberado) return
        liberado = true
        liberar()
      }
    }
  }

  async end() {
    if (this.cerrado) return
    this.cerrado = true
    await this.pglite.close()
  }
}

export function createLocalPool(dataDir = localDatabasePath()) {
  return new LocalPool(dataDir)
}
