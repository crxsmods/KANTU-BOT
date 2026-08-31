import fetch from 'node-fetch';
import axios from 'axios';

const userRequests = {};

const handler = async (m, { conn, args, command, usedPrefix }) => {
    // 1. Validación de enlace
    const usage = `「📥」 *DESCARGADOR DE FACEBOOK*\n\n` +
        `> _Ingrese un enlace de Facebook (Video, Reel o Watch) para procesar la descarga._\n\n` +
        `📌 *EJEMPLO:* \n` +
        `↳ ${usedPrefix + command} https://www.facebook.com/share/r/KantuBot/`;

    if (!args[0] || !args[0].match(/www.facebook.com|fb.watch/g)) {
        return m.reply(usage);
    }

    // 2. Control de solicitudes simultáneas
    if (userRequests[m.sender]) {
        return conn.reply(m.chat, `「⏳」 *Solicitud en curso*\n\n@${m.sender.split('@')[0]}, ya tienes una descarga activa. Por favor, espera a que finalice para solicitar otra.`, m, { mentions: [m.sender] });
    }

    userRequests[m.sender] = true;
    m.react(`⌛`);

    try {
        const downloadAttempts = [
            async () => {
                const api = await fetch(`https://api.agatz.xyz/api/facebook?url=${args[0]}`);
                const data = await api.json();
                const videoUrl = data.data.hd || data.data.sd;
                const imageUrl = data.data.thumbnail;
                if (videoUrl && videoUrl.endsWith('.mp4')) {
                    return { type: 'video', url: videoUrl, caption: '「✅」 *Video procesado con éxito*' };
                } else if (imageUrl) {
                    return { type: 'image', url: imageUrl, caption: '「✅」 *Miniatura recuperada*' };
                }
            },
            async () => {
                const api = await fetch(`${info.fgmods.url}/downloader/fbdl?url=${args[0]}&apikey=${info.fgmods.key}`);
                const data = await api.json();
                const downloadUrl = data.result[0].hd || data.result[0].sd;
                return { type: 'video', url: downloadUrl, caption: '「✅」 *Contenido obtenido vía API 2*' };
            },
            async () => {
                const apiUrl = `${info.apis}/download/facebook?url=${args[0]}`;
                const apiResponse = await fetch(apiUrl);
                const delius = await apiResponse.json();
                const downloadUrl = delius.urls[0].hd || delius.urls[0].sd;
                return { type: 'video', url: downloadUrl, caption: '「✅」 *Contenido obtenido vía API 3*' };
            },
            async () => {
                const apiUrl = `https://api.dorratz.com/fbvideo?url=${encodeURIComponent(args[0])}`;
                const response = await fetch(apiUrl);
                const data = await response.json();
                const downloadUrl = data.result.hd || data.result.sd;
                return { type: 'video', url: downloadUrl, caption: '「✅」 *Contenido obtenido vía API 4*' };
            }
        ];

        let mediaData = null;
        for (const attempt of downloadAttempts) {
            try {
                mediaData = await attempt();
                if (mediaData) break; 
            } catch (err) {
                console.error(`Error en intento de descarga: ${err.message}`);
                continue; 
            }
        }

        if (!mediaData) throw new Error('No se pudo obtener el contenido.');

        const fileName = mediaData.type === 'video' ? 'video.mp4' : 'image.jpg';
        await conn.sendFile(m.chat, mediaData.url, fileName, mediaData.caption, m);
        m.react('✅');

    } catch (e) {
        m.react('❌');
        m.reply('「❌」 *Error de descarga*\n\nNo fue posible procesar este enlace. Asegúrese de que el video sea público.');
        console.log(e);
    } finally {
        delete userRequests[m.sender];
    }
};

handler.help = ['fb', 'facebook'];
handler.tags = ['downloader'];
handler.command = /^(facebook|fb|fbdl)(dl|2|3|4|5)?$/i;
handler.register = true;

export default handler;
