import path from 'node:path'
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'

export async function readJsonFile(filename, fallback = {}) {
  try {
    return JSON.parse(await readFile(filename, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') return fallback
    throw error
  }
}

export async function writeJsonAtomic(filename, value) {
  const directory = path.dirname(filename)
  await mkdir(directory, { recursive: true, mode: 0o700 })
  const temporary = path.join(directory, `.${path.basename(filename)}.${randomUUID()}.tmp`)
  try {
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx', mode: 0o600 })
    await rename(temporary, filename)
  } finally {
    await unlink(temporary).catch(() => {})
  }
}
