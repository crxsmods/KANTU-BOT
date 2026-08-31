import '../lib/load-env.js'
import fs from 'node:fs/promises'
import path from 'node:path'
import { checkFfmpeg } from '../lib/ffmpeg.js'
import { ensureRuntimeDirectories, runtimePaths, validateRuntimePaths } from '../lib/paths.js'
import { ensureRuntimeDataFiles } from '../lib/runtime-data.js'
import { validateRequiredIntegrations } from '../lib/integrations.js'
import { normalizeDatabaseConnectionString } from '../lib/database-url.js'
import { resolveBackupSchemas } from '../lib/backup-scope.js'

const errors = []
const warnings = []
const ok = []
const fail = message => errors.push(message)
const warn = message => warnings.push(message)
const pass = message => ok.push(message)

const major = Number.parseInt(process.versions.node.split('.')[0], 10)
if (major === 24) pass(`Node ${process.versions.node}`)
else fail(`Se requiere Node 24 LTS; version actual: ${process.versions.node}`)

if (process.env.NODE_ENV === 'production') pass('NODE_ENV=production')
else fail('NODE_ENV debe ser production.')

const owners = (process.env.BOT_OWNERS || '').split(',').map(value => value.trim()).filter(Boolean)
if (!owners.length) fail('Define BOT_OWNERS explicitamente para esta instancia.')
else if (owners.some(owner => !/^\d{7,15}$/.test(owner))) fail('BOT_OWNERS contiene un numero invalido.')
else pass(`${owners.length} propietario(s) configurado(s)`)

// El metodo se elige por consola en el primer arranque. PAIR_METHOD solo fija
// el valor por defecto para un despliegue desatendido, asi que es opcional.
const pairMethod = (process.env.PAIR_METHOD || '').trim()
if (!pairMethod) {
  pass('Metodo de vinculacion interactivo (PAIR_METHOD sin definir)')
} else if (!['1', '2'].includes(pairMethod)) {
  fail('PAIR_METHOD debe ser 1 (QR) o 2 (codigo de vinculacion).')
} else if (pairMethod === '2' && !/^\d{10,15}$/.test((process.env.PAIR_NUMBER || '').replace(/\D/g, ''))) {
  fail('PAIR_NUMBER es obligatorio y debe tener entre 10 y 15 digitos cuando PAIR_METHOD=2.')
} else {
  pass(`Metodo de vinculacion por defecto (${pairMethod === '1' ? 'QR' : 'codigo'})`)
}

// Sin DATABASE_URL el bot usa la base local de ./database, que no necesita
// configuracion. Solo se valida la cadena cuando el operador define una propia.
let databaseUrl
if ((process.env.DATABASE_URL || '').trim()) {
  try {
    databaseUrl = new URL(normalizeDatabaseConnectionString(process.env.DATABASE_URL))
    if (!/^postgres(?:ql)?:$/.test(databaseUrl.protocol) || !databaseUrl.hostname || !databaseUrl.username || !databaseUrl.password) {
      throw new Error('incompleta')
    }
    pass('DATABASE_URL tiene estructura valida')
  } catch {
    fail('DATABASE_URL no es una cadena PostgreSQL completa. Dejala vacia para usar la base local.')
  }
} else {
  pass('Base de datos local en ./database (sin DATABASE_URL)')
}

if (databaseUrl) {
  const local = ['localhost', '127.0.0.1', '[::1]', '::1'].includes(databaseUrl.hostname)
  if (process.env.ALLOW_INSECURE_DB_TLS === 'true') fail('ALLOW_INSECURE_DB_TLS=true es solo para diagnostico y no puede desplegarse.')
  if (!local && process.env.DB_SSL === 'false') fail('DB_SSL=false no es seguro para una base remota.')
  if (!local && process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false') fail('DB_SSL_REJECT_UNAUTHORIZED=false no es seguro en produccion.')
  const tlsParameters = ['ssl', 'sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'uselibpqcompat']
    .filter(parameter => databaseUrl.searchParams.has(parameter))
  if (tlsParameters.length) {
    fail(`Quita parametros TLS de DATABASE_URL (${tlsParameters.join(', ')}); configura DB_SSL_* de forma explicita.`)
  }

  const caConfigured = Boolean(process.env.DB_SSL_CA || process.env.DB_SSL_CA_BASE64 || process.env.DB_SSL_CA_FILE)
  if (!local && /supabase\.(?:com|co)$/i.test(databaseUrl.hostname) && !caConfigured) {
    warn('Supabase puede requerir la CA de tu proyecto; confirmalo con npm run db:check.')
  }
  if (process.env.DB_SSL_CA_FILE) {
    try {
      const ca = await fs.readFile(path.resolve(process.env.DB_SSL_CA_FILE), 'utf8')
      if (!ca.includes('BEGIN CERTIFICATE')) throw new Error('PEM invalido')
      pass('CA de PostgreSQL legible')
    } catch (error) {
      fail(`DB_SSL_CA_FILE no es utilizable: ${error.message}`)
    }
  }
}

try {
  validateRuntimePaths()
  await ensureRuntimeDirectories()
  await ensureRuntimeDataFiles()
  for (const [name, directory] of Object.entries(runtimePaths)) {
    const probe = path.join(directory, `.write-probe-${process.pid}`)
    await fs.writeFile(probe, 'ok', { flag: 'wx', mode: 0o600 })
    await fs.unlink(probe)
    pass(`Ruta ${name} escribible`)
  }
} catch (error) {
  fail(`Rutas de ejecucion invalidas: ${error.message}`)
}

const ffmpeg = await checkFfmpeg()
if (ffmpeg.available) pass(`FFmpeg disponible (${ffmpeg.path})`)
else if (process.env.REQUIRE_FFMPEG === 'false') warn(`FFmpeg no disponible: ${ffmpeg.error}`)
else fail(`FFmpeg no disponible: ${ffmpeg.error}`)

const integrations = validateRequiredIntegrations()
if (integrations.unknown.length) fail(`Integraciones desconocidas: ${integrations.unknown.join(', ')}`)
if (integrations.missing.length) fail(`Integraciones requeridas sin secreto: ${integrations.missing.join(', ')}`)
if (!integrations.unknown.length && !integrations.missing.length) pass('Integraciones requeridas configuradas')

const sessionFile = path.join(runtimePaths.botSession, 'creds.json')
try {
  await fs.access(sessionFile)
  pass('Sesion principal de WhatsApp presente')
} catch {
  const message = 'No existe la sesion principal; el primer arranque requerira vinculacion.'
  if (process.env.REQUIRE_WHATSAPP_SESSION === 'true') fail(message)
  else warn(message)
}

try {
  pass('Esquemas de respaldo permitidos: ' + resolveBackupSchemas().join(', '))
} catch (error) {
  fail(error.message)
}

for (const message of ok) console.log(`OK    ${message}`)
for (const message of warnings) console.warn(`WARN  ${message}`)
for (const message of errors) console.error(`ERROR ${message}`)
console.log(`\nResultado: ${errors.length} error(es), ${warnings.length} advertencia(s).`)
if (errors.length) process.exitCode = 1
