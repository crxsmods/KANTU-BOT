import acrcloud from 'acrcloud';
import { integrationConfig, requireIntegration } from '../lib/integrations.js';

const handler = async (m) => {
requireIntegration('acrcloud');
const acr = new acrcloud({
host: integrationConfig.acrcloud.host,
access_key: integrationConfig.acrcloud.accessKey,
access_secret: integrationConfig.acrcloud.accessSecret,
});
const q = m.quoted ? m.quoted : m;
const mime = (q.msg || q).mimetype || '';
if (/audio|video/.test(mime)) {
if ((q.msg || q).seconds > 20) return m.reply('⚠️ ᴇʟ ᴀʀᴄʜɪᴠᴏ ǫᴜᴇ ᴄᴀʀɢᴀ ᴇs ᴅᴇᴍᴀsɪᴀᴅᴏ ɢʀᴀɴᴅᴇ, ʟᴇ sᴜɢᴇʀɪᴍᴏs ǫᴜᴇ ᴄᴏʀᴛᴇ ᴇʟ ᴀʀᴄʜɪᴠᴏ ɢʀᴀɴᴅᴇ ᴀ ᴜɴ ᴀʀᴄʜɪᴠᴏ ᴍᴀ́s ᴘᴇǫᴜᴇɴ̃ᴏ, 10-20 sᴇɢᴜɴᴅᴏs ʟᴏs ᴅᴀᴛᴏs ᴅᴇ ᴀᴜᴅɪᴏ sᴏɴ sᴜғɪᴄɪᴇɴᴛᴇs ᴘᴀʀᴀ ɪᴅᴇɴᴛɪғɪᴄᴀʀ');
const media = await q.download();
const res = await acr.identify(media);
const {code, msg} = res.status;
if (code !== 0) throw msg;
const {title, artists, album, genres, release_date} = res.metadata.music[0];
const txt = `*\`RESULTADOS DE LA BÚSQUEDA*\`

• 📌 𝐓𝐢𝐭𝐮𝐥𝐨: ${title}
• 👨‍🎤 𝐀𝐫𝐭𝐢𝐬𝐭𝐚: ${artists !== undefined ? artists.map((v) => v.name).join(', ') : 'No encontrado'}
• 💾 𝐀𝐥𝐛𝐮𝐦: ${album.name || 'No encontrado'}
• 🌐 𝐆𝐞𝐧𝐞𝐫𝐨: ${genres !== undefined ? genres.map((v) => v.name).join(', ') : 'No encontrado'}
• 📆 𝐅𝐞𝐜𝐡𝐚 𝐝𝐞 𝐥𝐚𝐧𝐳𝐚𝐦𝐢𝐞𝐧𝐭𝐨: ${release_date || 'No encontrado'}
`.trim();
m.reply(txt);
} else throw '*⚠️ 𝐑𝐞𝐬𝐩𝐨𝐧𝐝𝐞 𝐚 𝐮𝐧 𝐚𝐮𝐝𝐢𝐨*';
};
handler.help = ['quemusica']
handler.tags = ['tools']
handler.command = /^quemusica|quemusicaes|whatmusic$/i;
handler.register = true 
export default handler;
