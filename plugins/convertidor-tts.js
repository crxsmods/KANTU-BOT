import { promises as fs } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { runtimePaths } from '../lib/paths.js'
import { runFfmpeg } from '../lib/ffmpeg.js'
import { safeFetchBuffer } from '../lib/safe-fetch.js'

const MAX_TEXT_LENGTH = 600
const MAX_CHUNK_LENGTH = 180

export function chunkTtsText(input, maxLength = MAX_CHUNK_LENGTH) {
  const text = String(input || '').replace(/\s+/g, ' ').trim()
  if (!text) throw new Error('No hay texto para convertir.')
  if ([...text].length > MAX_TEXT_LENGTH) {
    throw new Error(`El texto supera el máximo de ${MAX_TEXT_LENGTH} caracteres.`)
  }

  const words = text.split(' ')
  const chunks = []
  let current = ''
  for (const word of words) {
    const characters = [...word]
    if (characters.length > maxLength) {
      if (current) chunks.push(current)
      for (let index = 0; index < characters.length; index += maxLength) {
        chunks.push(characters.slice(index, index + maxLength).join(''))
      }
      current = ''
      continue
    }
    const candidate = current ? `${current} ${word}` : word
    if ([...candidate].length <= maxLength) current = candidate
    else {
      chunks.push(current)
      current = word
    }
  }
  if (current) chunks.push(current)
  return chunks
}

async function synthTts(text, language, outputPath) {
  const chunks = chunkTtsText(text)
  const audio = []
  for (let index = 0; index < chunks.length; index++) {
    const endpoint = new URL('https://translate.google.com/translate_tts')
    endpoint.search = new URLSearchParams({
      ie: 'UTF-8',
      client: 'tw-ob',
      tl: language,
      q: chunks[index],
      total: String(chunks.length),
      idx: String(index),
      textlen: String(chunks[index].length)
    }).toString()
    audio.push(await safeFetchBuffer(endpoint, {
      maxBytes: 2 * 1024 * 1024,
      timeoutMs: 15_000,
      headers: { 'user-agent': 'Mozilla/5.0 KantuBot/2.1' }
    }))
  }
  await fs.writeFile(outputPath, Buffer.concat(audio), { flag: 'wx' })
}

async function applyEffect(inputPath, outputPath, style) {
  const filters = {
    anonymous: 'asetrate=44100*0.75,lowpass=f=1400,highpass=f=180',
    robot: 'chorus=0.6:0.9:55:0.4:0.25:2',
    grave: 'asetrate=44100*0.80',
    aguda: 'asetrate=44100*1.20',
    niño: 'asetrate=44100*1.25,treble=g=5',
    demonio: 'asetrate=44100*0.65,aecho=0.8:0.9:1000:0.3'
  }
  await runFfmpeg([
    '-nostdin', '-hide_banner', '-loglevel', 'error', '-y',
    '-i', inputPath,
    '-af', filters[style] || 'anull',
    '-ac', '1', '-ar', '48000',
    '-c:a', 'libopus', '-b:a', '48k',
    outputPath
  ])
}

const handler = async (m, { conn, args, usedPrefix, command }) => {
  const usage = `「 🎙️ *SÍNTESIS DE VOZ* 」\n\n` +
    `> Convierte texto en audio con diferentes efectos o idiomas.\n\n` +
    `🔹 *MODOS:* anonymous, robot, grave, aguda, niño, demonio\n` +
    `🌐 *IDIOMAS:* es, en, pt, fr, etc.\n\n` +
    `📌 *USO:* ${usedPrefix + command} <modo|idioma> <texto>`

  if (!args.length && !m.quoted?.text) return m.reply(usage)

  const first = String(args[0] || '').toLowerCase()
  const voices = new Set(['anonymous', 'robot', 'grave', 'aguda', 'niño', 'demonio'])
  let effect = null
  let language = 'es'
  let text

  if (voices.has(first)) {
    effect = first
    text = args.slice(1).join(' ')
  } else if (/^[a-z]{2}(?:-[a-z]{2})?$/.test(first)) {
    language = first
    text = args.slice(1).join(' ')
  } else {
    text = args.join(' ')
  }
  text ||= m.quoted?.text || ''
  if (!text.trim()) return m.reply('「⚠️」 Escribe el texto que deseas convertir.')

  await fs.mkdir(runtimePaths.tmp, { recursive: true })
  const id = randomUUID()
  const inputPath = path.join(runtimePaths.tmp, `${id}.mp3`)
  const outputPath = path.join(runtimePaths.tmp, `${id}.ogg`)

  try {
    chunkTtsText(text)
    await m.react('🎙️')
    await conn.sendPresenceUpdate('recording', m.chat)
    await synthTts(text, language, inputPath)
    await applyEffect(inputPath, outputPath, effect)
    const buffer = await fs.readFile(outputPath)
    await conn.sendMessage(m.chat, {
      audio: buffer,
      mimetype: 'audio/ogg; codecs=opus',
      ptt: true
    }, { quoted: m })
  } catch (error) {
    console.error('[TTS]', error.message)
    await m.reply(`「❌」 No se pudo procesar la síntesis de voz: ${error.message}`)
  } finally {
    await Promise.all([
      fs.unlink(inputPath).catch(() => {}),
      fs.unlink(outputPath).catch(() => {})
    ])
  }
}

handler.help = ['tts <modo|idioma> <texto>']
handler.tags = ['convertidor']
handler.command = /^g?tts$/i
handler.register = true

export default handler
