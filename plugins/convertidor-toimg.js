import { webp2png } from '../lib/webp2mp4.js'

const handler = async (m, { conn, usedPrefix, command }) => {
  if (!m.quoted || !/webp/i.test(m.quoted.mimetype || '')) {
    throw `Responde a un sticker con ${usedPrefix + command}`
  }

  await m.react('⏳')
  const media = await m.quoted.download()
  const image = await webp2png(media)
  await conn.sendFile(m.chat, image, 'sticker.png', null, m)
  await m.react('✅')
}

handler.help = ['toimg (responder sticker)']
handler.tags = ['convertidor']
handler.command = /^(toimg|jpg|img)$/i
handler.register = true

export default handler
