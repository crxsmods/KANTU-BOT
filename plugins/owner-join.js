 import { db, getSubbotConfig } from '../lib/postgres.js'

const linkRegex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i

let handler = async (m, { conn, text, isOwner }) => {
let quotedText = m.quoted?.text || ""
let extText = m.quoted?.message?.extendedTextMessage?.text || ""
let allText = `${quotedText}\n${extText}\n${text}`
let link = allText.match(linkRegex)?.[0]
let [_, code] = link ? link.match(linkRegex) : []

if (!code) throw `「 ꛕ 」 No se detectó un enlace válido. Por favor, proporciona un link de invitación para que el bot pueda ingresar 📎\n\n*Guía de uso:*\n/join <enlace> [tiempo]\n\n*Ejemplos:*\n- /join ${info.nn}\n- /join ${info.nn2} 2 día\n- /join ${info.nn} 1 mes`;

let waMeMatch = allText.match(/wa\.me\/(\d{8,})/)
let solicitante = waMeMatch ? waMeMatch[1] : m.sender.split('@')[0]
const botConfig = await getSubbotConfig(conn.user.id)
const prestar = botConfig.prestar === undefined ? true : botConfig.prestar
const timeMatch = text.match(/(\d+)\s*(minuto|hora|día|dias|mes)/i)
let time, unit
if (!prestar && isOwner) {
time = timeMatch ? parseInt(timeMatch[1]) : 1
unit = timeMatch ? timeMatch[2].toLowerCase() : 'día'
} else {
time = timeMatch ? parseInt(timeMatch[1]) : 30
unit = timeMatch ? timeMatch[2].toLowerCase() : 'minuto'
}

let timeInMs
if (unit.includes('minuto')) {
timeInMs = time * 60 * 1000
} else if (unit.includes('hora')) {
timeInMs = time * 60 * 60 * 1000
} else if (unit.includes('día') || unit.includes('dias')) {
timeInMs = time * 24 * 60 * 60 * 1000
} else if (unit.includes('mes')) {
timeInMs = time * 30 * 24 * 60 * 60 * 1000
}

if (!prestar && !isOwner) {
await m.reply(`「 ꛕ 」 Solicitud enviada a mi desarrollador para su revisión 📩\n\n┏──────────────\n┊ 『 📑 CONDICIONES 』\n┗─────────────❐\n│ᐉⴰ1️⃣┊ El grupo será evaluado manualmente.\n│ᐉⴰ2️⃣┊ Se requiere un mínimo de 50 miembros.\n│ᐉⴰ3️⃣┊ El grupo debe cumplir las normativas.\n│ᐉⴰ4️⃣┊ Disponibilidad sujeta a saturación.\n\n「 ꛕ 」 Por favor, mantenga la paciencia mientras se procesa su petición. \n\n*Apoya el proyecto:* ${[info.yt, info.md].getRandom()}`)
let ownerJid = "5217121649714@s.whatsapp.net";
if (ownerJid !== conn.user.id) {
await conn.sendMessage(ownerJid, {text: `┏──────────────\n┊ 『 📥 NUEVA SOLICITUD 』\n┊ 「 ꛕ 」 𝑫𝒆𝒗 𝑩𝒚 𝑪𝒓𝒙𝒔𝑴𝒐𝒅𝒔\n┗─────────────❐\n│ᐉⴰ👤┊ *Usuario:* wa.me/${m.sender.split('@')[0]}\n│ᐉⴰ🔗┊ *Link:* ${link}\n│ᐉⴰ⏳┊ *Duración:* ${time} ${unit}`, contextInfo: { mentionedJid: [m.sender] }});
} 
return;
}

if (prestar || isOwner) {
if (!isOwner) {
const costPerHour = 100
const cost = Math.ceil((timeInMs / (60 * 60 * 1000)) * costPerHour)
let { rows } = await db.query('SELECT limite FROM usuarios WHERE id = $1', [m.sender])
let limite = rows[0]?.limite ?? 0
if (limite < cost) return m.reply(`「 ꛕ 」 Saldo insuficiente. Necesitas un total de *${cost} diamantes* para procesar esta solicitud 💎`)
await db.query('UPDATE usuarios SET limite = limite - $1 WHERE id = $2', [cost, m.sender])
await m.reply(`「 ꛕ 」 Procesando unión... Por favor espere 3 segundos ⏳\n\n> Inversión: *${cost} diamantes*`)
}

let res
try {
res = await conn.groupAcceptInvite(code)
} catch (e) {
console.error("Error al unirse al grupo:", e)
return m.reply("「 ꛕ 」 Error técnico: No fue posible acceder al grupo. Verifica que el enlace sea vigente ❌")
}

await new Promise(r => setTimeout(r, 3000))
let groupMeta = await conn.groupMetadata(res)
let groupName = groupMeta.subject || "este grupo"
let mes = `┏──────────────\n┊ 『 🤖 KANTU - BOT\n┗─────────────❐\n\n¡Hola! Es un gusto saludarlos. He sido invitado por *@${solicitante}* para asistir en este grupo.\n\n│ᐉⴰ📜┊ *Menú:* #menu\n│ᐉⴰ⏳┊ *Estancia:* ${time} ${unit}\n\n「 ꛕ 」 Espero serles de gran utilidad.`
await conn.sendMessage(res, { text: mes, contextInfo: { mentionedJid: [`${solicitante}@s.whatsapp.net`] } })
await db.query('INSERT INTO group_settings (group_id, expired) VALUES ($1, $2) ON CONFLICT (group_id) DO UPDATE SET expired = $2', [res, Date.now() + timeInMs])
await m.reply(`「 ꛕ 」 El bot se ha vinculado exitosamente al grupo por un periodo de *${time} ${unit}* ✅`)
}}
handler.help = ['join [chat.whatsapp.com] [tiempo]']
handler.tags = ['owner']
handler.command = /^unete|join|nuevogrupo|unir|unite|unirse|entra|entrar$/i
handler.register = true
export default handler
