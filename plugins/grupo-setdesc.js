const handler = async (m, { conn, text }) => {
  if (!text) throw 'Escribe la nueva descripción del grupo.'
  await conn.groupUpdateDescription(m.chat, text)
  await m.react('✅')
}

handler.help = ['setdesc <texto>']
handler.tags = ['grupo']
handler.command = /^(setdesc|newdesc|descripcion)$/i
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
