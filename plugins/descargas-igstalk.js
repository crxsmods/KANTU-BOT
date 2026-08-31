import { integrationConfig } from '../lib/integrations.js'
import { safeFetchBuffer } from '../lib/safe-fetch.js'

const handler = async (m, { conn, args, usedPrefix, command }) => {
  const username = String(args[0] || '').replace(/^@/, '')
  if (!/^[A-Za-z0-9._]{1,30}$/.test(username)) {
    return m.reply(`Uso: ${usedPrefix + command} usuario_de_instagram`)
  }

  await m.react('⌛')
  try {
    const endpoint = new URL('/tools/igstalk', integrationConfig.delirius.url)
    endpoint.searchParams.set('username', username)
    const body = await safeFetchBuffer(endpoint, { maxBytes: 2 * 1024 * 1024, timeoutMs: 15_000 })
    const profile = JSON.parse(body.toString('utf8'))?.data
    if (!profile?.username || !profile?.profile_picture) throw new Error('Respuesta de perfil incompleta.')

    const text = [
      '*Perfil de Instagram*',
      `Nombre: ${profile.full_name || '-'}`,
      `Usuario: @${profile.username}`,
      `Seguidores: ${profile.followers ?? '-'}`,
      `Seguidos: ${profile.following ?? '-'}`,
      `Posts: ${profile.posts ?? '-'}`,
      `Privado: ${profile.private ? 'Si' : 'No'}`,
      `Verificado: ${profile.verified ? 'Si' : 'No'}`,
      `Bio: ${profile.biography || 'Sin biografia'}`,
      `URL: ${profile.url || `https://instagram.com/${profile.username}`}`
    ].join('\n')
    await conn.sendFile(m.chat, profile.profile_picture, 'instagram.jpg', text, m)
    await m.react('✅')
  } catch (error) {
    console.error('[igstalk]', error.message)
    await m.react('❌')
    await m.reply('No se pudo obtener ese perfil de Instagram.')
  }
}

handler.help = ['igstalk']
handler.tags = ['downloader']
handler.command = ['igstalk', 'igsearch', 'instagramsearch']
handler.register = true
handler.limit = 1

export default handler
