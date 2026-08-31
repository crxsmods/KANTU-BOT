import path from 'node:path'
import { access, copyFile, writeFile } from 'node:fs/promises'
import { runtimePaths } from './paths.js'

export const runtimeDataFiles = Object.freeze({
  audios: path.join(runtimePaths.data, 'audios.json')
})

const exists = async filename => {
  try {
    await access(filename)
    return true
  } catch {
    return false
  }
}

export async function ensureRuntimeDataFiles() {
  if (await exists(runtimeDataFiles.audios)) return
  const seed = path.resolve('src/audios.json')
  if (await exists(seed)) await copyFile(seed, runtimeDataFiles.audios)
  else await writeFile(runtimeDataFiles.audios, '{}\n', { flag: 'wx', mode: 0o600 })
}
