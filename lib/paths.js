import path from 'node:path'
import { mkdir } from 'node:fs/promises'

const resolveRuntimePath = (name, fallback) => path.resolve(process.env[name]?.trim() || fallback)

export const runtimePaths = Object.freeze({
  botSession: resolveRuntimePath('BOT_SESSION_DIR', './BotSession'),
  subbotSessions: resolveRuntimePath('SUBBOT_SESSION_DIR', './jadibot'),
  tmp: resolveRuntimePath('TMP_DIR', './tmp'),
  backups: resolveRuntimePath('BACKUP_DIR', './backups'),
  data: resolveRuntimePath('DATA_DIR', './data')
})

export function validateRuntimePaths() {
  const entries = Object.entries(runtimePaths)
  const workspace = path.resolve(process.cwd())
  for (const [name, directory] of entries) {
    if (directory === path.parse(directory).root || directory === workspace) {
      throw new Error(`La ruta de ejecucion ${name} apunta a un directorio demasiado amplio: ${directory}`)
    }
  }

  for (let left = 0; left < entries.length; left++) {
    for (let right = left + 1; right < entries.length; right++) {
      const [leftName, leftPath] = entries[left]
      const [rightName, rightPath] = entries[right]
      const leftPrefix = `${leftPath}${path.sep}`
      const rightPrefix = `${rightPath}${path.sep}`
      if (leftPath === rightPath || leftPath.startsWith(rightPrefix) || rightPath.startsWith(leftPrefix)) {
        throw new Error(`Las rutas ${leftName} y ${rightName} no pueden coincidir ni estar anidadas.`)
      }
    }
  }
  return runtimePaths
}

export async function ensureRuntimeDirectories() {
  validateRuntimePaths()
  await Promise.all([
    runtimePaths.botSession,
    runtimePaths.subbotSessions,
    runtimePaths.tmp,
    runtimePaths.backups,
    runtimePaths.data
  ].map(directory => mkdir(directory, { recursive: true, mode: 0o700 })))
}
