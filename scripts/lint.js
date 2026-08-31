import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'

const root = process.cwd()
const ignoredDirectories = new Set([
  '.git', '.npm', 'node_modules', 'tmp', 'backups', 'BotSession', 'jadibot', 'coverage',
  'simple-baileys-bot'
])

const sourceFiles = []
const walk = directory => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) walk(fullPath)
    else if (/\.(?:js|mjs)$/i.test(entry.name)) sourceFiles.push(fullPath)
  }
}
walk(root)

const failures = []
const sortedFiles = sourceFiles.sort()
for (const filename of sortedFiles) {
  try {
    const source = fs.readFileSync(filename, 'utf8')
    new vm.SourceTextModule(source, { identifier: filename })
  } catch (error) {
    failures.push(`${path.relative(root, filename)}: ${error.message}`)
  }
}

const securityRules = [
  ['TLS sin validacion', /rejectUnauthorized\s*:\s*false/g],
  ['desactivacion global de TLS', /NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0/g],
  ['token de Telegram', /\b\d{6,}:[A-Za-z0-9_-]{30,}\b/g],
  ['token de GitHub', /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g],
  ['clave de OpenAI', /\bsk-[A-Za-z0-9_-]{20,}\b/g],
  ['clave de Google', /\bAIza[A-Za-z0-9_-]{20,}\b/g],
  ['propietario privilegiado fijo', /BOT_OWNERS\s*\|\|\s*['"]\d{7,}/g],
  ['destino personal fijo', /(?:const|let|var)\s+\w*owner\w*\s*=\s*['"]\d{7,}@(?!newsletter)/gi],
  ['envio directo a destino fijo', /sendMessage\s*\(\s*['"]\d{7,}@(?!newsletter)/g],
  ['ejecucion dinamica de codigo', /\b(?:eval|Function)\s*\(|\.constructor\s*\(/g]
]

for (const filename of sourceFiles) {
  if (filename.endsWith(path.join('scripts', 'lint.js'))) continue
  const source = fs.readFileSync(filename, 'utf8')
  for (const [label, pattern] of securityRules) {
    pattern.lastIndex = 0
    if (pattern.test(source)) failures.push(`${path.relative(root, filename)}: ${label}`)
  }
  if (
    !filename.endsWith(path.join('lib', 'lifecycle.js')) &&
    /\bsetInterval\s*\(/.test(source)
  ) {
    failures.push(`${path.relative(root, filename)}: intervalo no administrado; usa managedInterval`)
  }
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const directDependencies = {
  ...packageJson.dependencies,
  ...packageJson.optionalDependencies,
  ...packageJson.devDependencies
}
const forbiddenDependencies = [
  'fluent-ffmpeg', 'link-preview-js', 'node-gtts', 'openai', 'request', 'wa-sticker-formatter'
]
for (const dependency of forbiddenDependencies) {
  if (dependency in directDependencies) failures.push(`package.json: dependencia retirada presente (${dependency})`)
}

if (failures.length) {
  console.error(`Lint fallo con ${failures.length} problema(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exitCode = 1
} else {
  console.log(`Lint OK: ${sourceFiles.length} archivos, sintaxis y reglas de seguridad verificadas.`)
}
