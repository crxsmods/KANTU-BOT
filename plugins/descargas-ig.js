import fetch from 'node-fetch';
import axios from 'axios';
import { instagramdl } from '@bochilteam/scraper';
import { fileTypeFromBuffer } from 'file-type';
const userRequests = {};

const handler = async (m, { conn, args, command, usedPrefix }) => {
const datas = global;

// 1. Mensaje de uso (Prefijo aplicado)
if (!args[0]) return m.reply(`「 ꛕ 」 *DESCARGADOR DE INSTAGRAM*\n\n> _Ingrese un enlace de Instagram (Video, Reel o Foto) para procesar la descarga._\n\n📌 *EJEMPLO:*\n↳ ${usedPrefix + command} https://www.instagram.com/p/C60xXk3J-sb/`) 

// 2. Control de solicitudes (Prefijo aplicado)
if (userRequests[m.sender]) return await conn.reply(m.chat, `「 ꛕ 」 *SOLICITUD EN CURSO*\n\n@${m.sender.split('@')[0]}, ya tienes una descarga activa. Por favor, espera a que finalice para solicitar otra. ⏳`, m)

userRequests[m.sender] = true;
await m.react('⌛');

try {
const downloadAttempts = [
async () => {
const res = await fetch(`https://api.siputzx.my.id/api/d/igdl?url=${args[0]}`);
const data = await res.json();
return { url: data.data[0].url, type: data.data[0].url.includes('.webp') ? 'image' : 'video', caption: '「 ꛕ 」 *Contenido procesado exitosamente* ✅',
}},
async () => {
const res = await fetch(`${info.fgmods.url}/downloader/igdl?url=${args[0]}&apikey=${info.fgmods.key}`);
const data = await res.json();
const result = data.result[0];
const fileType = result.url.endsWith('.jpg') || result.url.endsWith('.png') ? 'image' : 'video';
return { url: result.url, type: fileType, caption: '「 ꛕ 」 *Archivo obtenido correctamente* ✅',
}},
async () => {
const apiUrl = `${info.apis}/download/instagram?url=${encodeURIComponent(args[0])}`;
const apiResponse = await fetch(apiUrl);
const delius = await apiResponse.json();
return { url: delius.data[0].url, type: delius.data[0].type, caption: '「 ꛕ 」 *Descarga finalizada* ✅',
}},
async () => {
const resultssss = await instagramdl(args[0]);
return { url: resultssss[0].url, type: resultssss[0].url.endsWith('.mp4') ? 'video' : 'image', caption: '「 ꛕ 」 *Resultado listo* ✅' };
},
];

let fileData = null;
for (const attempt of downloadAttempts) {
try {
fileData = await attempt();
if (fileData) break; 
} catch (err) {
console.error(`Error en intento: ${err.message}`);
continue; 
}}

if (!fileData) throw new Error('No se pudo descargar el archivo');
const fileName = fileData.type === 'image' ? 'ig.jpg' : 'ig.mp4';
await conn.sendFile(m.chat, fileData.url, fileName, fileData.caption, m);
await m.react('✅');

} catch (e) {
await m.react('❌');
// 3. Mensaje de error (Prefijo aplicado)
m.reply('「 ꛕ 」 *ERROR DE DESCARGA*\n\nNo fue posible procesar el enlace. Asegúrese de que la cuenta sea pública y el link sea correcto. ⚠️');
console.log(e);
handler.limit = 0;
} finally {
delete userRequests[m.sender];
}};

handler.help = ['instagram <link>'];
handler.tags = ['downloader'];
handler.command = /^(instagramdl|instagram|igdl|ig)(2|3)?$/i;
handler.limit = 1;
handler.register = true;

export default handler;
