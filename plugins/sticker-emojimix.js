import { sticker } from '../lib/sticker.js'
import { db } from '../lib/postgres.js'
import { integrationConfig, isIntegrationConfigured } from '../lib/integrations.js'
import { safeFetchBuffer } from '../lib/safe-fetch.js'

const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!isIntegrationConfigured('tenor')) return m.reply('Emoji Kitchen no esta habilitado: falta TENOR_API_KEY.')
  const [emoji1, emoji2, extra] = String(text || '').split('+').map(value => value.trim())
  if (!emoji1 || !emoji2 || extra || [...emoji1].length > 16 || [...emoji2].length > 16) {
    return m.reply(`Uso: ${usedPrefix + command} 😺+😆`)
  }

  const userResult = await db.query('SELECT sticker_packname, sticker_author FROM usuarios WHERE id = $1', [m.sender])
  const user = userResult.rows[0] || {}
  const packname = user.sticker_packname || globalThis.info.packname
  const author = user.sticker_author || globalThis.info.author
  const endpoint = new URL('https://tenor.googleapis.com/v2/featured')
  endpoint.search = new URLSearchParams({
    key: integrationConfig.tenor.apiKey,
    contentfilter: 'high',
    media_filter: 'png_transparent',
    component: 'proactive',
    collection: 'emoji_kitchen_v5',
    q: `${emoji1}_${emoji2}`
  }).toString()

  const payload = await safeFetchBuffer(endpoint, { maxBytes: 2 * 1024 * 1024, timeoutMs: 15_000 })
  const data = JSON.parse(payload.toString('utf8'))
  const result = data.results?.[0]
  if (!result?.url) throw new Error('Tenor no encontro una combinacion para esos emojis.')

  const output = await sticker(null, result.url, packname, author)
  await conn.sendFile(m.chat, output, 'sticker.webp', '', m, true)
}

handler.help = ['emojimix emoji+emoji']
handler.tags = ['sticker']
handler.command = /^(emojimix|emogimix|combinaremojis|crearemoji|emojismix|emogismix)$/i
handler.register = true
handler.limit = 1

export default handler
