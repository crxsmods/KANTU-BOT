import { toAudio } from '../lib/converter.js'

const handler = async (m, { conn }) => {
  const quoted = m.quoted || m
  const mime = quoted.mimetype || quoted.mediaType || ''
  if (!/video|audio/i.test(mime)) throw 'Responde a un video o audio para convertirlo a MP3.'

  await m.react('⏳')
  const media = await quoted.download()
  const audio = await toAudio(media, 'mp4')
  if (!audio?.data) throw 'No se pudo convertir el archivo.'
  await conn.sendMessage(m.chat, { audio: audio.data, mimetype: 'audio/mpeg' }, { quoted: m })
  await m.react('✅')
}

handler.help = ['tomp3']
handler.tags = ['convertidor']
handler.command = /^to(mp3|audio)$/i
handler.register = true

export default handler
