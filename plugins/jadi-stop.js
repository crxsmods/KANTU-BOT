import { rm, stat } from 'node:fs/promises'
import path from 'node:path'
import { runtimePaths } from '../lib/paths.js'
import { managedTimeout } from '../lib/lifecycle.js'

const isDirectory = async directory => {
  try {
    return (await stat(directory)).isDirectory()
  } catch {
    return false
  }
}

const handler = async (m, { conn }) => {
  const id = String(conn.user?.id || '').replace(/:\d+/, '').split('@')[0].replace(/[^0-9]/g, '')
  if (!/^\d{7,15}$/.test(id)) return m.reply('Este comando solo puede usarse desde un SubBot valido.')

  const sessionPath = path.resolve(runtimePaths.subbotSessions, id)
  const expectedParent = `${runtimePaths.subbotSessions}${path.sep}`
  if (!sessionPath.startsWith(expectedParent) || !(await isDirectory(sessionPath))) {
    return m.reply('Este comando solo puede usarse desde una instancia de SubBot.')
  }

  try {
    await m.reply('Cerrando esta sesion de SubBot...')
    await conn.logout()
    managedTimeout(async () => {
      await rm(sessionPath, { recursive: true, force: true })
      console.log(`[SubBot ${id}] Sesion cerrada y eliminada por su propietario.`)
    }, 2_000)
  } catch (error) {
    console.error(`[SubBot ${id}] No se pudo cerrar la sesion:`, error)
    await m.reply('No se pudo cerrar la sesion del SubBot.')
  }
}

handler.help = ['stop']
handler.tags = ['jadibot']
handler.command = /^(stop)$/i
handler.owner = true
handler.private = true
handler.register = true

export default handler
