import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const errors = []
const warnings = []
const fail = message => errors.push(message)

const requiredFiles = [
  'LICENSE',
  'README.md',
  'SECURITY.md',
  'lib/query-catalog.json',
  '.env.example',
  '.gitignore'
]
for (const filename of requiredFiles) {
  if (!fs.existsSync(path.join(root, filename))) fail(`Falta ${filename}.`)
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
if (packageJson.license !== 'MIT') fail('package.json debe declarar license=MIT.')
if (packageJson.private !== true) fail('package.json debe conservar private=true para impedir una publicacion accidental en npm.')

const ignoredEntries = new Set(
  fs.readFileSync(path.join(root, '.gitignore'), 'utf8')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
)
for (const entry of [
  '.env',
  '.env.*',
  'BotSession/',
  'jadibot/',
  'tmp/',
  'backups/',
  'data/',
  'certs/',
  'database/'
]) {
  if (!ignoredEntries.has(entry)) fail(`.gitignore no protege ${entry}`)
}
if (!ignoredEntries.has('!.env.example')) fail('.gitignore debe permitir .env.example.')

const envExample = fs.readFileSync(path.join(root, '.env.example'), 'utf8')
if (!/^BOT_OWNERS=521X+$/m.test(envExample)) fail('.env.example debe usar un propietario de ejemplo.')
if (!/^GITHUB_REPOSITORY=$/m.test(envExample)) fail('GITHUB_REPOSITORY debe quedar vacio en el ejemplo publico.')
if (!/^REPORT_GROUP_JID=$/m.test(envExample)) fail('REPORT_GROUP_JID debe quedar vacio en el ejemplo publico.')

const sourceFiles = []
const ignoredDirectories = new Set([
  '.git', '.npm', 'node_modules', 'tmp', 'backups', 'BotSession', 'jadibot', 'coverage',
  'simple-baileys-bot'
])
const walk = directory => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue
    const filename = path.join(directory, entry.name)
    if (entry.isDirectory()) walk(filename)
    else if (/\.(?:js|mjs)$/i.test(entry.name)) sourceFiles.push(filename)
  }
}
walk(root)

const publicSafetyRules = [
  ['propietario privilegiado fijo', /BOT_OWNERS\s*\|\|\s*['"]\d{7,}/g],
  ['destino personal fijo', /(?:const|let|var)\s+\w*owner\w*\s*=\s*['"]\d{7,}@(?!newsletter)/gi],
  ['envio directo a destino fijo', /sendMessage\s*\(\s*['"]\d{7,}@(?!newsletter)/g],
  ['token de Telegram', /\b\d{6,}:[A-Za-z0-9_-]{30,}\b/g],
  ['token de GitHub', /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g],
  ['clave de OpenAI', /\bsk-[A-Za-z0-9_-]{20,}\b/g]
]
for (const filename of sourceFiles) {
  if (filename.endsWith(path.join('scripts', 'check-public-release.js'))) continue
  const source = fs.readFileSync(filename, 'utf8')
  for (const [label, pattern] of publicSafetyRules) {
    pattern.lastIndex = 0
    if (pattern.test(source)) fail(`${path.relative(root, filename)}: ${label}`)
  }
}

const git = spawnSync('git', ['ls-files', '-z'], {
  cwd: root,
  encoding: 'utf8',
  windowsHide: true
})
if (git.status === 0) {
  const tracked = git.stdout.split('\0').filter(Boolean).map(filename => filename.replaceAll('\\', '/'))
  const sensitive = tracked.filter(filename =>
    filename === '.env' ||
    (filename.startsWith('.env.') && filename !== '.env.example') ||
    /^(?:BotSession|jadibot|tmp|backups|data|certs|simple-baileys-bot)\//.test(filename)
  )
  if (sensitive.length) fail(`Git contiene rutas privadas: ${sensitive.join(', ')}`)
} else {
  warnings.push('No hay un repositorio Git inicializado; se validaron las reglas de exclusion, no el indice.')
}

for (const warning of warnings) console.warn(`WARN  ${warning}`)
for (const error of errors) console.error(`ERROR ${error}`)
if (errors.length) {
  console.error(`\nPublicacion bloqueada: ${errors.length} problema(s).`)
  process.exitCode = 1
} else {
  console.log(`Publicacion tecnica OK: ${sourceFiles.length} archivos revisados y rutas sensibles protegidas.`)
}
