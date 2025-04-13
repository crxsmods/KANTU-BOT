let handler  = async (m, { conn, usedPrefix: _p }) => {
let info = `*✅ BIENVENIDO A LOS GRUPOS OFICIALES*

  1) *${nn}*
  
  2) *${nnn}*
 
➤ *¡Visita streaming barato!!*
https://hackstorex.com

 ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

*ᴋᴀɴᴛᴜ - ʙᴏᴛ*
*${nnnttt}*`.trim() 
conn.reply(m.chat, info, m) 
//conn.fakeReply(m.chat, info, '0@s.whatsapp.net', '𝙏𝙝𝙚-l-𝙈𝘿', 'status@broadcast')
}
handler.help = ['grupos']
handler.tags = ['main']
handler.command = /^linkgc|grupos|gruposgatabot|gatabotgrupos|gruposdegatabot|groupofc|gruposgb|grupogb|groupgb$/i
handler.register = true 
export default handler
