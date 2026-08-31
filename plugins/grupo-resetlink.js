const handler = async (m, { conn }) => {
  const code = await conn.groupRevokeInvite(m.chat)
  await conn.reply(m.chat, `✅ Enlace restablecido:\nhttps://chat.whatsapp.com/${code}`, m)
}

handler.help = ['resetlink']
handler.tags = ['grupo']
handler.command = /^(resetlink|revoke)$/i
handler.botAdmin = true
handler.admin = true
handler.group = true

export default handler
