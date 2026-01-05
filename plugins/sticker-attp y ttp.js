import { sticker } from '../lib/sticker.js'
import fetch from 'node-fetch'
import { db } from '../lib/postgres.js';

let handler = async(m, { conn, text, args, usedPrefix, command }) => {
const userResult = await db.query('SELECT sticker_packname, sticker_author FROM usuarios WHERE id = $1', [m.sender]);
const user = userResult.rows[0] || {};
let f = user.sticker_packname || global.info.packname;
let g = (user.sticker_packname && user.sticker_author ? user.sticker_author : (user.sticker_packname && !user.sticker_author ? '' : global.info.author));

if (!text) return m.reply(`「 ꛕ 」 Por favor, ingresa el texto que deseas convertir en sticker ✍️\n\n*Uso:* ${usedPrefix + command} <texto>\n*Ejemplo:* ${usedPrefix + command} Hola mundo`)

let teks = encodeURI(text)
conn.fakeReply(m.chat, `「 ꛕ 」 Procesando tu solicitud... Generando sticker de texto ⏳\n\n> Por favor, espera un momento.`, '0@s.whatsapp.net', `Evita el uso excesivo de comandos.`, 'status@broadcast')

if (command == 'attp') {
if (text.length > 40) return m.reply(`「 ꛕ 」 Límite excedido: El texto para este formato no debe superar los 40 caracteres 📉`)
let res = await fetch(`https://api.neoxr.eu/api/attp?text=${teks}%21&color=%5B%22%23FF0000%22%2C+%22%2300FF00%22%2C+%22%230000FF%22%5D&apikey=${info.neoxr.key}`)
let json = await res.json()
if (!json.status) return m.reply('「 ꛕ 」 Servicio temporalmente fuera de línea. Por favor, intenta de nuevo en unos minutos 🛠️')
let stiker = await sticker(null, json.data.url, f, g)
conn.sendFile(m.chat, stiker, 'sticker.webp', '', m, true, { contextInfo: { 'forwardingScore': 200, 'isForwarded': false, externalAdReply:{ showAdAttribution: false, title: "✨ STICKER GENERATOR", body: "Kantu - Bot", mediaType: 2, sourceUrl: info.md, thumbnail: m.pp}}}, { quoted: m })
}

if (command == 'ttp' || command == 'brat') {
if (text.length > 300) return m.reply(`「 ꛕ 」 Texto demasiado largo: El límite de caracteres permitido es de 300 📏`)
let res = await fetch(`https://api.neoxr.eu/api/brat?text=${teks}&apikey=${info.neoxr.key}`)
let json = await res.json()
if (!json.status) return m.reply('「 ꛕ 」 Hubo un error al conectar con el servidor de generación. Inténtalo más tarde 📡')
let stiker = await sticker(null, json.data.url, f, g)
conn.sendFile(m.chat, stiker, 'sticker.webp', '', m, true, { contextInfo: { 'forwardingScore': 200, 'isForwarded': false, externalAdReply:{ showAdAttribution: false, title: "✨ STICKER GENERATOR", body: "Kantu - Bot", mediaType: 2, sourceUrl: info.md, thumbnail: m.pp}}}, { quoted: m })
}

if (command == 'brat2' || command == 'bratvid') {
if (text.length > 250) return m.reply(`「 ꛕ 」 El contenido supera el límite de 250 caracteres permitido para este formato 📝`)
let res = await fetch(`https://api.neoxr.eu/api/bratvid?text=${teks}&apikey=${info.neoxr.key}`)
let json = await res.json()
if (!json.status) return m.reply('「 ꛕ 」 No se pudo procesar el sticker animado en este momento. Reintenta más tarde 🔄')
let stiker = await sticker(null, json.data.url, f, g)
conn.sendFile(m.chat, stiker, 'sticker.webp', '', m, true, { contextInfo: { 'forwardingScore': 200, 'isForwarded': false, externalAdReply: { showAdAttribution: false, title: "✨ STICKER GENERATOR", body: "Kantu - Bot", mediaType: 2, sourceUrl: info.md, thumbnail: m.pp }}}, { quoted: m })
}
}
handler.help = ['attp', 'brat', 'bratvid'];
handler.tags = ['sticker']
handler.command = /^(attp|ttp|ttp2|ttp3|ttp4|attp2|brat|brat2|bratvid)$/i
handler.register = true
export default handler
