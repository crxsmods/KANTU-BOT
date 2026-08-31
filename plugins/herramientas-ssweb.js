import fetch from 'node-fetch'
let handler = async (m, { conn, command, args }) => {
if (!args[0]) return m.reply(`⚠️ 𝐈𝐧𝐠𝐫𝐞𝐬𝐚 𝐮𝐧 𝐥𝐢𝐧𝐤 𝐩𝐚𝐫𝐚 𝐬𝐚𝐜𝐚𝐫 𝐜𝐚𝐩𝐭𝐮𝐫𝐚, ej: https://example.com`)
await m.react('⌛')
try {
let ss = await (await fetch(`https://api.dorratz.com/ssweb?url=${args[0]}`)).buffer()
conn.sendFile(m.chat, ss, 'error.png', '✅', m)
await m.react('✅')
} catch {
handler.limit = false
await m.react('❌')
}}
handler.help = ['ss', 'ssweb'].map(v => v + ' *<url>*')
handler.tags = ['tools']
handler.command = /^ss(web)?f?$/i
handler.register = true 
handler.limit = 1
export default handler
