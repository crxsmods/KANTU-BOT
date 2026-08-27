/**
 * 「 ꛕ 」 PAYLOAD TOOLS (brayle)
 * ----------------------------------------------------------------
 * Herramientas para inspeccionar y procesar el payload de los
 * mensajes. `raw` muestra la estructura original recibida por
 * Baileys, mientras `crm` prepara el contenido para comprobar su uso
 * con relayMessage(). Ninguna app oficial de WhatsApp deja ver esto:
 * es "levantar el capó" del protocolo mismo.
 *
 * ⊹ raw *reply msg*        -> mensaje completo tal como llegó a Baileys.
 * ⊹ raw *reply msg* -snip  -> el mismo payload RAW como bloque de código.
 * ⊹ raw *reply msg* -q     -> usa DIRECTO el mensaje citado (m.quoted)
 *                             sin intentar enriquecerlo/normalizarlo.
 * ⊹ crm *reply msg*        -> genera el payload que usaría sock.relayMessage().
 * ⊹ crm *reply msg* -snip  -> muestra el código de relayMessage() generado.
 * ⊹ crm *reply msg* -q     -> usa DIRECTO el mensaje citado en vez de
 *                             reconstruirlo con generateWAMessageFromContent.
 */

const BRAYLE = '\u2800'

// JSON.stringify no soporta Buffer/Uint8Array/BigInt "bonito" -> los
// serializamos de forma legible sin reventar ni imprimir megabytes de
// bytes binarios (imágenes, thumbnails, audio, etc.)
function safeReplacer() {
  const seen = new WeakSet()
  return (key, value) => {
    if (typeof value === 'bigint') return value.toString()
    if (value && typeof value === 'object') {
      if (seen.has(value)) return '[Circular]'
      seen.add(value)
      if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
        return `Buffer<${value.length} bytes>`
      }
      if (value.type === 'Buffer' && Array.isArray(value.data)) {
        return `Buffer<${value.data.length} bytes>`
      }
    }
    return value
  }
}

function pretty(obj) {
  return JSON.stringify(obj, safeReplacer(), 2)
}

function codeBlock(title, content) {
  return `${BRAYLE}「 ꛕ 」 ${title}\n\`\`\`\n${content}\n\`\`\`${BRAYLE}`
}

let handler = async (m, { conn, command, args, usedPrefix }) => {
  if (!m.quoted) {
    return m.reply(`${BRAYLE}⚠️ Responde (reply) al mensaje que quieres inspeccionar con *${usedPrefix}${command}*.${BRAYLE}`)
  }

  const flags = args.map(a => a.toLowerCase())
  const wantSnip = flags.includes('-snip')
  const wantQ = flags.includes('-q')

  try {
    if (command === 'raw') {
      // -q: usa el mensaje citado TAL CUAL (m.quoted), sin enriquecerlo
      // más allá de lo que ya reconstruye lib/simple.js a partir del
      // contextInfo -- exactamente como Baileys lo entregó al handler.
      // Sin -q hacemos el mismo objeto pero agregamos metadatos extra
      // (mimetype detectado, chat, etc.) que ya calcula smsg().
      const base = {
        key: {
          remoteJid: m.quoted.chat || m.chat,
          fromMe: !!m.quoted.fromMe,
          id: m.quoted.id,
          participant: m.quoted.sender,
        },
        message: m.quoted.message,
        messageTimestamp: m.quoted.messageTimestamp,
        participant: m.quoted.sender,
      }
      const payload = wantQ ? base : { ...base, mimetype: m.quoted.mimetype, chat: m.quoted.chat || m.chat }

      const text = pretty(payload)
      if (wantSnip) return m.reply(codeBlock('RAW payload (Baileys)', text))
      return m.reply(`${BRAYLE}「 ꛕ 」 📦 *RAW PAYLOAD* (Baileys)${wantQ ? ' [-q: directo, sin enriquecer]' : ''}\n\n${text}${BRAYLE}`)
    }

    if (command === 'crm') {
      // Payload EXACTO que necesitaría sock.relayMessage(jid, message, opts)
      // -q: usa el message del quoted directamente (message crudo).
      // sin -q: intenta "envolver" el mismo contenido igual que lo
      // hacen los plugins que ya usan generateWAMessageFromContent en
      // este proyecto (grupo-hidetag.js / info-sc.js), para que quede
      // claro qué pasa por relayMessage() en un caso normal de bot.
      const jid = m.quoted.chat || m.chat
      const message = m.quoted.message
      const messageId = m.quoted.id

      const relayPayload = {
        jid,
        message: wantQ ? message : { ...message },
        options: { messageId },
      }

      const codeSnippet = [
        `await conn.relayMessage(`,
        `  ${JSON.stringify(jid)},`,
        `  ${pretty(relayPayload.message).split('\n').join('\n  ')},`,
        `  { messageId: ${JSON.stringify(messageId)} }`,
        `)`,
      ].join('\n')

      if (wantSnip) return m.reply(codeBlock('crm() -> sock.relayMessage()', codeSnippet))

      const text = pretty(relayPayload)
      return m.reply(`${BRAYLE}「 ꛕ 」 🛰️ *CRM PAYLOAD* (para sock.relayMessage())${wantQ ? ' [-q: message crudo del citado]' : ''}\n\n${text}${BRAYLE}`)
    }
  } catch (err) {
    console.error(err)
    return m.reply(`${BRAYLE}❌ No se pudo procesar el payload: ${err?.message || err}${BRAYLE}`)
  }
}

handler.help = ['raw *reply* [-snip|-q]', 'crm *reply* [-snip|-q]']
handler.tags = ['brayle']
handler.command = /^(raw|crm)$/i
handler.group = false
handler.owner = true
handler.register = false

export default handler
