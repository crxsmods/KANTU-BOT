import { integrationConfig } from '../lib/integrations.js'
import { safeFetchBuffer } from '../lib/safe-fetch.js'

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const username = String(text || '').trim().replace(/^@/, '')
  if (!/^[A-Za-z0-9._]{2,24}$/.test(username)) return m.reply(`Uso: ${usedPrefix + command} usuario`)

  await m.react('⌛')
  try {
    const endpoint = new URL('/tools/tiktokstalk', integrationConfig.delirius.url)
    endpoint.searchParams.set('q', username)
    const body = await safeFetchBuffer(endpoint, { maxBytes: 2 * 1024 * 1024, timeoutMs: 15_000 })
    const payload = JSON.parse(body.toString('utf8'))?.result
    const profile = payload?.users
    const stats = payload?.stats
    if (!profile?.username || !stats || !profile.avatarLarger) throw new Error('Respuesta de perfil incompleta.')

    const caption = [
      '*Perfil de TikTok*',
      `Usuario: @${profile.username}`,
      `Nombre: ${profile.nickname || '-'}`,
      `Verificado: ${profile.verified ? 'Si' : 'No'}`,
      `Seguidores: ${Number(stats.followerCount || 0).toLocaleString()}`,
      `Seguidos: ${Number(stats.followingCount || 0).toLocaleString()}`,
      `Likes: ${Number(stats.heartCount || 0).toLocaleString()}`,
      `Videos: ${Number(stats.videoCount || 0).toLocaleString()}`,
      `Bio: ${profile.signature || 'Sin biografia'}`,
      `URL: ${profile.url || `https://tiktok.com/@${profile.username}`}`
    ].join('\n')
    await conn.sendFile(m.chat, profile.avatarLarger, 'tiktok.png', caption, m)
    await m.react('✅')
  } catch (error) {
    console.error('[tiktokstalk]', error.message)
    await m.react('❌')
    await m.reply('No se pudo obtener ese perfil de TikTok.')
  }
}

handler.help = ['tiktokstalk']
handler.tags = ['downloader']
handler.command = /^t(tstalk|iktokstalk)$/i
handler.register = true
handler.limit = 1

export default handler
