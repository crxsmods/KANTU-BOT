/**
 * 「 ꛕ 」 BRAYLE BUTTONS
 * ----------------------------------------------------------------
 * WhatsApp desactivó los botones "reales" (buttonsMessage/template)
 * para cuentas normales hace tiempo -solo Meta permite eso en cuentas
 * Business verificadas-. Aun así, Baileys puede seguir construyendo
 * el `interactiveMessage.nativeFlowMessage` de bajo nivel; muchos
 * clientes WhatsApp (Android/iOS actualizados) SÍ renderizan estos
 * botones aunque la cuenta sea personal, porque el filtro real ocurre
 * server-side de forma inconsistente. Aquí los "explotamos" además
 * combinándolos con relleno de carácter Braille Pattern Blank
 * (U+2800) para lograr una maquetación tipo botón/columna que WhatsApp
 * NO permite crear con texto normal (los espacios normales se colapsan).
 *
 * Es decir, dos trucos "brayle" en uno:
 *   1) U+2800 como espaciador invisible -> pseudo-botones ASCII/emoji
 *      que se ven alineados como una fila de botones reales.
 *   2) nativeFlowMessage (quick_reply / cta_url / cta_copy) reales,
 *      que en un chat normal jamás podrías mandar desde la app oficial.
 *
 * Comando:
 *   .braylebtn [texto]  -> envía un mensaje con "botones brayle":
 *                          intenta primero el nativeFlowMessage real
 *                          y además muestra el fallback en texto con
 *                          relleno brayle, por si el cliente destino
 *                          no soporta nativeFlow (fallback silencioso).
 */

import { generateWAMessageFromContent, proto } from '@whiskeysockets/baileys'

const BRAYLE = '\u2800'
const pad = (n = 3) => BRAYLE.repeat(n)

function fakeButtonLine(label) {
  // Simula un botón usando brayle como "padding" invisible que WhatsApp
  // no colapsa (a diferencia de espacios normales), logrando un bloque
  // visualmente centrado/recuadrado imposible de maquetar con texto plano.
  return `┃${pad(2)}${label}${pad(2)}┃`
}

let handler = async (m, { conn, text, usedPrefix }) => {
  const titulo = text?.trim() || '「 ꛕ 」 Panel Brayle'

  const textoFallback = [
    `${BRAYLE}`,
    `╭${'─'.repeat(18)}╮`,
    fakeButtonLine('✅ Sí'),
    fakeButtonLine('❌ No'),
    fakeButtonLine('📋 Menú'),
    `╰${'─'.repeat(18)}╯`,
    `${BRAYLE}`,
    `_Responde con el número o toca el botón si tu WhatsApp lo soporta._`,
  ].join('\n')

  const nativeFlowMessage = {
    buttons: [
      {
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({ display_text: '✅ Sí', id: `${usedPrefix}braylebtn_si` }),
      },
      {
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({ display_text: '❌ No', id: `${usedPrefix}braylebtn_no` }),
      },
      {
        name: 'cta_url',
        buttonParamsJson: JSON.stringify({
          display_text: '📋 Menú',
          url: global.info?.md || 'https://github.com/crxsmods/KANTU-BOT',
          merchant_url: global.info?.md || 'https://github.com/crxsmods/KANTU-BOT',
        }),
      },
    ],
    messageParamsJson: JSON.stringify({}),
  }

  try {
    const prep = generateWAMessageFromContent(m.chat, {
      interactiveMessage: proto.Message.InteractiveMessage.fromObject({
        body: proto.Message.InteractiveMessage.Body.fromObject({ text: `${BRAYLE}${titulo}${BRAYLE}` }),
        footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: 'Botones brayle · no disponible en la app oficial' }),
        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject(nativeFlowMessage),
      }),
    }, { quoted: m, userJid: conn.user?.id })

    await conn.relayMessage(prep.key.remoteJid, prep.message, { messageId: prep.key.id })
    m.react('🔘')
  } catch (err) {
    // Fallback: si el nativeFlow no se pudo construir/entregar (versión
    // de proto distinta, cliente viejo, etc.) igual entregamos el
    // pseudo-botón hecho 100% con brayle + texto, que SIEMPRE funciona.
    console.error('[brayle-buttons] nativeFlow falló, usando fallback de texto:', err?.message || err)
    await conn.sendMessage(m.chat, { text: `${titulo}\n\n${textoFallback}` }, { quoted: m })
    m.react('🔘')
  }
}

handler.help = ['braylebtn [texto]']
handler.tags = ['brayle']
handler.command = /^braylebtn$/i
handler.group = false
handler.register = true

export default handler
