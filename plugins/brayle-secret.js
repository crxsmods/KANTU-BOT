/**
 * 「 ꛕ 」 MENSAJE SECRETO (brayle)
 * ----------------------------------------------------------------
 * Explota `sock.relayMessage(jid, message, { participant })`, la
 * MISMA ruta interna que Baileys usa para reenviar un "retry receipt"
 * cuando el mensaje falló al descifrarse SOLO para un dispositivo
 * (ver Socket/messages-recv.js -> sendMessagesAgain()). Al pasar
 * `participant: { jid, count }` de forma manual (fuera de un retry
 * real), forzamos que el paquete cifrado se arme y envíe ÚNICAMENTE
 * para ese participante/dispositivo -sin fan-out al resto del grupo-.
 *
 * Cita textual del propio código de Baileys (Socket/messages-send.js):
 *   "if the participant to send to is explicitly specified (generally
 *    retry recp) ensure the message is only sent to that person
 *    if a retry receipt is sent to everyone -- it'll fail decryption
 *    for everyone else who received the msg"
 *
 * Ese "fallará el descifrado para todos los demás" es EXACTAMENTE lo
 * que queremos: como el resto del grupo recibe un frame cifrado que
 * su sesión de Signal no puede abrir, WhatsApp (la app oficial, sin
 * ningún texto puesto por el bot) les muestra su propio placeholder
 * nativo: "Esperando este mensaje. Puede tardar un poco." Solo el
 * participante objetivo -al que sí se le cifró el mensaje- puede
 * leer el contenido real.
 *
 * Uso:
 *   .secreto @mencion  texto...     -> solo esa persona ve "texto..."
 *   .secreto -lid <jid@lid> texto   -> objetivo por LID directo
 *   (responder a un mensaje + mencionar/-lid también funciona: el
 *    contenido citado se reenvía como secreto en vez del texto)
 *
 * Requiere permisos de grupo (participant addressing solo aplica en
 * grupos multi-dispositivo reales) y limita el uso a admins/owner del
 * bot para evitar abuso -sigue siendo un "truco" no soportado
 * oficialmente y puede fallar según versión de cliente/servidor-.
 */

import { generateMessageIDV2, jidDecode, jidNormalizedUser } from '@whiskeysockets/baileys'
import { db } from '../lib/postgres.js'

const BRAYLE = '\u2800'

async function resolveLidToNumber(lidJid) {
  try {
    const res = await db.query('SELECT num FROM usuarios WHERE lid = $1', [lidJid])
    return res.rows[0]?.num || null
  } catch (err) {
    console.error('[brayle-secret] no se pudo resolver lid -> numero:', err?.message || err)
    return null
  }
}

function extractTarget(m, args) {
  // -lid <jid> explícito
  const lidFlagIdx = args.findIndex(a => a.toLowerCase() === '-lid')
  if (lidFlagIdx !== -1 && args[lidFlagIdx + 1]) {
    let raw = args[lidFlagIdx + 1].replace(/[<>]/g, '')
    if (!raw.includes('@')) raw += '@lid'
    return { jid: raw, rest: [...args.slice(0, lidFlagIdx), ...args.slice(lidFlagIdx + 2)] }
  }

  // Mención directa (@numero) -> viene resuelto en m.mentionedJid
  if (m.mentionedJid && m.mentionedJid[0]) {
    const mentionToken = args.findIndex(a => a.startsWith('@'))
    const rest = mentionToken !== -1 ? [...args.slice(0, mentionToken), ...args.slice(mentionToken + 1)] : args
    return { jid: m.mentionedJid[0], rest }
  }

  // Reply a alguien -> ese es el objetivo
  if (m.quoted && m.quoted.sender) {
    return { jid: m.quoted.sender, rest: args }
  }

  // Número plano al inicio de los argumentos
  if (args[0] && /^\+?[0-9]{5,15}$/.test(args[0])) {
    return { jid: args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net', rest: args.slice(1) }
  }

  return { jid: null, rest: args }
}

let handler = async (m, { conn, args, usedPrefix, command, isGroup }) => {
  if (!isGroup) {
    return m.reply(`${BRAYLE}⚠️ *.${command}* solo tiene sentido dentro de un grupo (el "descifrado fallido" nativo de WhatsApp solo aplica ahí, en privado no hay a quién más ocultarle el mensaje).${BRAYLE}`)
  }

  const { jid: rawTarget, rest } = extractTarget(m, args)
  if (!rawTarget) {
    return m.reply(
      `${BRAYLE}⚠️ Uso:\n` +
      `*${usedPrefix}${command}* @mención texto...\n` +
      `*${usedPrefix}${command}* -lid <jid@lid> texto...\n` +
      `_(o responde a alguien + escribe el texto)_${BRAYLE}`
    )
  }

  let target = rawTarget
  // decodeJid del proyecto conserva @lid tal cual y normaliza user:device
  target = conn.decodeJid ? conn.decodeJid(target) : target

  const decoded = jidDecode(target)
  if (!decoded?.user) {
    return m.reply(`${BRAYLE}❌ No pude interpretar el JID objetivo: ${target}${BRAYLE}`)
  }

  // Info de apoyo si el objetivo vino como @lid (solo para mostrarle al owner
  // a quién le está mandando el secreto, no afecta el envío en sí).
  let displayInfo = target
  if (target.endsWith('@lid')) {
    const num = await resolveLidToNumber(target)
    if (num) displayInfo = `${target} (${num})`
  }

  const secretText = (rest.join(' ') || m.quoted?.text || m.quoted?.message?.conversation || '').trim()
    || (m.quoted?.message?.extendedTextMessage?.text || '').trim()

  if (!secretText) {
    return m.reply(`${BRAYLE}⚠️ Falta el texto del mensaje secreto (o responde a un mensaje de texto para reenviarlo como secreto).${BRAYLE}`)
  }

  try {
    // Aseguramos que exista sesión Signal con el objetivo ANTES de forzar
    // el envío dirigido; es lo mismo que hace Baileys internamente antes
    // de reenviar un retry (`assertSessions([participant], true)`).
    if (typeof conn.assertSessions === 'function') {
      await conn.assertSessions([target], true)
    }

    const messageId = generateMessageIDV2(conn.user?.id || '')
    const messageContent = {
      extendedTextMessage: {
        text: `${BRAYLE}🔒 *Mensaje secreto*\n${secretText}${BRAYLE}`,
        contextInfo: {
          mentionedJid: [target],
        },
      },
    }

    // La clave del truco: `participant` fuerza a relayMessage() a cifrar
    // y direccionar el paquete SOLO para ese participante/dispositivo.
    // `count` normalmente viene del nodo <retry> real; aquí no existe un
    // retry genuino, así que usamos 0 (funciona igual porque solo se usa
    // como atributo `count` del nodo <enc>, no como control de flujo).
    await conn.relayMessage(m.chat, messageContent, {
      messageId,
      participant: { jid: target, count: 0 },
    })

    await m.reply(`${BRAYLE}✅ Mensaje secreto enviado. Solo ${displayInfo} podrá verlo; el resto del grupo verá el placeholder nativo de WhatsApp ("Esperando este mensaje. Puede tardar un poco.").${BRAYLE}`)
    if (typeof m.react === 'function') m.react('🔒')
  } catch (err) {
    console.error('[brayle-secret] fallo al enviar mensaje dirigido:', err)
    return m.reply(`${BRAYLE}❌ No se pudo enviar el mensaje secreto: ${err?.message || err}${BRAYLE}`)
  }
}

handler.help = ['secreto @mención <texto>', 'secreto -lid <jid@lid> <texto>']
handler.tags = ['brayle']
handler.command = /^(secreto|secretmsg|mensajesecreto)$/i
handler.group = true
handler.admin = true
handler.botAdmin = false
handler.register = false

export default handler
