import moment from 'moment-timezone'
import { xpRange } from '../lib/levelling.js'
import { db } from '../lib/postgres.js'
import { tarjetasActivadas } from '../lib/simple.js'
import fs from "fs";

const cooldowns = new Map()
const COOLDOWN_DURATION = 180000

const tags = {
  main: '⚡ INFOBOT',
  jadibot: '👽 SER SUB BOT',
  downloader: '🚀 DESCARGAS',
  game: '👾 JUEGOS',
  gacha: '✨️ NEW - RPG GACHA',
  rg: '🟢 REGISTRO',
  group: '⚙️ GRUPO',
  nable: '🕹 ENABLE/DISABLE',
  nsfw: '🥵 COMANDO +18',
  buscadores: '🔍 BUSCADORES',
  sticker: '🧧 STICKER',
  econ: '🛠 RPG',
  convertidor: '🎈 CONVERTIDORES',
  logo: '🎀 LOGOS',
  tools: '🔧 HERRAMIENTA',
  randow: '🪄 RANDOW',
  efec: '🎙 EFECTO NOTA DE VOZ',
  owner: '👑 OWNER'
}

const defaultMenu = {
  before: `> ⭐ B0T PÚBLICO ⭐
> 🌐 https://kxntu.com

 ╰┈➤  𝐊𝐚𝐧𝐭𝐮 - 𝐁𝐨𝐭
 
┏──────────────
┊ 『 Info User 』
┊ 「 ꛕ 」 𝑫𝒆𝒗 𝑩𝒚 𝑪𝒓𝒙𝒔𝑴𝒐𝒅𝒔
┗─────────────❐
│ᐉⴰ👤┊ *Usuario:* %name
│ᐉⴰ🌍┊ *Hora:* %hora
│ᐉⴰ💰┊ *Tu limite:* %limit
│ᐉⴰ⚡┊ *Exp:* %totalexp XP 
│ᐉⴰ⚡┊ *Reg:* %totalreg
│ᐉⴰ⭐️┊ *Rango:* %role
│ᐉⴰ🧋┊ *Nivel »* %level
╰ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒

┏──────────────
┊ 『 Info Bot 』
┊ 「 ꛕ 」 𝑫𝒆𝒗 𝑩𝒚 𝑪𝒓𝒙𝒔𝑴𝒐𝒅𝒔
┗─────────────❐
│ᐉⴰ👑┊ *Author* » 𝑪𝒓𝒙𝒔𝑴𝒐𝒅𝒔
│ᐉⴰ💎┊ *Tiempo activo:* %muptime
%botOfc
│ᐉⴰ☁️┊ *Librería* » Baileys
│ᐉⴰ📆┊ *Fecha:* %fecha
│ᐉⴰ👥️️┊ *Usuarios »* %toUserReg de %toUsers
╰─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ⭒


┊--📥 DESCARGA MI APP
┊--🎬 *KantuFlix* » https://kxntu.com
┊--🌐 *Web* » https://kxntu.com


> *Puede hablar con bot de esta forma ej:*
@%BoTag ¿QUIEN ERES?

> https://kxntu.com
`.trimStart(),
  header: '┏──────────────\n┊『 %category 』\n┊\n┊ 「 ꛕ 」 𝑫𝒆𝒗 𝑪𝒓𝒙𝒔𝑴𝒐𝒅𝒔\n┗─────────────❐ ',
  body: ' │ᐉⴰ💎┊ %cmd %islimit %isPremium',
  footer: `╚• \n`,
  after: ''
}

const handler = async (m, { conn, usedPrefix: _p, args }) => {
  const chatId = m.chat || m.key?.remoteJid;
  const now = Date.now();
  const chatData = cooldowns.get(chatId) || { lastUsed: 0, menuMessage: null };
  const timeLeft = COOLDOWN_DURATION - (now - chatData.lastUsed);

  if (timeLeft > 0) {
    try {
      const senderTag = m.sender ? `@${m.sender.split('@')[0]}` : '@usuario';
      await conn.reply(chatId, `「 ꛕ 」 Se ha detectado una solicitud reciente de ${senderTag}. Por favor, consulte el menú superior para evitar spam en el servidor. 👆`, chatData.menuMessage || m);
    } catch (err) {
      return;
    }
    return;
  }

  const name = m.pushName || 'Usuario';
  const fecha = moment.tz('America/Mexico_City').format('DD/MM/YYYY');
  const hora = moment.tz('America/Mexico_City').format('HH:mm:ss');
  const _uptime = process.uptime() * 1000;
  const muptime = clockString(_uptime);

  let user;
  try {
    const userRes = await db.query(`SELECT * FROM usuarios WHERE id = $1`, [m.sender]);
    user = userRes.rows[0] || { limite: 0, level: 0, exp: 0, role: '-' };
  } catch (err) {
    user = { limite: 0, level: 0, exp: 0, role: '-' };
  }

  let totalreg = 0;
  let rtotalreg = 0;
  try {
    const userCountRes = await db.query(`
      SELECT COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE registered = true)::int AS registrados
      FROM usuarios
    `);
    totalreg = userCountRes.rows[0].total;
    rtotalreg = userCountRes.rows[0].registrados;
  } catch (err) { }
  
  const toUsers = toNum(totalreg);
  const toUserReg = toNum(rtotalreg);
  const nombreBot = conn.user?.name || 'Sistema'
  const isPrincipal = conn === global.conn;
  const tipo = isPrincipal ? 'Bot Oficial' : 'Sub Bot';
  
  let botOfc = '';
  let BoTag = "";
  if (conn.user?.id && global.conn?.user?.id) {
    const jidNum = conn.user.id.replace(/:\d+/, '').split('@')[0];
    botOfc = (conn.user.id === global.conn.user.id) ? `│ᐉⴰ🌐┊ *Bot Ofc:* wa.me/${jidNum}` : `│ᐉⴰ🌐┊ *Sub Bot de:* wa.me/${global.conn.user.id.replace(/:\d+/, '').split('@')[0]}`;
    BoTag = jidNum;
  }

  const multiplier = "750" || 1.5;
  const { min, xp, max } = xpRange(user.level || 0, multiplier);

  const help = Object.values(global.plugins).filter(p => !p.disabled).map(plugin => ({
    help: Array.isArray(plugin.help) ? plugin.help : [plugin.help],
    tags: Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags],
    prefix: 'customPrefix' in plugin,
    limit: plugin.limit,
    premium: plugin.premium
  }));

  const categoryRequested = args[0]?.toLowerCase();
  const validTags = categoryRequested && tags[categoryRequested] ? [categoryRequested] : Object.keys(tags);
  let text = defaultMenu.before;

  for (const tag of validTags) {
    const comandos = help.filter(menu => menu.tags && menu.tags.includes(tag) && menu.help);
    if (!comandos.length) continue;

    text += '\n' + defaultMenu.header.replace(/%category/g, tags[tag]) + '\n';
    for (const plugin of comandos) {
      for (const helpCmd of plugin.help) {
        text += defaultMenu.body
          .replace(/%cmd/g, plugin.prefix ? helpCmd : _p + helpCmd)
          .replace(/%islimit/g, plugin.limit ? '(💎)' : '')
          .replace(/%isPremium/g, plugin.premium ? '(🐣)' : '') + '\n';
      }
    }
    text += defaultMenu.footer;
  }
  
  const replace = {
    '%': '%', p: _p, name,
    limit: user.limite || 0,
    level: user.level || 0,
    role: user.role || '-',
    totalreg, rtotalreg, toUsers, toUserReg,
    exp: (user.exp || 0) - min,
    maxexp: xp,
    totalexp: user.exp || 0,
    xp4levelup: max - (user.exp || 0),
    fecha, hora, muptime,
    wm: global.info?.wm || 'KantuBot',
    botOfc: botOfc,
    BoTag: BoTag
  };

  text = String(text).replace(new RegExp(`%(${Object.keys(replace).join('|')})`, 'g'), (_, key) => replace[key] ?? '');
  
  // ── Envío ──────────────────────────────────────────────────────────────
  // Este bloque es el sospechoso de que el menú "se enviara" sin aparecer en
  // el chat: WhatsApp aceptaba el mensaje (le daba ID, por eso el antispam
  // podía citarlo después) pero el cliente no lo dibujaba. Tres cambios:
  //
  //  · newsletterJid configurable. El menú usaba SIEMPRE 120363178718483875,
  //    mientras que los mensajes que sí llegan (m.reply, antispam) usan
  //    120363371008200788 el 75% de las veces. Esa asimetría encaja con el
  //    síntoma. MENU_NEWSLETTER_JID=off quita la etiqueta de canal del todo.
  //  · forwardingScore 999 -> 1, como el resto del bot.
  //  · thumbnailUrl solo si defines MENU_THUMB_URL. La que había (info.img2)
  //    pesa 2.4 MB y tarda ~5 s en descargar; la miniatura de una tarjeta
  //    debería pesar decenas de KB.
  const newsletterJid = (process.env.MENU_NEWSLETTER_JID || '').trim();
  const thumbUrl = (process.env.MENU_THUMB_URL || '').trim();

  const contextInfo = {
    forwardingScore: 1,
    isForwarded: true,
    mentionedJid: await conn.parseMention(text)
  };

  if (newsletterJid && newsletterJid.toLowerCase() !== 'off') {
    contextInfo.forwardedNewsletterMessageInfo = {
      newsletterJid,
      newsletterName: global.info?.wm || 'Kantu Bot',
      serverMessageId: 1
    };
  }

  // La tarjeta (externalAdReply) va DESACTIVADA por defecto: es lo que impedía
  // que el menú se viera. Mismo interruptor global que el resto del bot
  // (BOT_CARDS, ver lib/simple.js). lib/simple.js la quita igualmente en el
  // envío, así que esto solo evita construirla en balde.
  if (tarjetasActivadas()) {
    contextInfo.externalAdReply = {
      showAdAttribution: false,
      renderLargerThumbnail: false,
      title: "『 Kantu - Public 』",
      body: `${nombreBot} (${tipo})`,
      mediaType: 1,
      ...(thumbUrl ? { thumbnailUrl: thumbUrl, thumbnail: { url: thumbUrl } } : {}),
      sourceUrl: global.info?.md
    };
  }

  try {
    const menuMessage = await conn.sendMessage(chatId, { text, contextInfo }, { quoted: m });
    // Solo activamos el antispam si de verdad salió algo; si no, el usuario
    // quedaba bloqueado 3 minutos por un menú que nunca vio.
    if (menuMessage?.key?.id) cooldowns.set(chatId, { lastUsed: now, menuMessage });
    m.react('🐣');
  } catch (err) {
    console.error('[menu] Falló el envío con tarjeta:', err);
    // Degradación: que al menos llegue el texto, sin adornos.
    try {
      const simple = await conn.sendMessage(chatId, { text, contextInfo: {} }, { quoted: m });
      if (simple?.key?.id) cooldowns.set(chatId, { lastUsed: now, menuMessage: simple });
    } catch (err2) {
      m.react('❌');
      console.error('[menu] También falló el envío simple:', err2);
    }
  }
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = /^menu|help|allmenu|menú$/i
handler.register = true
export default handler

const clockString = ms => {
  const h = isNaN(ms) ? '--' : Math.floor(ms / 3600000)
  const m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
  const s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
  return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}

const toNum = n => (n >= 1_000_000) ? (n / 1_000_000).toFixed(1) + 'M'
  : (n >= 1_000) ? (n / 1_000).toFixed(1) + 'k'
  : n.toString()
