import { db } from '../lib/postgres.js'

const handler = async (m, { text, usedPrefix, command }) => {
  const tipo = /sugge|suggestion/i.test(command) ? 'sugerencia' : 'reporte'
  if (!text) {
    const asunto = tipo === 'sugerencia' ? 'una sugerencia' : 'el error o comando con falla'
    const ejemplo = tipo === 'sugerencia' ? 'Agregue un comando de...' : 'los stickers no funcionan'
    return m.reply(`⚠️ Escribe ${asunto}.\n\n*Ejemplo:* ${usedPrefix + command} ${ejemplo}`)
  }
  if (text.length < 10) return m.reply('✨ El reporte debe tener al menos 10 caracteres.')
  if (text.length > 1000) return m.reply('⚠️ El reporte no puede superar los 1000 caracteres.')

  await db.query(
    'INSERT INTO reportes (sender_id, sender_name, mensaje, tipo) VALUES ($1, $2, $3, $4)',
    [m.sender, m.pushName || 'sin nombre', text, tipo]
  )

  const respuesta = tipo === 'sugerencia'
    ? '✅ Gracias. Tu sugerencia quedó registrada para revisión.'
    : '✅ Tu reporte quedó registrado para revisión.'
  return m.reply(respuesta)
}

handler.help = ['report <texto>', 'sugge <sugerencia>']
handler.tags = ['main']
handler.command = /^(report|request|suggestion|sugge|reporte|bugs?|report-owner|reportes|reportar)$/i
handler.register = true

export default handler
