import { spawnSync } from 'node:child_process'
import path from 'node:path'

const npmCli = process.env.npm_execpath
const npm = npmCli ? process.execPath : (process.platform === 'win32' ? 'npm.cmd' : 'npm')
const npmPrefix = npmCli ? [npmCli] : []
const npmEnvironment = {
  ...process.env,
  npm_config_cache: path.join(process.cwd(), 'tmp', 'npm-cache')
}
const steps = [
  ['lint', ['run', 'lint']],
  ['query catalog', ['run', 'queries:check']],
  ['public release', ['run', 'check:public']],
  ['audit', ['audit', '--omit=dev', '--audit-level=high']]
]

for (const [name, args] of steps) {
  console.log(`\n=== ${name} ===`)
  const result = spawnSync(npm, [...npmPrefix, ...args], {
    stdio: 'inherit',
    windowsHide: true,
    env: npmEnvironment
  })
  if (result.status !== 0) {
    if (result.error) console.error(result.error.message)
    console.error(`Verificacion detenida en: ${name}`)
    process.exit(result.status || 1)
  }
}
console.log('\nVerificacion completa.')
