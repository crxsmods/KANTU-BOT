import { readFileSync } from 'node:fs'

const databaseHostname = value => {
  try {
    return new URL(value).hostname
  } catch {
    return ''
  }
}

export const isLocalDatabase = value => [
  'localhost',
  '127.0.0.1',
  '::1'
].includes(databaseHostname(value))

const connectionStringSSLParameters = [
  'ssl', 'sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'uselibpqcompat'
]

export function sanitizeDatabaseConnectionString(value) {
  const url = new URL(value)
  const removed = []
  for (const parameter of connectionStringSSLParameters) {
    if (url.searchParams.has(parameter)) {
      removed.push(parameter)
      url.searchParams.delete(parameter)
    }
  }
  return { connectionString: url.toString(), removed }
}

const databaseCA = () => {
  if (process.env.DB_SSL_CA_BASE64) {
    const ca = Buffer.from(process.env.DB_SSL_CA_BASE64.trim(), 'base64').toString('utf8')
    if (!ca.includes('BEGIN CERTIFICATE')) throw new Error('DB_SSL_CA_BASE64 no contiene un certificado PEM valido.')
    return ca
  }
  if (process.env.DB_SSL_CA) return process.env.DB_SSL_CA.replaceAll('\\n', '\n')
  if (process.env.DB_SSL_CA_FILE) return readFileSync(process.env.DB_SSL_CA_FILE, 'utf8')
  return undefined
}

// Los hosts remotos validan el certificado por defecto. Los escapes inseguros
// existen solo para diagnostico local y se bloquean en produccion.
export const resolveDatabaseSSL = value => {
  const local = isLocalDatabase(value)
  const sslDisabled = process.env.DB_SSL === 'false'
  const insecureAllowed = process.env.ALLOW_INSECURE_DB_TLS === 'true'
  const production = process.env.NODE_ENV === 'production'

  if (sslDisabled) {
    if (!local && production && !insecureAllowed) {
      throw new Error('DB_SSL=false no esta permitido para una base remota en produccion.')
    }
    if (!local) console.warn('[DB] Advertencia: conexion remota sin TLS habilitada explicitamente.')
    return false
  }
  if (local && process.env.DB_SSL !== 'true') return false

  const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
  if (!rejectUnauthorized && production && !insecureAllowed) {
    throw new Error('DB_SSL_REJECT_UNAUTHORIZED=false no esta permitido en produccion.')
  }
  if (!rejectUnauthorized) console.warn('[DB] Advertencia: certificado TLS sin validar habilitado explicitamente.')

  const ca = databaseCA()
  if (ca && !ca.includes('BEGIN CERTIFICATE')) throw new Error('El CA de PostgreSQL no tiene formato PEM valido.')
  return { rejectUnauthorized, ...(ca ? { ca } : {}) }
}
