import { canLevelUp } from '../lib/levelling.js'

const multiplier = 650

export async function before(m, { conn }) {
const chatres = await m.db.query('SELECT autolevelup FROM group_settings WHERE group_id = $1', [m.chat])
const chat = chatres.rows[0]
if (!chat?.autolevelup) return
const res = await m.db.query('SELECT exp, level, role FROM usuarios WHERE id = $1', [m.sender])
const user = res.rows[0]

const before = user.level
let currentLevel = user.level
while (canLevelUp(currentLevel, user.exp, multiplier)) {
currentLevel++
}

if (currentLevel > before) {
const newRole = getRole(currentLevel).name
await m.db.query('UPDATE usuarios SET level = $1, role = $2 WHERE id = $3', [currentLevel, newRole, m.sender])
user.level = currentLevel
user.role = newRole
  
conn.reply(m.chat, [`*「 FELICIDADES LEVEL UP 🆙🥳 」*\n\nFelicidades subiste de nivel sigue asi 👏\n\n*• NIVEL:* ${before} ⟿ ${user.level}\n*• RANGO:* ${user.role}\n\n_*Para ver tu XP en tiempo real coloca el comando #level*_`, `@${m.sender.split`@`[0]} Ohhh pa has alcanzado el siguiente nivel\n*• NIVEL:* ${before} ⟿ ${user.level}\n\n_*Para ver quien es esta el top coloca el comando #lb*_`, `Que pro @${m.sender.split`@`[0]} has alcanzado un nuevo nivel 🙌\n\n*• Nuevo nivel:* ${user.level}\n*• Nivel anterior:* ${before}\n`].getRandom(), m, {contextInfo: {externalAdReply :{ mediaUrl: null, mediaType: 1, description: null, title: info.wm, body: ' 💫 𝐒𝐮𝐩𝐞𝐫 𝐁𝐨𝐭 𝐃𝐞 𝐖𝐡𝐚𝐭𝐬𝐚𝐩𝐩 🥳 ', previewType: 0, thumbnail: m.pp, sourceUrl: info.md}}})  
}}

export function getRole(level) {
  const ranks = ['NOVATO(A)', 'APRENDIS', 'EXPLORADOR(A)', 'MAESTRO(A)', 'IRON', 'PLATA', 'ORO', 'LEYENDA', 'ESTELAR', 'DIAMANTE', 'TOP ASTRAL', 'ÉLITE GLOBAL']
  const subLevels = ['V', 'IV', 'III', 'II', 'I']
  const roles = []

  let lvl = 0
  for (let rank of ranks) {
    for (let sub of subLevels) {
      roles.push({ level: lvl, name: `${rank} ${sub}` })
      lvl++
    }
  }

  return roles.reverse().find(r => level >= r.level) || { level, name: 'NOVATO(A) V' }
}
