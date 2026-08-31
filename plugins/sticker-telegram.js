import { db } from '../lib/postgres.js'
import { sticker } from '../lib/sticker.js'
import { integrationConfig, isIntegrationConfigured } from '../lib/integrations.js'
import { safeFetchBuffer } from '../lib/safe-fetch.js'

const telegramJson = async (method, parameters) => {
  const endpoint = new URL(`https://api.telegram.org/bot${integrationConfig.telegram.botToken}/${method}`)
  endpoint.search = new URLSearchParams(parameters).toString()
  const body = await safeFetchBuffer(endpoint, { maxBytes: 2 * 1024 * 1024, timeoutMs: 15_000 })
  const response = JSON.parse(body.toString('utf8'))
  if (!response.ok) throw new Error(response.description || `Telegram rechazo ${method}.`)
  return response.result
}

const handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!isIntegrationConfigured('telegram')) {
    return m.reply('La importacion de Telegram no esta habilitada: falta TELEGRAM_BOT_TOKEN.')
  }

  const match = String(args[0] || '').match(/^https:\/\/t\.me\/addstickers\/([A-Za-z0-9_]{1,64})\/?$/i)
  if (!match) return m.reply(`Uso: ${usedPrefix + command} https://t.me/addstickers/NOMBRE`)

  const userResult = await db.query('SELECT sticker_packname, sticker_author FROM usuarios WHERE id = $1', [m.sender])
  const user = userResult.rows[0] || {}
  const packname = user.sticker_packname || globalThis.info.packname
  const author = user.sticker_author || globalThis.info.author
  const pack = await telegramJson('getStickerSet', { name: match[1] })
  const configuredLimit = Number.parseInt(process.env.MAX_TELEGRAM_STICKERS || '20', 10)
  const limit = Number.isInteger(configuredLimit) ? Math.max(1, Math.min(configuredLimit, 50)) : 20
  const selected = pack.stickers.slice(0, limit)

  await m.reply(`Importando ${selected.length} de ${pack.stickers.length} stickers del paquete.`)
  let sent = 0
  for (const item of selected) {
    try {
      const file = await telegramJson('getFile', { file_id: item.file_id })
      const fileUrl = `https://api.telegram.org/file/bot${integrationConfig.telegram.botToken}/${file.file_path}`
      const output = await sticker(null, fileUrl, packname, author)
      await conn.sendFile(m.chat, output, 'sticker.webp', '', m, true)
      sent++
      await new Promise(resolve => setTimeout(resolve, 1_000))
    } catch (error) {
      console.error('[telegram-stickers] Sticker omitido:', error.message)
    }
  }

  if (!sent) throw new Error('No se pudo convertir ningun sticker del paquete.')
}

handler.help = ['stickertelegram <url>']
handler.tags = ['sticker', 'downloader']
handler.command = /^(stic?kertele(gram)?)$/i
handler.limit = 1
handler.register = true

export default handler
