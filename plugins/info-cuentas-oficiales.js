let media = 'https://qu.ax/dcAc.mp4'
let handler = async (m, { conn, command }) => {
let fkontak = { "key": { "participants":"0@s.whatsapp.net", "remoteJid": "status@broadcast", "fromMe": false, "id": "Halo" }, "message": { "contactMessage": { "vcard": `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD` }}, "participant": "0@s.whatsapp.net" }
let str = `\`『 ＣＵＥＮＴＡＳ ＯＦＩＣＩＡＬＥＳ 』\`

\`𝐊𝐚𝐧𝐭𝐮 - 𝐁𝐨𝐭\`
> *${bot}*

 ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
 
\`『 GITHUB 』\`   
* *${md}* 

\`『 GRUPO 』\`   
* *${nn}* 

\`『  GRUPO 2  』\`   
* *${nnn}* 

\`『  GRUPO 3 』\`   
* *${nna}* 



 ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
\`『 SITIO WEB』\`   
• https://hackstorex.com

${wm}`
await conn.reply(m.chat, str, fkontak, {contextInfo: {externalAdReply :{ mediaUrl: null, mediaType: 1, description: null, title: wm, body: '', previewType: 0, thumbnail: img.getRandom(), sourceUrl: redes.getRandom()}}})}
//conn.sendFile(m.chat, media, mp4', str, fkontak)}
handler.help = ['cuentaoficial']
handler.tags = ['main']
handler.command = /^cuentasoficiales|cuentas|cuentaofc|cuentaoficial$/i
handler.register = true
export default handler
