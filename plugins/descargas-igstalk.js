import fg from 'api-dylux'

function descifrar(cifrado) {
  return atob(cifrado);
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0]) throw `⚠️ Ingrese el Username de Instagram\n\n*• Ejemplo:* ${usedPrefix + command} crxs_ofc`
  m.react("⌛")

  try {
    const user = "aHR0cHM6Ly96eWxhbGFicy5jb20vYXBpLzUwNDAvaW5zdGFncmFtK3VzZXIrcHJvZmlsZSthcGkvOTE5OS9wcm9maWxlK2luZm9ybWF0aW9u";
    const urlApi = descifrar(user);
    
    const descripcion = "Nzc0OXw4WXlxMEd1YkVmeW9OUkNPVGExTmJNdVZZYUFtUHdJbXdVd2tpamhl";
    
    const res = await fetch(urlApi, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + descifrar(descripcion),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: args[0] })
    })
    const json = await res.json()
    if (!json.result) return m.react("❌")

    const p = json.result
    const isPrivate = p.is_private ? 'Sí 🔒' : 'No 🔓'
    const biography = p.biography?.trim() || '—'
    const fullName = p.full_name || '—'
    const followers = p.edge_followed_by.count
    const following = p.edge_follow.count
    const posts = p.edge_owner_to_timeline_media.count
    const picUrl = p.profile_pic_url_hd || p.profile_pic_url

    const txt = `
👤 *Perfil de Instagram*
🔹 *Username:* ${p.username}
🔹 *Nombre completo:* ${fullName}
🔹 *Biografía:* ${biography}
🔹 *Privada:* ${isPrivate}
🔹 *Seguidores:* ${followers}
🔹 *Seguidos:* ${following}
🔹 *Publicaciones:* ${posts}
🔹 *Foto de perfil:*`

    await conn.sendFile(
      m.chat,
      picUrl,
      'insta.jpg',
      txt,
      m
    )
    m.react("✅")

  } catch (err) {
    try {
      let res2 = await fg.igStalk(args[0])
      let te = `👤 *Perfil de Instagram*:
*• Nombre:* ${res2.name}
*• Username:* ${res2.username}
*• Seguidores:* ${res2.followersH}
*• Siguiendo:* ${res2.followingH}
*• Bio:* ${res2.description}
*• Posts:* ${res2.postsH}
*• Link:* https://instagram.com/${res2.username.replace(/^@/, '')}`
      await conn.sendFile(m.chat, res2.profilePic, 'igstalk.png', te, m)
      m.react("⌛")
    } catch (e) {
      await m.react("❌")
      m.reply(`\`\`\`⚠️ OCURRIÓ UN ERROR ⚠️\`\`\`\n\n> *Reporta con #report*:\n\n>>> ${e}`)
      console.log(e)
    }
  }
}

handler.help = ['igstalk']
handler.tags = ['downloader']
handler.command = ['igstalk','igsearch','instagramsearch']
handler.register = true
handler.limit = 1
export default handler
