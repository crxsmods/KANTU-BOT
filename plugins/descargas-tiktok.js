import axios from 'axios';

const handler = async (m, { conn, text, args, usedPrefix, command }) => {
    if (!text) throw `⚠️ *¿Qué TikTok buscar? 🤔*\n\n⚡ *Ingrese un enlace de TikTok para descargar el video*\n*Ej:* ${usedPrefix + command} https://vm.tiktok.com/xxxx`;
    
    if (!/(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok.com\/([^\s&]+)/gi.test(text)) throw `❌ Error`;

    const { key } = await conn.sendMessage(m.chat, { text: `*🐣 Tranquilo*\n▰▰▰▱▱▱▱▱▱\n𝙔𝙖 𝙚𝙨𝙩𝙤𝙮 𝙙𝙚𝙨𝙘𝙖𝙧𝙜𝙖𝙙𝙤...` }, { quoted: m });
    await delay(1000);
    
    const apiUrl = `https://api.siputzx.my.id/api/tiktok?url=${encodeURIComponent(text)}`;
    
    try {
        const response = await axios.get(apiUrl);
        
        if (response.data.status && response.data.data.success) {
            const videoUrls = response.data.data.urls;
            if (videoUrls.length > 0) {
                const videoUrl = videoUrls[0]; // Tomar el primer enlace
                await conn.sendMessage(m.chat, { video: { url: videoUrl }, caption: `*🔰 Aquí está tu video de TikTok*` }, { quoted: m });
                await conn.sendMessage(m.chat, { text: `✅ 𝘾𝙤𝙢𝙥𝙡𝙚𝙩𝙖𝙙𝙤\n▰▰▰▰▰▰▰▰▰\n𝘼𝙦𝙪𝙞 𝙚𝙨𝙩𝙖 𝙩𝙪 𝙫𝙞𝙙𝙚𝙤 💫`, edit: key });
            } else {
                throw new Error("No se encontraron enlaces de video.");
            }
        } else {
            throw new Error("Error al obtener el video de TikTok.");
        }
    } catch (error) {
        console.error(error);
        await conn.sendMessage(m.chat, { text: `⚠️ Ocurrió un error al intentar descargar el video. Intenta nuevamente.` }, { quoted: m });
        m.react(`❌`);
    }
};

const delay = time => new Promise(res => setTimeout(res, time));

handler.help = ['tiktok'];
handler.tags = ['downloader'];
handler.command = /^(tt|tiktok)(dl|nowm)?$/i;
handler.limit = 1;

export default handler;
