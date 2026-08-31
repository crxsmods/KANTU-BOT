import * as baileys from "@whiskeysockets/baileys";
import fs from 'fs'
import { fileTypeFromBuffer } from 'file-type'
import path from 'path';
import { db } from './postgres.js'
import { getGroupMetadata } from './groupcache.js'
import { rememberMessage } from './msgstore.js'
import { resolveSenderIdentity } from './identity.js'
import { safeFetchBuffer } from './safe-fetch.js'

const configuredNewsletterJid = () => {
  const value = String(process.env.MENU_NEWSLETTER_JID || '').trim()
  return /^\d{10,30}@newsletter$/.test(value) ? value : null
}

const forwardingContext = (mentionedJid = []) => {
  const newsletterJid = configuredNewsletterJid()
  return {
    mentionedJid,
    ...(newsletterJid
      ? {
          isForwarded: true,
          forwardingScore: 1,
          forwardedNewsletterMessageInfo: {
            newsletterJid,
            newsletterName: 'Kantu Bot'
          }
        }
      : {})
  }
}

const enforceNewsletterPolicy = contextInfo => {
  if (!contextInfo?.forwardedNewsletterMessageInfo) return
  const newsletterJid = configuredNewsletterJid()
  if (!newsletterJid) {
    delete contextInfo.forwardedNewsletterMessageInfo
    delete contextInfo.forwardingScore
    delete contextInfo.isForwarded
    return
  }
  contextInfo.forwardedNewsletterMessageInfo.newsletterJid = newsletterJid
  contextInfo.forwardedNewsletterMessageInfo.newsletterName = 'Kantu Bot'
}

const {
  makeWASocket,
  proto,
  downloadMediaMessage,
  downloadContentFromMessage,
  jidDecode,
  areJidsSameUser,
  generateWAMessage,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  WAMessageStubType,
  extractMessageContent,
  WA_DEFAULT_EPHEMERAL,
  prepareWAMessageMedia
} = baileys;


// Devuelve el JID real del chat. WhatsApp entrega los chats privados
// direccionados por LID (154...@lid); si respondemos a ese LID el mensaje
// se envía sin error pero no aparece en la conversación del usuario.
// key.remoteJidAlt trae el número real, así que lo preferimos siempre.
export function resolveChatJid(key = {}) {
  const remote = key.remoteJid || '';
  if (!remote) return remote;
  if (remote.endsWith('@g.us') || remote.endsWith('@newsletter') || remote === 'status@broadcast') return remote;
  const alt = key.remoteJidAlt || '';
  if (remote.endsWith('@lid') && alt.endsWith('@s.whatsapp.net')) return alt.replace(/:\d+/, '');
  return remote.replace(/:\d+/, '');
}

// Normaliza la key in-place: remoteJid pasa a ser el número real y el LID
// original queda en remoteJidAlt (y en m.chatLid) para no perder el mapeo.
export function normalizeMessageKey(m) {
  if (!m?.key) return m;
  const resolved = resolveChatJid(m.key);
  if (resolved && resolved !== m.key.remoteJid) {
    m.chatLid = m.key.remoteJid;
    m.key.remoteJidAlt = m.key.remoteJid;
    m.key.remoteJid = resolved;
  }
  return m;
}

// Interruptor global de las "tarjetas" (externalAdReply): el recuadro con
// título, miniatura y enlace que va al pie de muchos mensajes.
// Apagado por defecto porque en cuentas normales impide que el mensaje se
// dibuje. BOT_CARDS=on lo reactiva si algún día WhatsApp lo vuelve a admitir.
export const tarjetasActivadas = () =>
  (process.env.BOT_CARDS || '').trim().toLowerCase() === 'on';

const PP_FALLBACK = 'https://telegra.ph/file/33bed21a0eaa789852c30.jpg';
const PP_TTL = 30 * 60 * 1000;
const PP_MAX = 500;
const ppCache = new Map();

// La foto de perfil es una consulta a los servidores de WhatsApp. Antes se
// pedía en CADA mensaje entrante; ahora se cachea por usuario.
async function getProfilePicture(conn, jid) {
  if (!jid) return PP_FALLBACK;
  const hit = ppCache.get(jid);
  if (hit && Date.now() - hit.at < PP_TTL) return hit.url;
  const url = await conn.profilePictureUrl(jid, 'image').catch(() => PP_FALLBACK);
  if (ppCache.size >= PP_MAX) ppCache.delete(ppCache.keys().next().value);
  ppCache.set(jid, { at: Date.now(), url });
  return url;
}

export async function smsg(conn, m) {
if (!m) return m;
const M = proto.WebMessageInfo;
normalizeMessageKey(m);
patchConn(conn);
m.db = { query: (...args) => db.query(...args) };
  
if (!m.mentionedJid) m.mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
if (!m.quoted && m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
    const ctx = m.message.extendedTextMessage.contextInfo;
    const quotedMessage = {
      key: {
        id: ctx.stanzaId,
        fromMe: ctx.participant === conn.user?.jid,
        remoteJid: m.chat,
        participant: ctx.participant,
      },
      message: ctx.quotedMessage,
      messageTimestamp: m.messageTimestamp,
      participant: ctx.participant,
      sender: ctx.participant,
      chat: m.chat,
    };
    m.quoted = {
      ...quotedMessage,
      download: () => downloadMediaMessage(quotedMessage, 'buffer', {}),
    };
  }

try {
  let resUser = await db.query('SELECT * FROM usuarios WHERE id = $1', [m.sender]);

  if (!resUser.rows.length && m.lid) {
    resUser = await db.query('SELECT * FROM usuarios WHERE lid = $1', [m.lid]);
  }

  if (!resUser.rows.length && m.sender) {
    const num = String(m.sender).split('@')[0].replace(/[^0-9]/g, '');
    if (num) resUser = await db.query('SELECT * FROM usuarios WHERE num = $1', [num]);
  }

  m.user = resUser.rows[0] || {};
} catch (e) {
  console.error("❌ Error al obtener datos del usuario:", e);
  m.user = {};
}

if (m.isGroup) {
  try {
    const resChat = await db.query('SELECT * FROM group_settings WHERE group_id = $1', [m.chat]);
    m.chatDB = resChat.rows[0] || {};
  } catch (e) {
    console.error("❌ Error al obtener datos del grupo:", e);
    m.chatDB = {};
  }
}

if (m.quoted && m.quoted.message && typeof m.quoted.message === 'object') {
  const keys = Object.keys(m.quoted.message);
  if (keys.length > 0) {
    const type = keys[0];
    const media = m?.quoted.message[type];

    if (type?.includes('image')) m.quoted.mimetype = 'image';
    else if (type?.includes('video')) m.quoted.mimetype = 'video';
    else if (type?.includes('sticker')) m.quoted.mimetype = 'image/webp';
    else if (type?.includes('audio')) m.quoted.mimetype = 'audio';
    else if (type?.includes('document')) m.quoted.mimetype = media.mimetype || 'application/octet-stream';
  }
}

if (!m.mimetype) {
    const messageContent = m.message;
    if (messageContent) {
      const type = Object.keys(messageContent)[0];
if (type && type.includes('image')) m.mimetype = 'image';
else if (type && type.includes('video')) m.mimetype = 'video';
else if (type && type.includes('sticker')) m.mimetype = 'image/webp';
else if (type && type.includes('audio')) m.mimetype = 'audio';
else if (type && type.includes('document')) {
  const msgMedia = messageContent[type];
  m.mimetype = msgMedia?.mimetype || 'application/octet-stream';
  }
    }
  }

  if (m.key) {
    m.id = m.key.id;
    m.chat = m.key.remoteJid;
    m.fromMe = m.key.fromMe;
    m.isGroup = m.chat?.endsWith('@g.us') || false;
    let senderJid = m.fromMe ? conn.user.id : m.key.participant || m.key.remoteJid;

// Identidad del remitente. Antes esto era una segunda implementación
// paralela a la de handler.js; ahora ambas usan lib/identity.js, para que no
// puedan divergir y decidir cosas distintas sobre quién manda el mensaje.
const identity = resolveSenderIdentity(m, conn)
m.sender = identity.resolvedJid
m.lid = identity.lidJid

m.who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.id : m.sender;
m.pp = await getProfilePicture(conn, m.who);

if (m.isGroup) {
  try {
    // Cacheado: antes era una consulta a los servidores de WhatsApp en cada
    // mensaje de grupo (y handler.js recalcula isAdmin justo después).
    const metadata = (await getGroupMetadata(conn, m.chat)) || { participants: [] };
    const participants = metadata.participants || [];
    m.isAdmin = participants.some(p => p.id === m.sender && (p.admin === 'admin' || p.admin === 'superadmin'));
    m.isBotAdmin = participants.some(p => p.id === conn.user?.id.replace(/:\d+@/, "@") && (p.admin === 'admin' || p.admin === 'superadmin'));
  } catch (e) {
    m.isAdmin = false;
    m.isBotAdmin = false;
  }
}
  } else {
  }

m.download = async () => {
    const messageContent = m.message || (m.quoted && m.quoted.message);
    if (!messageContent) throw new Error('No se encontró contenido para descargar');
    const type = Object.keys(messageContent)[0];
    const stream = await downloadContentFromMessage(messageContent[type], type.includes('image') ? 'image' : type.includes('video') ? 'video' : 'document');
    return await streamToBuffer(stream);
  };

  m.react = async (emoji) => {
    if (!emoji) return;
    await conn.sendMessage(m.chat || m.key.remoteJid, {
      react: { text: emoji, key: m.key }
    });
  };

  return m;
}

// Parches a nivel de conexión. Antes vivían dentro de smsg(), de modo que en
// cada mensaje entrante conn.sendMessage se re-envolvía sobre la versión ya
// envuelta: tras N mensajes cada envío atravesaba N wrappers anidados, cada
// uno con su propio await. Ahora se instalan una sola vez por socket.
function patchConn(conn) {
if (conn.__kantuPatched) return;
conn.__kantuPatched = true;

conn.decodeJid = (jid) => {
  if (!jid) return jid;
  if (jid.endsWith('@lid')) return jid;
  if (/:\d+@/i.test(jid)) return jid.split(':')[0] + '@s.whatsapp.net';
  return jid;
};
    
  conn.getName = async (jid, withoutContact = false, m = null) => {
  if (!jid) return null;
  jid = conn.decodeJid ? conn.decodeJid(jid) : jid;
  try {
    if (jid.endsWith('@g.us')) {
      const metadata = await conn.groupMetadata(jid);
      return metadata.subject || (withoutContact ? null : jid.split('@')[0]);
    } else {
      if (jid === '0@s.whatsapp.net') return 'WhatsApp';
      if (conn.user?.jid && jid === conn.user.jid) return conn.user.name || jid.split('@')[0];
      if (m?.pushName && m?.sender === jid) return m.pushName;

      const res = await db.query('SELECT nombre FROM usuarios WHERE id = $1', [jid]);
      if (res.rows.length && res.rows[0].nombre) return res.rows[0].nombre;

      return jid.split('@')[0]; //
    }
  } catch (err) {
    console.error(err);
    return jid.split('@')[0];
  }
};

Array.prototype.getRandom = function () {
  return this[Math.floor(Math.random() * this.length)];
};
      
const originalSendMessage = conn.sendMessage.bind(conn);
conn.sendMessage = async function (jid, content, options = {}) {
  if (!content || typeof content !== 'object') throw new TypeError('El contenido del mensaje debe ser un objeto.');

  const remoteMediaLimits = {
    image: 15 * 1024 * 1024,
    sticker: 15 * 1024 * 1024,
    audio: 50 * 1024 * 1024,
    video: 64 * 1024 * 1024,
    document: 64 * 1024 * 1024
  };
  for (const [type, maximum] of Object.entries(remoteMediaLimits)) {
    const remoteUrl = content[type]?.url;
    if (typeof remoteUrl === 'string' && /^https?:\/\//i.test(remoteUrl)) {
      content[type] = await safeFetchBuffer(remoteUrl, {
        maxBytes: maximum,
        timeoutMs: 30_000
      });
    }
  }
  // Evita que Baileys resuelva URLs arbitrarias del texto en el servidor.
  // Las vistas previas remotas fueron retiradas por su superficie SSRF.
  if (typeof content.text === 'string' && content.linkPreview === undefined) {
    content.linkPreview = null;
  }

  const contextInfoDefault = forwardingContext(
    await conn.parseMention(content?.text || content?.caption || '')
  );

  if (!content.contextInfo) {
    content.contextInfo = contextInfoDefault;
  }
  enforceNewsletterPolicy(content.contextInfo);

  // Quitamos externalAdReply salvo que se active con BOT_CARDS=on.
  //
  // Comprobado en esta cuenta: WhatsApp acepta los mensajes que llevan la
  // "tarjeta" (les asigna ID, se pueden citar) pero el cliente NO los dibuja,
  // en todas sus formas. Los mismos mensajes sin esa clave llegan bien. Como
  // muchos plugins la usan, se filtra aquí, que es el único punto por el que
  // pasan todos los envíos, en vez de parchear cada plugin.
  if (!tarjetasActivadas() && content.contextInfo?.externalAdReply) {
    delete content.contextInfo.externalAdReply;
  } else {
    const externalAd = content.contextInfo?.externalAdReply;
    const thumbnailUrl = externalAd?.thumbnail?.url || externalAd?.thumbnailUrl;
    if (typeof thumbnailUrl === 'string' && /^https?:\/\//i.test(thumbnailUrl)) {
      externalAd.thumbnail = await safeFetchBuffer(thumbnailUrl, {
        maxBytes: 2 * 1024 * 1024,
        timeoutMs: 10_000
      });
      delete externalAd.thumbnailUrl;
    }
  }

  // Guardamos lo enviado para poder responder los reintentos de descifrado
  // que pide Baileys vía getMessage() (ver lib/msgstore.js).
  return rememberMessage(await originalSendMessage(jid, content, options));
};

  conn.parseMention = async (text = '') => {
    try {
      if (typeof text !== 'string') return [];
      const matches = [...text.matchAll(/@([0-9]{5,15})/g)];
      return matches.map(match => `${match[1]}@s.whatsapp.net`).filter(jid => jid.includes('@s.whatsapp.net'));
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  conn.reply = async (chatId, text, quoted = null, options = {}) => {
    const contextInfo = forwardingContext(await conn.parseMention(text));
    return await conn.sendMessage(chatId, { text, contextInfo }, { quoted, ...options });
  };

const defaultContextInfo = async (caption, conn) =>
  forwardingContext(await conn.parseMention(caption));

function formatExternalAdReply(obj = {}) {
  if (!obj.thumbnailUrl && obj.thumbnail) {
    obj.thumbnailUrl = obj.thumbnail;
    delete obj.thumbnail;
  }
  return {
    ...obj,
    thumbnail: typeof obj.thumbnailUrl === "string" ? { url: obj.thumbnailUrl } : obj.thumbnailUrl,
  };
}

conn.sendFile = async function (jid, path, filename = '', caption = '', quoted = null, ptt = false, options = {}) {
  const contextInfo = options.contextInfo ?? await defaultContextInfo(caption, this);
  if (contextInfo.externalAdReply) contextInfo.externalAdReply = formatExternalAdReply(contextInfo.externalAdReply);
  delete options.contextInfo;

  const getCleanExt = (url) => {
    const match = url.match(/\.([a-zA-Z0-9]+)(\?|$)/);
    return match ? match[1].toLowerCase() : 'bin';
  };

  if (Buffer.isBuffer(path)) {
    const fileInfo = await fileTypeFromBuffer(path) || {};
    const ext = (filename.includes('.') ? filename.split('.').pop() : fileInfo.ext || 'bin').toLowerCase();
    const mime = fileInfo.mime || 'application/octet-stream';
    const fileName = filename || `file.${ext}`;

    const messageType = (() => {
      if (ext === 'webp') return 'sticker';
      if (['mp4', 'mov', 'mkv'].includes(ext)) return 'video';
      if (['mp3', 'm4a', 'ogg', 'wav'].includes(ext)) return 'audio';
      if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) return 'image';
      if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'document';
      if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'csv', 'json', 'apk'].includes(ext)) return 'document';
      return 'document';
    })();

    return await this.sendMessage(jid, {
      ...(messageType === 'sticker' ? { sticker: path } : { [messageType]: path }),
      mimetype: mime,
      fileName,
      caption,
      contextInfo,
      ...options,
    }, { quoted });

  } else if (typeof path === 'string' && /https?:\/\//.test(path)) {
    try {
      const buffer = await safeFetchBuffer(path, {
        maxBytes: 64 * 1024 * 1024,
        timeoutMs: 30_000
      });

      const fileInfo = await fileTypeFromBuffer(buffer) || {};
      const mime = fileInfo.mime || 'application/octet-stream';
      const ext = (typeof filename === 'string' && filename.includes('.') ? filename.split('.').pop() : getCleanExt(path)).toLowerCase();
      const fileName = filename || `file.${ext}`;

      const messageType = (() => {
        if (ext === 'webp') return 'sticker';
        if (['mp4', 'mov', 'mkv'].includes(ext)) return 'video';
        if (['mp3', 'm4a', 'ogg', 'wav'].includes(ext)) return 'audio';
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) return 'image';
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'document';
        if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'csv', 'json', 'apk'].includes(ext)) return 'document';
        return 'document';
      })();

      return await this.sendMessage(jid, {
        ...(messageType === 'sticker' ? { sticker: buffer } : { [messageType]: buffer }),
        mimetype: mime,
        fileName,
        caption,
        contextInfo,
        ...options,
      }, { quoted });
    } catch (e) {
      console.error(e.message);
      return null;
    }
  }
};

conn.sendImage = async function (jid, path, caption = '', quoted = null, options = {}) {
  const contextInfo = options.contextInfo ?? await defaultContextInfo(caption, this);
  if (contextInfo.externalAdReply) contextInfo.externalAdReply = formatExternalAdReply(contextInfo.externalAdReply);
  delete options.contextInfo;

  return this.sendMessage(jid, {
    image: { url: path },
    caption,
    contextInfo,
    ...options
  }, { quoted });
};

conn.sendVideo = async function (jid, path, caption = '', quoted = null, options = {}) {
  const contextInfo = options.contextInfo ?? await defaultContextInfo(caption, this);
  if (contextInfo.externalAdReply) contextInfo.externalAdReply = formatExternalAdReply(contextInfo.externalAdReply);
  delete options.contextInfo;

  return this.sendMessage(jid, {
    video: { url: path },
    caption,
    contextInfo,
    ...options
  }, { quoted });
};

conn.fakeReply = async function (
  jid,
  caption = '',
  fakeNumber = '0@s.whatsapp.net',
  fakeCaption = '',
  quoted = null,
  options = {}
) {
  const contextInfo = options.contextInfo ?? await defaultContextInfo(caption, this);
  if (contextInfo.externalAdReply) contextInfo.externalAdReply = formatExternalAdReply(contextInfo.externalAdReply);
  delete options.contextInfo;

  return this.sendMessage(jid, {
    text: caption,
    contextInfo,
    ...options
  }, {
    quoted: {
      key: {
        fromMe: false,
        participant: fakeNumber,
        ...(jid.endsWith('@g.us') ? { remoteJid: jid } : { remoteJid: null })
      },
      message: {
        conversation: fakeCaption
      },
      messageTimestamp: parseInt(Date.now() / 1000)
    }
  });
};

conn.sendAudio = async function (jid, path, quoted = null, options = {}) {
  const contextInfo = options.contextInfo ?? await defaultContextInfo('', this);
  if (contextInfo.externalAdReply) contextInfo.externalAdReply = formatExternalAdReply(contextInfo.externalAdReply);
  delete options.contextInfo;

  return this.sendMessage(jid, {
    audio: { url: path },
    mimetype: 'audio/mpeg',
    contextInfo,
    ...options
  }, { quoted });
};

conn.sendAlbumMessage = async function (jid, medias = [], caption = '', quoted = null) {
  if (!Array.isArray(medias) || medias.length === 0) {
    throw new Error("No se proporcionaron medios válidos.");
  }

  const album = generateWAMessageFromContent(jid, {
    albumMessage: {
      expectedImageCount: medias.filter(media => media.type === "image").length,
      expectedVideoCount: medias.filter(media => media.type === "video").length,
      ...(quoted ? {
        contextInfo: {
          remoteJid: quoted.key.remoteJid,
          fromMe: quoted.key.fromMe,
          stanzaId: quoted.key.id,
          participant: quoted.key.participant || quoted.key.remoteJid,
          quotedMessage: quoted.message
        }
      } : {})
    }
  }, { quoted });

  await this.relayMessage(album.key.remoteJid, album.message, {
    messageId: album.key.id
  });

  for (let i = 0; i < medias.length; i++) {
    const { type, data } = medias[i];
    if (!['image', 'video'].includes(type)) {
      throw new Error('El album solo admite imagenes o videos.')
    }
    let mediaMessage;

    const mediaPayload = {};
    const remoteUrl = data?.url;
    mediaPayload[type] = typeof remoteUrl === 'string' && /^https?:\/\//i.test(remoteUrl)
      ? await safeFetchBuffer(remoteUrl, {
          maxBytes: type === 'image' ? 15 * 1024 * 1024 : 64 * 1024 * 1024,
          timeoutMs: 30_000
        })
      : data;
    if (i === 0 && caption) {
      mediaPayload.caption = caption;
    }

    mediaMessage = await generateWAMessage(album.key.remoteJid, mediaPayload, {
      upload: this.waUploadToServer
    });

    mediaMessage.message.messageContextInfo = {
      messageAssociation: {
        associationType: 1,
        parentMessageKey: album.key
      }
    };

    await this.relayMessage(mediaMessage.key.remoteJid, mediaMessage.message, {
      messageId: mediaMessage.key.id
    });
  }

  return album;
};

conn.sendDocument = async function (jid, path, filename = 'file', quoted = null, options = {}) {
  const contextInfo = options.contextInfo ?? await defaultContextInfo('', this);
  if (contextInfo.externalAdReply) contextInfo.externalAdReply = formatExternalAdReply(contextInfo.externalAdReply);
  delete options.contextInfo;

  return this.sendMessage(jid, {
    document: { url: path },
    fileName: filename,
    mimetype: 'application/octet-stream',
    contextInfo,
    ...options
  }, { quoted });
};

  // Enviar sticker
  conn.sendSticker = async (jid, path, quoted = null, options = {}) => {
  const contextInfo = options.contextInfo ?? await defaultContextInfo('', conn)
  if (contextInfo.externalAdReply) contextInfo.externalAdReply = formatExternalAdReply(contextInfo.externalAdReply)
  delete options.contextInfo;

  return conn.sendMessage(
    jid,
    {
      sticker: typeof path === 'string' ? { url: path } : path,
      contextInfo,
      ...options
    },
    { quoted }
  )
}

  // Enviar nota de voz
  conn.sendPtt = async (jid, path, quoted = null, options = {}) => {
    const contextInfo = options.contextInfo || {};
    delete options.contextInfo;

    return conn.sendMessage(
      jid,
      {
        audio: { url: path },
        mimetype: "audio/ogg; codecs=opus",
        ptt: true,
        contextInfo,
        ...options
      },
      { quoted }
    );
  };
}

function cleanJid(jid) {
  if (!jid) return jid;
  if (jid.includes('@lid')) return jid; 
  return jid.replace(/:\d+/, '').replace('@s.whatsapp.net', '') + '@s.whatsapp.net';
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}
