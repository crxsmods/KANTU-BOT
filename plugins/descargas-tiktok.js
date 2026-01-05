import fg from 'api-dylux';
import axios from 'axios';
import fetch from 'node-fetch';
import cheerio from 'cheerio';
const userRequests = {};

const handler = async (m, { conn, text, args, usedPrefix, command }) => {
// 1. Mensaje de uso inicial
if (!text) return m.reply(`「 ꛕ 」 *DESCARGADOR DE TIKTOK*\n\n> _Ingrese un enlace de TikTok válido para procesar la descarga del video._\n\n📌 *EJEMPLO:*\n↳ ${usedPrefix + command} https://vm.tiktok.com/ZM6T4X1RY/`)

if (!/(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok.com\/([^\s&]+)/gi.test(text)) return m.reply(`「 ꛕ 」 *ENLACE INVÁLIDO*\n\nEl link proporcionado no pertenece a TikTok o es incorrecto. ⚠️`)

// 2. Control de solicitudes simultáneas
if (userRequests[m.sender]) return await conn.reply(m.chat, `「 ꛕ 」 *SOLICITUD EN CURSO*\n\n@${m.sender.split('@')[0]}, ya tienes una descarga activa. Por favor, espera a que finalice para solicitar otra. ⏳`, m)

userRequests[m.sender] = true;

// 3. Barra de progreso profesional
const { key } = await conn.sendMessage(m.chat, { text: `「 ꛕ 」 *INICIANDO DESCARGA*\n▰▰▰▱▱▱▱▱▱\n> _Obteniendo datos del servidor..._` }, { quoted: m });
await delay(1000);
await conn.sendMessage(m.chat, { text: `「 ꛕ 」 *PROCESANDO MULTIMEDIA*\n▰▰▰▰▰▱▱▱▱\n> _Extrayendo video sin marca de agua..._`, edit: key });
await delay(1000);
await conn.sendMessage(m.chat, { text: `「 ꛕ 」 *FINALIZANDO PROCESO*\n▰▰▰▰▰▰▰▱▱\n> _Preparando el envío del archivo..._`, edit: key });

try {
const downloadAttempts = [async () => {
const tTiktok = await tiktokdlF(args[0]);
return tTiktok.video;
},
async () => {
  const { data } = await axios.get(`https://api.delirius.store/download/tiktok?url=${args[0]}`);
  const video = data?.data?.meta?.media?.find(m => m.type === 'video');
  return video?.org || video?.hd || video?.wm;
},
async () => {
const response = await axios.get(`https://api.dorratz.com/v2/tiktok-dl?url=${args[0]}`);
return response.data.data.media.org;
},
async () => {
const p = await fg.tiktok(args[0]);
return p.nowm;
}];

let videoUrl = null;
for (const attempt of downloadAttempts) {
try {
videoUrl = await attempt();
if (videoUrl) break; 
} catch (err) {
console.error(`Error en intento: ${err.message}`);
continue; 
}}

if (!videoUrl) throw new Error('No se pudo obtener el recurso.');

// 4. Envío del archivo con caption profesional
await conn.sendFile(m.chat, videoUrl, 'tt.mp4', `「 ꛕ 」 *VIDEO DE TIKTOK*\n\n✅ *Contenido descargado exitosamente.*`, m);

await conn.sendMessage(m.chat, { text: `「 ꛕ 」 *COMPLETADO*\n▰▰▰▰▰▰▰▰▰`, edit: key });

} catch (e) {
console.log(e);
m.react(`❌`);
m.reply(`「 ꛕ 」 *ERROR DE DESCARGA*\n\nNo fue posible procesar el enlace. Intente nuevamente en unos minutos. ⚠️`);
handler.limit = false;
} finally {
delete userRequests[m.sender];
}};

handler.help = ['tiktok'];
handler.tags = ['downloader'];
handler.command = /^(tt|tiktok)(dl|nowm)?$/i;
handler.limit = 1;

export default handler;

const delay = time => new Promise(res => setTimeout(res, time));

async function tiktokdlF(url) {
  const gettoken = await axios.get('https://tikdown.org/id');
  const $ = cheerio.load(gettoken.data);
  const token = $('#download-form > input[type=hidden]:nth-child(2)').attr('value');
  const param = { url: url, _token: token };
  const { data } = await axios.request('https://tikdown.org/getAjax?', {
    method: 'post',
    data: new URLSearchParams(Object.entries(param)),
    headers: {
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'user-agent': 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.88 Safari/537.36'
    }
  });
  const getdata = cheerio.load(data.html);
  if (data.status) {
    return {
      status: true,
      thumbnail: getdata('img').attr('src'),
      video: getdata('div.download-links > div:nth-child(1) > a').attr('href'),
      audio: getdata('div.download-links > div:nth-child(2) > a').attr('href')
    };
  } else {
    return { status: false };
  }
}
