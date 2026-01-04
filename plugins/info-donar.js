import fs from 'fs';

let handler = async (m, { conn, command }) => {
let fkontak = { "key": { "participants":"0@s.whatsapp.net", "remoteJid": "status@broadcast", "fromMe": false, "id": "Halo" }, "message": { "contactMessage": { "vcard": `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD` }}, "participant": "0@s.whatsapp.net" }

let pp = fs.readFileSync('./media/Menu2.jpg');
let name = m.pushName 

let txt = `「 ꛕ 」 **CENTRO DE CONTRIBUCIÓN Y SOPORTE** 📈

Estimado(a) ${name}, el desarrollo y mantenimiento de *HackStoreX* es posible gracias al apoyo voluntario de nuestra comunidad. Si desea colaborar para mantener la estabilidad de nuestros servidores y la continuidad del proyecto, puede realizar su aporte mediante los siguientes canales oficiales. 🚀

─────────────────────

💳 **MÉTODOS DE TRANSFERENCIA**

*🔹 PayPal (Global):*
https://paypal.me/CrxsMods

*🔹 Transferencia Interbancaria (México):*
• *Banco:* STP
• *CLABE:* 728969000077556515
• *Concepto:* Soporte
• *Beneficiario:* [Tu Nombre / Crxs]

*🔹 Depósito en Efectivo (OXXO):*
• *Referencia:* 2242 1704 2064 4281

─────────────────────

📂 *OTRAS FORMAS DE COLABORAR*

Si desea apoyar de otra manera puede hacerlo Recomendando Nuestro Host "SwalloX" ( dash.swallox.com ) y nosostros te daremos servidores*GRATIS Lifetime* toda su ayuda será bienvenida. 📁

*🎬 Plataforma Educativa (YouTube):*
${info.yt}

*⭐ Repositorio Oficial (GitHub):*
${info.md}

*🔗 Portal Web:*
https://HackStoreX.com

> Su contribución garantiza que este servicio siga siendo accesible para todos. Agradecemos su generosidad. ⚙️`

await conn.sendFile(m.chat, pp, 'error.jpg', txt, fkontak, null, { contextInfo: {
forwardingScore: 9999999,
isForwarded: true, 
mentionedJid:[m.sender],
externalAdReply: {
showAdAttribution: false,
renderLargerThumbnail: false,
title: '「 ꛕ 」 ᴾᵘᵉᵈᵉ ᵃᵖᵒʸᵃʳ ⁿᵘᵉˢᵗʳᵒ ʳᵉᵖᵒˢᶦᵗᵒʳᶦᵒ ᶜᵒⁿ ᵉˢᵗʳᵉˡˡᶦᵗᵃˢ', 
body: 'HackStoreX.com',
mediaType: 2, 
thumbnailUrl: m.pp, 
mediaUrl: info.md, 
sourceUrl: info.md, 
}}});
}

handler.help = ['donar']
handler.tags = ['main']
handler.command = /^dona(te|si)|donar|apoyar|paypal|donating|comprar|host|Swallox|swallox|comprarhost|creditos$/i
handler.register = true

export default handler
