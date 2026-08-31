import { runtimeDataFiles } from '../lib/runtime-data.js'
import { readJsonFile } from '../lib/json-file.js'

const handler = async (m, { conn }) => {
  const audios = await readJsonFile(runtimeDataFiles.audios, {})
  const globalNames = Object.keys(audios.global || {}).sort()
  const localNames = Object.keys(audios[m.chat?.trim()] || {}).sort()
  const lines = [
    `*Audios de ${conn.user?.name || 'Kantu'}*`,
    '',
    'Escribe una frase exactamente como aparece, sin prefijo.',
    '',
    '*Globales*',
    ...(globalNames.length ? globalNames.map(name => `- ${name}`) : ['- Ninguno'])
  ]
  if (localNames.length) lines.push('', '*Este chat*', ...localNames.map(name => `- ${name}`))
  await m.reply(lines.join('\n'))
}

handler.help = ['menu2']
handler.tags = ['main']
handler.command = /^(menu2|audios|menuaudio|menuaudios|memuaudios|memuaudio|audio)$/i
handler.register = true

export default handler
