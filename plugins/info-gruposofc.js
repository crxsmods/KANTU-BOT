let handler = async (m, { conn, usedPrefix: _p }) => {
// Definimos los enlaces de forma segura para evitar el ReferenceError
let canalNovedades = global.nna || 'https://whatsapp.com/channel/code' 

let texto = `「 ꛕ 」 Directorio de comunidades y soporte oficial. 🌐

🔹 *Canales Principales*

◦ 🚨 *HackStoreX* : _Comunidad Dónde Se Sortean Cuentas Streaming Gratis a Nuestra Comunidad_

${global.info?.nn || 'Enlace no disponible'}

◦ ⭐ *Kantu Bot* : _Comunidad Dónde Está El Bot Oficial  "Kantu" con soporte Oficial del bot y actualizaciónes_ ${global.info?.nn2 || 'Enlace no disponible'}

🔹 *SwalloX Host*
◦ Centro de soporte para dudas y sugerencias técnicas además de Promociónes, Descuentos, Servidores Gratis y más: 

${global.info?.nn6 || 'Enlace no disponible'}

🔹 *Desarrollo y Novedades* 
◦ Canal informativo sobre actualizaciones y despliegues: 

https://whatsapp.com/channel/0029Vatpz6a0QeafN2T8K838
━━━━━━━━━━━━━━━━━━━━

🌐 *Redes Alternas*
◦ ${global.info?.nn4 || 'Enlace no disponible'}
◦ ${global.info?.nn5 || 'Enlace no disponible'}

_Manténgase informado únicamente a través de nuestros canales verificados._`.trim() 

conn.reply(m.chat, texto, m) 
}

handler.help = ['grupos']
handler.tags = ['main']
handler.command = /^linkgc|grupos|gruposgatabot|gatabotgrupos|gruposdegatabot|groupofc|gruposgb|grupogb|groupgb$/i
handler.register = true 

export default handler
