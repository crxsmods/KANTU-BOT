import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { db, getSubbotConfig } from '../lib/postgres.js'
import { runtimePaths } from '../lib/paths.js'
import { runtimeDataFiles } from '../lib/runtime-data.js'
import { readJsonFile } from '../lib/json-file.js'
import { safeFetchBuffer } from '../lib/safe-fetch.js'

const MAX_AUDIO_BYTES = 15 * 1024 * 1024

const localAudio = async source => {
  const resolved = path.resolve(source)
  const roots = [path.resolve('media'), runtimePaths.data]
  if (!roots.some(root => resolved === root || resolved.startsWith(`${root}${path.sep}`))) {
    throw new Error('Ruta de audio local fuera de los directorios permitidos.')
  }
  const buffer = await readFile(resolved)
  if (buffer.length > MAX_AUDIO_BYTES) throw new Error('Audio local demasiado grande.')
  return buffer
}

const resolveAudio = async source => {
  if (typeof source !== 'string' || !source) throw new Error('Fuente de audio invalida.')
  if (source.startsWith('data:audio/')) {
    const encoded = source.split(',', 2)[1] || ''
    const buffer = Buffer.from(encoded, 'base64')
    if (!buffer.length || buffer.length > MAX_AUDIO_BYTES) throw new Error('Audio embebido invalido o demasiado grande.')
    return buffer
  }
  if (source.startsWith('./') || source.startsWith('/') || /^[A-Za-z]:[\\/]/.test(source)) return localAudio(source)
  return safeFetchBuffer(source, { maxBytes: MAX_AUDIO_BYTES, timeoutMs: 20_000 })
}

export async function before(m, { conn }) {
  if (!m || m.fromMe || !m.originalText || m.originalText.length > 500) return
  const botId = conn?.user?.id?.replace(/:\d+/, '')
  const config = await getSubbotConfig(botId)
  const prefixes = Array.isArray(config?.prefix) ? config.prefix : ['.', '/', '#']
  const text = m.originalText.trim()
  if (!text || prefixes.some(prefix => text.startsWith(prefix))) return

  try {
    const result = await db.query('SELECT audios FROM group_settings WHERE group_id = $1', [m.chat])
    if (!result.rows[0]?.audios) return
  } catch (error) {
    console.error('[audios] No se pudo consultar la configuracion:', error)
    return
  }

  const audios = await readJsonFile(runtimeDataFiles.audios, {})
  const key = text.toLowerCase()
  const entry = audios[m.chat?.trim()]?.[key] || audios.global?.[key]
  if (!entry) return
  const candidates = Array.isArray(entry.audios) ? entry.audios : [entry.audio]
  const selected = candidates[Math.floor(Math.random() * candidates.length)]

  try {
    await conn.sendPresenceUpdate('recording', m.chat)
    const audio = await resolveAudio(selected)
    await conn.sendMessage(m.chat, { audio, mimetype: 'audio/mpeg' }, { quoted: m })
  } catch (error) {
    console.error('[audios] No se pudo enviar el audio:', error)
  }
}
