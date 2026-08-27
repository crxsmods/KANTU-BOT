/**
 * 「 ꛕ 」 BRAYLE CHAT-MODIFY
 * ----------------------------------------------------------------
 * WhatsApp NUNCA expone estas acciones a un bot/API pública: mutear,
 * archivar, marcar leído/no-leído, fijar (a nivel chat), destacar
 * (star) o borrar un chat completo *desde el otro lado* de la
 * conversación no existe en ningún endpoint documentado del cliente
 * oficial. Sin embargo Baileys sí firma y envía los "app state
 * patches" (chatModify) que el propio WhatsApp usa internamente para
 * sincronizar estos ajustes entre tus dispositivos.
 *
 * Aquí usamos el carácter invisible U+2800 (BRAILLE PATTERN BLANK,
 * "brayle") como marcador cosmético/watermark en las respuestas -es
 * el mismo truco que usan los "botones brayle": texto que WhatsApp no
 * recorta como espacio normal y que sirve para separar/objetivos de
 * layout sin dejar rastro visible- y como firma de que la acción fue
 * ejecutada vía este set de comandos "brayle".
 *
 * Comandos:
 *   .mute [8h|24h|7d|off]   -> silenciar / quitar silencio del chat actual
 *   .archivechat [on|off]  -> archivar / desarchivar el chat actual
 *   .pinchat [on|off]      -> fijar / desfijar el CHAT (no un mensaje)
 *   .clearchat             -> vaciar el historial del chat para el bot
 *   .markchat [read|unread]-> marcar el chat como leído / no leído
 *   .starchat (respondiendo)-> destacar/quitar-destacar el mensaje citado
 */

import { generateWAMessageFromContent, proto } from '@whiskeysockets/baileys'

const BRAYLE = '\u2800' // Braille Pattern Blank - carácter invisible real

const DURATIONS = {
  '8h': 8 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  'semana': 7 * 24 * 60 * 60 * 1000,
  'dia': 24 * 60 * 60 * 1000,
}

function brayleTag(text) {
  // Envuelve el mensaje con brayle invisible: firma "silenciosa" de que
  // la respuesta viene del módulo de trucos brayle (no altera lo visible).
  return `${BRAYLE}${text}${BRAYLE}`
}

async function getLastMessage(m, conn) {
  // Baileys exige un "lastMessages"/key con timestamp para varias de
  // estas mutaciones (archive, clear, delete, markRead). Si el usuario
  // respondió (quoted) un mensaje lo usamos como ancla; si no,
  // construimos uno mínimo con el propio mensaje del comando, que
  // WhatsApp acepta igualmente para fijar el "cursor" del chat.
  if (m.quoted && m.quoted.id) {
    return {
      key: {
        remoteJid: m.chat,
        fromMe: !!m.quoted.fromMe,
        id: m.quoted.id,
        participant: m.quoted.sender,
      },
      messageTimestamp: m.quoted.messageTimestamp || Math.floor(Date.now() / 1000),
    }
  }
  return {
    key: m.key,
    messageTimestamp: m.messageTimestamp || Math.floor(Date.now() / 1000),
  }
}

let handler = async (m, { conn, command, args, isAdmin, isOwner }) => {
  const jid = m.chat
  const opt = (args[0] || '').toLowerCase()

  try {
    switch (command) {
      case 'mute':
      case 'mutechat':
      case 'silenciar': {
        if (opt === 'off' || opt === 'no' || opt === 'quitar' || opt === 'unmute') {
          await conn.chatModify({ mute: null }, jid)
          m.react('🔊')
          return m.reply(brayleTag('「 ꛕ 」 🔊 Silencio desactivado para este chat. WhatsApp jamás muestra este botón a un bot, pero el "app state patch" ya viaja cifrado a tu cuenta. ✅'))
        }
        const ms = DURATIONS[opt] || DURATIONS['8h']
        await conn.chatModify({ mute: Date.now() + ms }, jid)
        m.react('🔇')
        return m.reply(brayleTag(`「 ꛕ 」 🔇 Chat silenciado (${opt && DURATIONS[opt] ? opt : '8h'}). Ni el propio WhatsApp Web deja mutear el chat de un tercero por comando; esto se logra únicamente firmando el chatModify de Baileys. Usa *${'.'}mute off* para revertir.`))
      }

      case 'archivechat':
      case 'archivar': {
        const lastMsg = await getLastMessage(m, conn)
        const archive = !(opt === 'off' || opt === 'no' || opt === 'quitar')
        await conn.chatModify({ archive, lastMessages: [lastMsg] }, jid)
        m.react(archive ? '🗄️' : '📤')
        return m.reply(brayleTag(`「 ꛕ 」 ${archive ? '🗄️ Chat archivado' : '📤 Chat desarchivado'} vía app-state patch (invisible para la UI normal de WhatsApp).`))
      }

      case 'pinchat': {
        // OJO: distinto al .pin de grupo-pin.js (que fija un MENSAJE).
        // Este fija el CHAT completo en la lista de chats, algo que
        // normalmente solo puede tocar el dueño del teléfono, no un bot.
        const pin = !(opt === 'off' || opt === 'no' || opt === 'quitar')
        await conn.chatModify({ pin }, jid)
        m.react('📌')
        return m.reply(brayleTag(`「 ꛕ 」 📌 Chat ${pin ? 'fijado' : 'desfijado'} a nivel de lista de chats (chat-level pin, no mensaje).`))
      }

      case 'clearchat': {
        const lastMsg = await getLastMessage(m, conn)
        await conn.chatModify({ clear: true, lastMessages: [lastMsg] }, jid)
        m.react('🧹')
        return m.reply(brayleTag('「 ꛕ 」 🧹 Historial del chat vaciado (solo para este dispositivo/bot) vía chatModify.'))
      }

      case 'markchat': {
        const lastMsg = await getLastMessage(m, conn)
        const read = !(opt === 'unread' || opt === 'noleido' || opt === 'no-leido')
        await conn.chatModify({ markRead: read, lastMessages: [lastMsg] }, jid)
        m.react(read ? '✅' : '📩')
        return m.reply(brayleTag(`「 ꛕ 」 Chat marcado como ${read ? 'leído ✅' : 'no leído 📩'}.`))
      }

      case 'starchat':
      case 'destacarchat': {
        if (!m.quoted) return m.reply(brayleTag('⚠️ Responde al mensaje que quieres destacar/quitar destacado.'))
        const star = !(opt === 'off' || opt === 'no' || opt === 'quitar')
        await conn.chatModify({
          star: {
            messages: [{ id: m.quoted.id, fromMe: !!m.quoted.fromMe }],
            star,
          },
        }, jid)
        m.react(star ? '⭐' : '🚫')
        return m.reply(brayleTag(`「 ꛕ 」 ${star ? '⭐ Mensaje destacado' : '🚫 Destacado removido'} vía chatModify.star.`))
      }

      default:
        return
    }
  } catch (err) {
    console.error(err)
    return m.reply(brayleTag(`❌ No se pudo ejecutar la acción brayle. Detalle: ${err?.message || err}`))
  }
}

handler.help = ['mute [8h/24h/7d/off]', 'archivechat [on/off]', 'pinchat [on/off]', 'clearchat', 'markchat [read/unread]', 'starchat']
handler.tags = ['brayle']
handler.command = /^(mute|mutechat|silenciar|archivechat|archivar|pinchat|clearchat|markchat|starchat|destacarchat)$/i
// Estas acciones tocan el ESTADO DE CUENTA del propio bot (su lista de
// chats), no permisos del grupo -> solo el owner del bot debe poder
// dispararlas, sin importar si se ejecuta en grupo o privado.
handler.group = false
handler.private = false
handler.owner = true
handler.register = false

export default handler
