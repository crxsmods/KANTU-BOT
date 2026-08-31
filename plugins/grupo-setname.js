const handler = async (m, { conn, text }) => {
  if (!text) throw 'Escribe el nuevo nombre del grupo.'
  await conn.groupUpdateSubject(m.chat, text)
  await m.react('✅')
}

handler.help = ['setname <texto>']
handler.tags = ['grupo']
handler.command = /^(setname|newnombre|nuevonombre)$/i
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
