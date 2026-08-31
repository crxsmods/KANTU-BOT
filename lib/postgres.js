import './load-env.js'
import pg from 'pg'
import { resolveDatabaseSSL as secureDatabaseSSL, sanitizeDatabaseConnectionString } from './database-tls.js'
import { resolveDatabaseUrl } from './database-url.js'
import { connectWithRetry } from './database-retry.js'
import { createLocalPool, localDatabasePath } from './local-database.js'

export { resolveDatabaseSSL } from './database-tls.js'

const { Pool } = pg

const normalizedConnectionString = resolveDatabaseUrl()

// Sin DATABASE_URL el bot usa PostgreSQL embebido en una carpeta local. Es el
// modo por defecto: una copia recien descargada funciona sin configurar nada y
// sus datos no salen de la maquina. Definir DATABASE_URL sigue siendo posible
// y tiene prioridad.
const useLocalDatabase = !normalizedConnectionString
let connectionString = null

if (!useLocalDatabase) {
  if (!/^postgres(?:ql)?:\/\//i.test(normalizedConnectionString)) {
    throw new Error('DATABASE_URL no tiene formato PostgreSQL válido.')
  }

  const sanitizedDatabase = sanitizeDatabaseConnectionString(normalizedConnectionString)
  connectionString = sanitizedDatabase.connectionString
  if (sanitizedDatabase.removed.length) {
    console.warn(`[DB] Se ignoraron parametros TLS de DATABASE_URL (${sanitizedDatabase.removed.join(', ')}); usa DB_SSL_*.`)
  }
}

const numberFromEnv = (name, fallback) => {
  const value = Number.parseInt(process.env[name] || '', 10)
  return Number.isFinite(value) && value > 0 ? value : fallback
}

export const databaseMode = useLocalDatabase ? 'local' : 'direct'
export const db = useLocalDatabase
  ? createLocalPool()
  : new Pool({
      connectionString,
      application_name: 'KantuBot',
      max: numberFromEnv('DB_POOL_MAX', 10),
      connectionTimeoutMillis: numberFromEnv('DB_CONNECTION_TIMEOUT_MS', 15_000),
      idleTimeoutMillis: numberFromEnv('DB_IDLE_TIMEOUT_MS', 30_000),
      keepAlive: true,
      keepAliveInitialDelayMillis: 10_000,
      ssl: secureDatabaseSSL(connectionString)
    })

db.on('error', error => {
  console.error('[DB] Error inesperado en una conexión inactiva:', error.message)
})

const groupColumns = [
  ['welcome', 'BOOLEAN DEFAULT true'],
  ['bye', 'BOOLEAN DEFAULT false'],
  ['detect', 'BOOLEAN DEFAULT true'],
  ['antifake', 'BOOLEAN DEFAULT false'],
  ['antifake_prefixes', 'TEXT[] DEFAULT ARRAY[]::TEXT[]'],
  ['auto_approve', 'BOOLEAN DEFAULT false'],
  ['antilink', 'BOOLEAN DEFAULT false'],
  ['antilink2', 'BOOLEAN DEFAULT false'],
  ['modohorny', 'BOOLEAN DEFAULT false'],
  ['audios', 'BOOLEAN DEFAULT false'],
  ['nsfw_horario', 'TEXT'],
  ['antistatus', 'BOOLEAN DEFAULT false'],
  ['modoadmin', 'BOOLEAN DEFAULT false'],
  ['photowelcome', 'BOOLEAN DEFAULT false'],
  ['photobye', 'BOOLEAN DEFAULT false'],
  ['autolevelup', 'BOOLEAN DEFAULT true'],
  ['swelcome', 'TEXT'],
  ['sbye', 'TEXT'],
  ['spromote', 'TEXT'],
  ['sdemote', 'TEXT'],
  ['banned', 'BOOLEAN DEFAULT false'],
  ['expired', 'BIGINT DEFAULT 0'],
  ['memory_ttl', 'INTEGER DEFAULT 86400'],
  ['sautorespond', 'TEXT'],
  ['primary_bot', 'TEXT']
]

const userColumns = [
  ['nombre', 'TEXT'],
  ['registered', 'BOOLEAN DEFAULT false'],
  ['num', 'TEXT'],
  ['lid', 'TEXT'],
  ['banned', 'BOOLEAN DEFAULT false'],
  ['warn_pv', 'BOOLEAN DEFAULT false'],
  ['warn', 'INTEGER DEFAULT 0'],
  ['warn_antiporn', 'INTEGER DEFAULT 0'],
  ['warn_estado', 'INTEGER DEFAULT 0'],
  ['edad', 'INTEGER'],
  ['money', 'INTEGER DEFAULT 100'],
  ['limite', 'INTEGER DEFAULT 10'],
  ['exp', 'INTEGER DEFAULT 0'],
  ['banco', 'INTEGER DEFAULT 0'],
  ['level', 'INTEGER DEFAULT 0'],
  ['role', "TEXT DEFAULT 'novato'"],
  ['reg_time', 'TIMESTAMP'],
  ['serial_number', 'TEXT'],
  ['sticker_packname', 'TEXT'],
  ['sticker_author', 'TEXT'],
  ['email', 'TEXT'],
  ['ry_time', 'BIGINT DEFAULT 0'],
  ['lastwork', 'BIGINT DEFAULT 0'],
  ['lastmiming', 'BIGINT DEFAULT 0'],
  ['lastclaim', 'BIGINT DEFAULT 0'],
  ['dailystreak', 'BIGINT DEFAULT 0'],
  ['lastcofre', 'BIGINT DEFAULT 0'],
  ['lastrob', 'BIGINT DEFAULT 0'],
  ['lastslut', 'BIGINT DEFAULT 0'],
  ['timevot', 'BIGINT DEFAULT 0'],
  ['wait', 'BIGINT DEFAULT 0'],
  ['crime', 'BIGINT DEFAULT 0'],
  ['marry', 'TEXT'],
  ['marry_request', 'TEXT'],
  ['razon_ban', 'TEXT'],
  ['avisos_ban', 'INTEGER DEFAULT 0'],
  ['gender', 'TEXT'],
  ['birthday', 'DATE']
]

const characterColumns = [
  ['name', 'TEXT'],
  ['url', 'TEXT'],
  ['tipo', 'TEXT'],
  ['anime', 'TEXT'],
  ['rareza', 'TEXT'],
  ['price', 'INTEGER DEFAULT 0'],
  ['previous_price', 'INTEGER'],
  ['claimed_by', 'TEXT'],
  ['for_sale', 'BOOLEAN DEFAULT false'],
  ['seller', 'TEXT'],
  ['votes', 'INTEGER DEFAULT 0'],
  ['last_removed_time', 'BIGINT']
]

const subbotColumns = [
  ['tipo', "TEXT DEFAULT 'null'"],
  ['name', 'TEXT'],
  ['logo_url', 'TEXT'],
  ['prefix', "TEXT[] DEFAULT ARRAY['/', '.', '#']"],
  ['mode', "TEXT DEFAULT 'public'"],
  ['owners', 'TEXT[]'],
  ['anti_private', 'BOOLEAN DEFAULT false'],
  ['anti_call', 'BOOLEAN DEFAULT true'],
  ['privacy', 'BOOLEAN DEFAULT false'],
  ['prestar', 'BOOLEAN DEFAULT false']
]

const addColumns = async (client, table, columns) => {
  for (const [name, definition] of columns) {
    await client.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${name} ${definition}`)
  }
}

const migrations = [
  {
    version: '001_base_tables',
    run: async client => {
      await client.query(`CREATE TABLE IF NOT EXISTS group_settings (group_id TEXT PRIMARY KEY)`)
      await client.query(`CREATE TABLE IF NOT EXISTS usuarios (id TEXT PRIMARY KEY)`)
      await client.query(`CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        is_group BOOLEAN DEFAULT true,
        timestamp BIGINT,
        is_active BOOLEAN DEFAULT true,
        bot_id TEXT,
        joined BOOLEAN DEFAULT true
      )`)
      await client.query(`CREATE TABLE IF NOT EXISTS messages (
        user_id TEXT,
        group_id TEXT,
        message_count INTEGER DEFAULT 0,
        PRIMARY KEY (user_id, group_id)
      )`)
      await client.query(`CREATE TABLE IF NOT EXISTS characters (id SERIAL PRIMARY KEY)`)
      await client.query(`CREATE TABLE IF NOT EXISTS subbots (id TEXT PRIMARY KEY)`)
      await client.query(`CREATE TABLE IF NOT EXISTS reportes (
        id SERIAL PRIMARY KEY,
        sender_id TEXT NOT NULL,
        sender_name TEXT,
        mensaje TEXT NOT NULL,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        enviado BOOLEAN DEFAULT false,
        tipo TEXT DEFAULT 'reporte'
      )`)
      await client.query(`CREATE TABLE IF NOT EXISTS chat_memory (
        chat_id TEXT PRIMARY KEY,
        history JSONB,
        updated_at TIMESTAMP DEFAULT NOW()
      )`)
      await client.query(`CREATE TABLE IF NOT EXISTS stats (
        command TEXT PRIMARY KEY,
        count INTEGER DEFAULT 1
      )`)
    }
  },
  {
    version: '002_application_columns',
    run: async client => {
      await addColumns(client, 'group_settings', groupColumns)
      await addColumns(client, 'usuarios', userColumns)
      await addColumns(client, 'characters', characterColumns)
      await addColumns(client, 'subbots', subbotColumns)
    }
  },
  {
    version: '003_token_storage',
    // Compatibilidad con instalaciones existentes: la version se conserva,
    // pero los despliegues nuevos no crean almacenes de secretos en PostgreSQL.
    run: async () => {}
  },
  {
    version: '004_indexes',
    run: async client => {
      await client.query(`CREATE INDEX IF NOT EXISTS idx_usuarios_num ON usuarios (num)`)
      await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_lid ON usuarios (lid) WHERE lid IS NOT NULL`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_messages_group_count ON messages (group_id, message_count DESC)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_characters_claimed_by ON characters (claimed_by)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_characters_for_sale ON characters (for_sale) WHERE for_sale = true`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_chats_bot_joined ON chats (bot_id, joined)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_reportes_pending ON reportes (enviado, fecha)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_chat_memory_updated ON chat_memory (updated_at)`)
    }
  },
  {
    version: '005_user_email',
    run: async client => {
      await client.query('ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email TEXT')
    }
  }
]

// Con DB_RUN_MIGRATIONS=false el bot no crea nada: comprueba que el esquema ya
// este completo para fallar al arrancar, con un mensaje util, en vez de fallar
// en el primer comando que toque una tabla ausente.
const requiredTables = [
  'usuarios', 'group_settings', 'chats', 'messages', 'characters',
  'subbots', 'reportes', 'chat_memory', 'stats'
]

async function assertSchemaReady(client) {
  const { rows } = await client.query(
    'SELECT tablename FROM pg_tables WHERE schemaname = $1', ['public']
  )
  const present = new Set(rows.map(row => row.tablename))
  const missing = requiredTables.filter(name => !present.has(name))
  if (missing.length) {
    throw new Error(
      `Faltan tablas en la base (${missing.join(', ')}). El propietario debe ` +
      'arrancar una vez sin DB_RUN_MIGRATIONS=false para crear el esquema.'
    )
  }
}

async function initializeDatabase() {
  const client = await connectWithRetry(() => db.connect(), {
    attempts: Math.min(numberFromEnv('DB_CONNECT_ATTEMPTS', 5), 10),
    baseDelayMs: Math.min(numberFromEnv('DB_CONNECT_RETRY_MS', 1_000), 30_000),
    maxDelayMs: 30_000,
    onRetry: ({ attempt, attempts, delayMs, error }) => {
      console.warn(`[DB] Conexion transitoria fallida (${attempt}/${attempts}): ${error.message}. Reintento en ${delayMs} ms.`)
    }
  })
  let lockAcquired = false

  try {
    const status = await client.query(`
      SELECT current_database() AS database_name,
             current_user AS database_user,
             version() AS server_version
    `)

    // Las copias publicas se conectan con un rol sin permisos de DDL. Ahi el
    // esquema ya existe y no debe tocarse: PostgreSQL comprueba el permiso
    // sobre el esquema ANTES que la existencia de la tabla, asi que hasta un
    // CREATE TABLE IF NOT EXISTS fallaria.
    // En modo local siempre se migra: la carpeta nace vacia y el esquema debe
    // crearse en el primer arranque. La omision solo aplica a una base remota
    // con un rol sin permisos de DDL.
    if (process.env.DB_RUN_MIGRATIONS === 'false' && !useLocalDatabase) {
      await assertSchemaReady(client)
      console.log('[DB] PostgreSQL conectado; migraciones omitidas (DB_RUN_MIGRATIONS=false).')
      return status.rows[0]
    }

    await client.query(`SELECT pg_advisory_lock(hashtext('kantu_bot_schema_migrations'))`)
    lockAcquired = true
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT NOW()
    )`)

    for (const migration of migrations) {
      const applied = await client.query('SELECT 1 FROM schema_migrations WHERE version = $1', [migration.version])
      if (applied.rowCount) continue

      await client.query('BEGIN')
      try {
        await migration.run(client)
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [migration.version])
        await client.query('COMMIT')
      } catch (error) {
        await client.query('ROLLBACK')
        throw new Error(`Falló la migración ${migration.version}: ${error.message}`, { cause: error })
      }
    }

    console.log(useLocalDatabase
      ? `[DB] Base local lista en ${localDatabasePath()} (sin DATABASE_URL; los datos no salen de esta maquina).`
      : '[DB] PostgreSQL conectado y esquema actualizado.')
    return status.rows[0]
  } finally {
    if (lockAcquired) {
      await client.query(`SELECT pg_advisory_unlock(hashtext('kantu_bot_schema_migrations'))`).catch(() => {})
    }
    client.release()
  }
}

export const dbReady = initializeDatabase()

// getSubbotConfig se llama varias veces por mensaje y la base está en Supabase
// (ca-central-1), así que cada lectura costaba un viaje de red completo.
// TTL corto para que un cambio de prefijo/modo se refleje casi al instante.
const subbotConfigCache = new Map()
const SUBBOT_CACHE_TTL = 10_000

export function invalidateSubbotConfig(botId) {
  if (!botId) return subbotConfigCache.clear()
  subbotConfigCache.delete(String(botId).replace(/:\d+/, ''))
}

export async function getSubbotConfig(botId) {
  const defaults = {
    prefix: ['/', '.', '#'],
    mode: 'public',
    anti_private: true,
    anti_call: false,
    owners: [],
    name: null,
    logo_url: null,
    privacy: null,
    prestar: null,
    tipo: null
  }

  if (!botId) return defaults

  const cleanId = String(botId).replace(/:\d+/, '')
  const cached = subbotConfigCache.get(cleanId)
  if (cached && Date.now() - cached.at < SUBBOT_CACHE_TTL) return cached.value

  try {
    await dbReady
    const result = await db.query('SELECT * FROM subbots WHERE id = $1', [cleanId])
    const value = result.rows[0] || defaults
    subbotConfigCache.set(cleanId, { at: Date.now(), value })
    return value
  } catch (error) {
    console.error('[DB] Error al obtener configuración del subbot:', error.message)
    return defaults
  }
}

export async function closeDatabase() {
  await db.end()
}
