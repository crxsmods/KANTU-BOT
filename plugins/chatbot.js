import { perplexity } from '../lib/scraper.js';
const antiSpam = new Map();

export async function before(m, { conn }) {
    let fkontak = {
        "key": {
            "participants": "0@s.whatsapp.net",
            "remoteJid": "status@broadcast",
            "fromMe": false,
            "id": "Halo"
        },
        "message": {
            "contactMessage": {
                "vcard": `BEGIN:VCARD
VERSION:3.0
N:Sy;Bot;;;
FN:y
item1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}
item1.X-ABLabel:Ponsel
END:VCARD`
            }
        },
        "participant": "0@s.whatsapp.net"
    };

    if (
        m.id.startsWith('NJX-') ||
        (m.id.startsWith('BAE5') && m.id.length === 16) ||
        (m.id.startsWith('3EB0') && m.id.length === 12) ||
        (m.id.startsWith('3EB0') && (m.id.length === 20 || m.id.length === 22)) ||
        (m.id.startsWith('B24E') && m.id.length === 20) ||
        m.id.startsWith('FizzxyTheGreat-')
    ) return;

    let setting = global.db.data.settings[this.user.jid];
    let chat = global.db.data.chats[m.chat];
    let name = conn.getName(m.sender);
    const user = `@${m.sender.split('@')[0]}`;

    if (chat.isBanned) return;
    if (m.fromMe) return;
    if (m.chat === "120363371008200788@newsletter") return;
    if (m.chat === "120363371008200788@newsletter") return;

    let vn = 'https://qu.ax/eGdW.mp3';
    let bot = `${pickRandom([
        `*Hola ${user} soy un bot el que puedo ayudar? 👉👈*`,
        `Aqui estoy`,
        `bot tu abuela`,
        `que quiere?`,
        `No dispoble 🫣`,
        `Hola aqui estoy soy tu botsito sexy el que puedo ayudar uwu`
    ])}`.trim();
    let txt = `*Pagas una fortuna para streaming.*

> *Tenemos streaming variado. Es muy barato y todos pueden comprar.*

💎 \`\`\`W E B\`\`\`

💻 *Página:*
https://hackstorex.com

💥 *BUSCAS SCRIPTS YA HECHOS PARA CREAR TUS PÁGINAS WEB?*

⚡ *WEB*

> https://MexSpin.fun

🗣📲 *Contacto:*
> 5217121649714`;

    // Detectar palabras clave incluyendo Kantu y Kantubot
    if (
        m.text.includes('bot') ||
        m.text.includes('Bot') ||
        m.text.includes('simsimi') ||
        m.text.includes('simi') ||
        m.text.includes('alexa') ||
        m.text.includes('kantu') ||
        m.text.includes('Kantu') ||
        m.text.includes('kantubot') ||
        m.text.includes('Kantubot')
    ) {
        if (
            m.text.includes('jadibot') ||
            m.text.includes('bots') ||
            m.text.includes('serbot') ||
            m.text.includes('instalarbot') ||
            m.text.includes('infobot')
        ) return;

        const lastMessageTime = antiSpam.get(m.sender) || 0;
        const currentTime = Date.now();
        if (currentTime - lastMessageTime < 9000) throw !0;

        if (/^¿que es un bot\?|Que es un bot\?|que es un bot\?|que es un bot$/i.test(m.text)) {
            return conn.reply(
                m.chat,
                `\`☆::¿${await tr("QUE ES UN BOT DE WHATSAPP?")}::☆\`

> 𝐔𝐧 𝐁𝐨𝐭 𝐞𝐬 𝐮𝐧𝐚 𝐢𝐧𝐭𝐞𝐥𝐢𝐠𝐞𝐧𝐜𝐢𝐚 𝐚𝐫𝐭𝐢𝐟𝐢𝐜𝐢𝐚𝐥 𝐪𝐮𝐞 𝐫𝐞𝐚𝐥𝐢𝐳𝐚 𝐭𝐚𝐫𝐞𝐚𝐬 𝐪𝐮𝐞 𝐥𝐞 𝐢𝐧𝐝𝐢𝐪𝐮𝐞 𝐜𝐨𝐧 𝐜𝐨𝐦𝐚𝐧𝐝𝐨𝐬, 𝐞𝐧 𝐞𝐥 𝐜𝐚𝐬𝐨 𝐝𝐞 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩 𝐩𝐮𝐞𝐝𝐞𝐬 𝐜𝐫𝐞𝐚𝐫 𝐬𝐭𝐢𝐜𝐤𝐞𝐫𝐬, 𝐝𝐞𝐬𝐜𝐚𝐫𝐠𝐚𝐫 𝐦𝐮́𝐬𝐢𝐜𝐚, 𝐯𝐢𝐝𝐞𝐨𝐬, 𝐜𝐫𝐞𝐚𝐫 𝐥𝐨𝐠𝐨𝐬 𝐩𝐞𝐫𝐬𝐨𝐧𝐚𝐥𝐢𝐳𝐚𝐝𝐨𝐬 𝐲 𝐦𝐮𝐜𝐡𝐨 𝐦𝐚𝐬, 𝐞𝐬𝐭𝐨 𝐝𝐞 𝐟𝐨𝐫𝐦𝐚 𝐚𝐮𝐭𝐨𝐦𝐚𝐭𝐢𝐳𝐚𝐝𝐚, 𝐨 𝐬𝐞𝐚 𝐪𝐮𝐞 𝐮𝐧 𝐡𝐮𝐦𝐚𝐧𝐨 𝐧𝐨 𝐢𝐧𝐭𝐞𝐫𝐟𝐢𝐞𝐫𝐞 𝐞𝐧 𝐞𝐥 𝐩𝐫𝐨𝐜𝐞𝐬𝐨. 𝐏𝐚𝐫𝐚 𝐯𝐞𝐫 𝐞𝐥 𝐦𝐞𝐧𝐮́ 𝐝𝐞 𝐜𝐨𝐦𝐚𝐧𝐝𝐨𝐬 𝐩𝐮𝐞𝐝𝐞𝐬 𝐮𝐬𝐚𝐫: #menu

>「 ᴋᴀɴᴛᴜ - ʙᴏᴛ 」`,
                m
            );
        }

        if (/^Quiero un bot|como obtengo un bot\?|Quiero un bot\?|quiero un bot|solicitó bot|solicito bot|Necesito un bot|necesito un bot$/i.test(m.text)) {
            return conn.reply(
                m.chat,
                `\`⚡ ¿${await tr("Quieres un bot para tu grupo?")}\`

Puedes solicitarlo *GRATIS* escribiendo a mi creador Crxs



\`⚡ ¿El bot estará activo 24/7?\`
> _*Sí, nuestro bot está alojado en un servidor de pago para mantenerlo activo 24/7.*_

> 「 ᴋᴀɴᴛᴜ - ʙᴏᴛ 」`,
                m,
                {
                    contextInfo: {
                        externalAdReply: {
                            mediaUrl: null,
                            mediaType: 1,
                            description: null,
                            title: `Hola ${name} 👋`,
                            body: wm,
                            previewType: 0,
                            thumbnail: img.getRandom(),
                            sourceUrl: redes.getRandom()
                        }
                    }
                }
            );
        }

        try {
            let prefixRegex = new RegExp(
                '^[' +
                    setting.prefix.replace(/[|\\{}()[\]^$+*.\-\^]/g, '\\$&') +
                    ']'
            );
            let hasPrefixWithKeyword =
                prefixRegex.test(m.text) &&
                m.text.match(
                    new RegExp(
                        '^[' +
                            setting.prefix.replace(/[|\\{}()[\]^$+*.\-\^]/g, '\\$&') +
                            '](?:bot|Bot|simsimi|simi|alexa|kantu|Kantu|kantubot|Kantubot)'
                    )
                );
            let hasKeywordWithoutPrefix =
                (
                    m.text.includes('bot') ||
                    m.text.includes('Bot') ||
                    m.text.includes('simsimi') ||
                    m.text.includes('simi') ||
                    m.text.includes('alexa') ||
                    m.text.includes('kantu') ||
                    m.text.includes('Kantu') ||
                    m.text.includes('kantubot') ||
                    m.text.includes('Kantubot')
                ) && !prefixRegex.test(m.text);
            if (!hasPrefixWithKeyword && !hasKeywordWithoutPrefix) return;
            let query = m.text;
            if (hasPrefixWithKeyword) {
                query = m.text
                    .replace(prefixRegex, '')
                    .replace(
                        /^(?:bot|Bot|simsimi|simi|alexa|kantu|Kantu|kantubot|Kantubot)/i,
                        ''
                    )
                    .trim();
            } else if (hasKeywordWithoutPrefix) {
                const keywordRegex = /^(?:bot|Bot|simsimi|simi|alexa|kantu|Kantu|kantubot|Kantubot)\s+/i;
                if (keywordRegex.test(m.text)) {
                    query = m.text.replace(keywordRegex, '').trim();
                } else {
                    query = m.text.trim();
                }
            }
            if (!query) return;

            conn.sendPresenceUpdate('composing', m.chat);
            antiSpam.set(m.sender, currentTime);

            async function luminsesi(q, username, logic) {
                try {
                    const response = await axios.post('https://luminai.my.id', {
                        content: q,
                        user: username,
                        prompt: logic,
                        webSearchMode: true
                    });
                    return response.data.result;
                } catch (error) {
                    console.error(error);
                }
            }

            async function perplexityIA(q, logic) {
                try {
                    let response = await perplexity.chat(
                        [
                            { role: 'system', content: logic || syms1 },
                            { role: 'user', content: q }
                        ],
                        'sonar-pro'
                    );
                    if (response.status) {
                        return response.result.response;
                    } else {
                        throw new Error(`Error en Perplexity: ${response.result.error}`);
                    }
                } catch (error) {
                    console.error('Error en Perplexity:', error);
                    return null;
                }
            }

            async function SimSimi(text, language = 'es') {
                try {
                    const { data } = await axios.post(
                        'https://api.simsimi.vn/v1/simtalk',
                        new URLSearchParams({ text, lc: language }).toString(),
                        {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'User-Agent':
                                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                            }
                        }
                    );
                    return data.message;
                } catch (error) {
                    console.error(error);
                    return null;
                }
            }

            let username = `${m.pushName}`;
            let syms1 = await fetch(
                'https://raw.githubusercontent.com/crxsmods/text2/refs/heads/main/text-chatgpt'
            ).then(v => v.text());

            let result;
            if (!result || result.trim().length === 0) {
                result = await perplexityIA(query, syms1);
            }

            if (!result || result.trim().length === 0) {
                result = await SimSimi(query);
            }

            if (!result || result.trim().length === 0) {
                result = await luminsesi(query, username, syms1);
                result = result
                    .replace(
                        /Maaf, terjadi kesalahan saat memproses permintaan Anda/g,
                        ''
                    )
                    .trim();
                result = result
                    .replace(
                        /Generated by BLACKBOX\.AI.*?https:\/\/www\.blackbox\.ai/g,
                        ''
                    )
                    .trim();
                result = result
                    .replace(
                        /and for API requests replace https:\/\/www\.blackbox\.ai with https:\/\/api\.blackbox\.ai/g,
                        ''
                    )
                    .trim();
            }

            if (result && result.trim().length > 0) {
                await conn.reply(m.chat, result, m);
                antiSpam.set(m.sender, Date.now());
            }
        } catch (e) {
            try {
                let gpt = await fetch(`${apis}/tools/simi?text=${m.text}`);
                let res = await gpt.json();
                await m.reply(res.data.message);
                antiSpam.set(m.sender, Date.now());
            } catch (e) {
                return m.reply(
                    [
                        `Simsimi esta durmiendo no molesta 🥱`,
                        `Callarte`,
                        `Api simsimi caida`,
                        `Simsimi esta ocupado cojieron con tu hermana vuelva mas tarde 🥵`,
                        `NO MOLESTE PUTA`,
                        `No hay señar`,
                        `No estoy disponible`
                    ].getRandom()
                );
                console.log(e);
            }
        }
    }

    if (/^infohost|hosting$/i.test(m.text)) {
        await conn.sendMessage(
            m.chat,
            {
                text: txt,
                contextInfo: {
                    forwardingScore: 9999999,
                    isForwarded: false,
                    externalAdReply: {
                        showAdAttribution: true,
                        containsAutoReply: true,
                        title: `💎 KANTU BOT 💎`,
                        body: `By CrxsMods`,
                        previewType: 'PHOTO',
                        thumbnailUrl:
                            'https://cdn.dorratz.com/files/1739136628132.jpg',
                        sourceUrl: nna
                    }
                }
            },
            { quoted: m }
        );
    }

    if (/^todo bien$/i.test(m.text)) {
        conn.reply(m.chat, `𝑩𝒊𝒆𝒏 𝒄𝒂𝒑𝒐 😎 𝒚 𝒕𝒖`, m);
    }

    if (/^e$/i.test(m.text)) {
        conn.reply(
            m.chat,
            `𝑸𝒖𝒆 𝒃𝒖𝒆𝒏𝒐 𝒔𝒂𝒃𝒆𝒓 𝒍𝒂 𝒍𝒆𝒕𝒓𝒂 𝒆`,
            m
        );
    }

    if (/^@5217121649714|CrxsMods$/i.test(m.text)) {
        conn.reply(
            m.chat,
            `*_[ ⚠ ️] No etiquetes a mi creador, si tiene alguna consulta o dudas, hablarle al privado_*`,
            m
        );
    }

    if (/^reglas$/i.test(m.text)) {
        m.reply(
            [
                `\`🌐 REGLAS DEL BOT 🌐\`\n\n* *No hacer spam de comandos*\n\nUsar los comando cada 5 segundos, de lo contrario el bot se puede satura, o numero del bot puede irse a support por spam.\n\n* *No estar enviando link del grupos al bot para que se una*\n\nHablar con mi creador y el lo une a tu grupo, si apoyar nuestras redes sociales:\n${yt}\n${md}\n\n* *No llamar al bot, ni al creador*\n\nSi lo haces, seras baneado del bot y bloqueado`,
                `\`⚠️ 𝙍𝙀𝙂𝙇𝘼𝙎 ⚠️\`

* 𝐏𝐫𝐨𝐡𝐢𝐛𝐢𝐝𝐨 𝐥𝐥𝐚𝐦𝐚𝐫 𝐚𝐥 𝐁𝐨𝐭
* 𝐏𝐫𝐨𝐡𝐢𝐛𝐢𝐝𝐨 𝐒𝐩𝐚𝐦 𝐚𝐥 𝐁𝐨𝐭
* 𝐍𝐨 𝐚𝐠𝐫𝐞𝐠𝐚𝐫 𝐚𝐥 𝐁𝐨𝐭
* 𝐑𝐞𝐬𝐩𝐞𝐭𝐚 𝐥𝐨𝐬 𝐭𝐞𝐫𝐦𝐢𝐧𝐨𝐬 𝐲 𝐜𝐨𝐧𝐝𝐢𝐜𝐢𝐨𝐧𝐞𝐬`
            ].getRandom() + `\n\n>「 ᴋᴀɴᴛᴜ - ʙᴏᴛ 」`
        );
    }
    return !0;
}

//export default handler

function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
}