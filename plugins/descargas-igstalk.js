import fg from 'api-dylux'

let handler = async (m, { conn, args, text, usedPrefix, command }) => {
if (!args[0]) return m.reply(`「 ꛕ 」 *STALK DE INSTAGRAM*\n\n> _Ingrese el nombre de usuario de Instagram para obtener su información detallada._\n\n📌 *EJEMPLO:*\n↳ ${usedPrefix + command} crxs_ofc`)

m.react("⌛");

try {
const apiUrl = `${info.apis}/tools/igstalk?username=${encodeURIComponent(args[0])}`;
const apiResponse = await fetch(apiUrl);
const delius = await apiResponse.json();
if (!delius || !delius.data) return m.react("❌");

const profile = delius.data;
const txt = `「 ꛕ 」 *INFORMACIÓN DE PERFIL*\n\n` +
`👤 *Nombre:* ${profile.full_name}\n` +
`🏷️ *Usuario:* @${profile.username}\n` +
`👥 *Seguidores:* ${profile.followers}\n` +
`👣 *Seguidos:* ${profile.following}\n` +
`📝 *Posts:* ${profile.posts}\n` +
`🔐 *Privado:* ${profile.private ? 'Sí' : 'No'}\n` +
`✨ *Verificado:* ${profile.verified ? 'Sí' : 'No'}\n` +
`📖 *Bio:* ${profile.biography || 'Sin biografía'}\n\n` +
`🔗 *Link:* ${profile.url}`;

await conn.sendFile(m.chat, profile.profile_picture, 'insta_profile.jpg', txt, m);
m.react("✅");

} catch (e2) {
try {     
let res = await fg.igStalk(args[0])
let te = `「 ꛕ 」 *INFORMACIÓN DE PERFIL*\n\n` +
`👤 *Nombre:* ${res.name}\n` +
`🏷️ *Usuario:* @${res.username}\n` +
`👥 *Seguidores:* ${res.followersH}\n` +
`👣 *Seguidos:* ${res.followingH}\n` +
`📝 *Posts:* ${res.postsH}\n` +
`📖 *Bio:* ${res.description || 'Sin biografía'}\n\n` +
`🔗 *Link:* https://instagram.com/${res.username.replace(/^@/, '')}`;

await conn.sendFile(m.chat, res.profilePic, 'igstalk.png', te, m)
m.react("✅");     
} catch (e) {
await m.react(`❌`) 
m.reply(`「 ꛕ 」 *ERROR DE BÚSQUEDA*\n\nNo se pudo obtener información del perfil solicitado. Asegúrese de que el nombre de usuario sea correcto. ⚠️`)       
console.log(e)
}}}

handler.help = ['igstalk']
handler.tags = ['downloader']
handler.command = ['igstalk', 'igsearch', 'instagramsearch'] 
handler.register = true
handler.limit = 1

export default handler
