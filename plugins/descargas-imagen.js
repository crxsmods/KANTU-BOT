import { googleImage } from '@bochilteam/scraper'

const forbidden = [
  /\b(?:porn|porno|xxx|nsfw|hentai|nude|desnud[oa]s?|sexo?|anal|blowjob|ahegao|futanari|rule34)\b/i,
  /\b(?:pedofilia|zoofilia|necrofilia|violaci[oó]n|gore|asesinato)\b/i,
  /\b(?:niñ[oa]s?|menor(?:es)?|infantil)\b.*\b(?:desnud[oa]s?|sexo|abuso|pack)\b/i,
  /\b(?:cp|boku no pico)\b/i
]

const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return m.reply(`¿Qué deseas buscar?\nEjemplo: *${usedPrefix + command} Kantu Bot*`)
  }
  if (forbidden.some(pattern => pattern.test(text))) {
    return m.reply('No buscaré contenido sexual, violento o relacionado con menores.')
  }

  try {
    const results = await googleImage(text)
    const image = results.getRandom()
    await conn.sendFile(m.chat, image, 'resultado.jpg', `🔎 Resultados de: ${text}`, m)
  } catch (error) {
    console.error('[imagen]', error?.message || error)
    await m.reply('No fue posible obtener una imagen segura en este momento.')
  }
}

handler.help = ['gimage <query>', 'imagen <query>']
handler.tags = ['buscadores']
handler.command = /^(gimage|image|imagen)$/i
handler.register = true
handler.limit = 1

export default handler
