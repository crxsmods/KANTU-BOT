import { db } from '../lib/postgres.js'

const items = ['limite', 'exp', 'money']
let confirmation = {}

async function handler(m, { conn, args, usedPrefix, command }) {
if (confirmation[m.sender]) return m.reply('𝙀𝙨𝙩𝙖𝙨 𝙝𝙖𝙘𝙞𝙚𝙣𝙙𝙤 𝙪𝙣𝙖 𝙩𝙧𝙖𝙣𝙨𝙛𝙚𝙧𝙚𝙣𝙘𝙞𝙖')

const userRes = await db.query('SELECT * FROM usuarios WHERE id = $1', [m.sender])
let user = userRes.rows[0]
if (!user) return
const item = items.filter(v => v in user && typeof user[v] == 'number')
let lol = `\`⧼⧼⧼ 💱 𝙏𝙍𝘼𝙉𝙎𝙁𝙀𝙍𝙀𝙉𝘾𝙄𝘼 💱 ⧽⧽⧽\`

│ᐉⴰ📝┊ *Uso:* ${usedPrefix + command} [tipo] [cantidad] @tag
│ᐉⴰ💡┊ *Ejemplo:* ${usedPrefix + command} exp 30 @user @0*

┏──────────────
┊ 『 📦 RECURSOS 』
┗─────────────❐
│ᐉⴰ💎┊ *Diamantes:* limite
│ᐉⴰ🪙┊ *KantuCoins:* money 
│ᐉⴰ⚡┊ *Experiencia:* exp 
╰ׄ─ׄ─ׄ─⭒─ׄ─ׄ─ׄ─⭒─ׄ─ׄ─ׄ─⭒─ׄ─ׄ─ׄ─⭒`.trim()

const type = (args[0] || '').toLowerCase()
if (!item.includes(type)) return m.reply(lol, m.chat, { mentions: conn.parseMention(lol) })
const count = Math.max(1, isNumber(args[1]) ? parseInt(args[1]) : 1)
if (!Number.isSafeInteger(count) || count > 1_000_000) {
return m.reply('⚠️ La cantidad no es valida.')
}
let who = m.mentionedJid?.[0] || (args[2] ? (args[2].replace(/[@ .+-]/g, '') + '@s.whatsapp.net') : '')
if (!who) return m.reply('「 ꛕ 」 Es necesario etiquetar al destinatario para realizar el envío 👤')
const userToRes = await db.query('SELECT * FROM usuarios WHERE id = $1', [who])
let userTo = userToRes.rows[0]
if (!userTo) return m.reply(`「 ꛕ 」 Lo siento, el usuario ${who} no figura en mis registros ❌`)
if (user[type] * 1 < count) return m.reply(`⚠️ *𝙉𝙊 𝙏𝙄𝙀𝙉𝙀 𝙎𝙐𝙁𝙄𝘾𝙄𝙀𝙉𝙏𝙀 ${type.toUpperCase()}*`)

let confirm = `\`ESTÁS A PUNTO DE HACER ESTA TRANSFERENCIA\`

> 💹 *${count} ${type} para* *@${(who || '').replace(/@s\.whatsapp\.net/g, '')}*

\`¿DESEAS CONTINUAR?\`
> Tienes 60 segundos.

> Escribe: (si) para aceptar
> Escribe: (no) para cancelar`.trim()

await conn.reply(m.chat, confirm, m, { mentions: [who] })

confirmation[m.sender] = {
sender: m.sender,
to: who,
message: m,
type,
count,
timeout: setTimeout(() => {
m.reply('*SU TIEMPO SE HA TERMINADO*')
delete confirmation[m.sender]
}, 60 * 1000)
}}

handler.before = async m => {
if (!(m.sender in confirmation)) return
if (!m.originalText) return

let { timeout, sender, message, to, type, count } = confirmation[m.sender]
if (m.id === message.id) return

const userRes = await db.query('SELECT * FROM usuarios WHERE id = $1', [sender])
const userToRes = await db.query('SELECT * FROM usuarios WHERE id = $1', [to])
let user = userRes.rows[0]
let userTo = userToRes.rows[0]
if (!user || !userTo) return m.reply('❌ Usuarios no válidos.')

if (/^no$/i.test(m.originalText)) {
clearTimeout(timeout)
delete confirmation[sender]
return m.reply('*CANCELADO*')
}

if (/^si$/i.test(m.originalText)) {
const transfer = await db.query(`
  WITH accounts AS MATERIALIZED (
    SELECT id, COALESCE(exp, 0) AS exp, COALESCE(money, 0) AS money,
           COALESCE(limite, 0) AS limite
    FROM usuarios
    WHERE id IN ($3, $4)
    FOR UPDATE
  ),
  eligibility AS (
    SELECT COUNT(*) = 2
      AND $3 <> $4
      AND $1 IN ('exp', 'money', 'limite')
      AND MAX(CASE WHEN id = $3 THEN
        CASE $1 WHEN 'exp' THEN exp WHEN 'money' THEN money ELSE limite END
      END) >= $2
      AND MAX(CASE WHEN id = $4 THEN
        CASE $1 WHEN 'exp' THEN exp WHEN 'money' THEN money ELSE limite END
      END) <= 2147483647 - $2 AS allowed
    FROM accounts
  ),
  updated AS (
    UPDATE usuarios AS u
    SET exp = CASE WHEN $1 = 'exp'
          THEN COALESCE(u.exp, 0) + CASE WHEN u.id = $3 THEN -$2 ELSE $2 END
          ELSE u.exp END,
        money = CASE WHEN $1 = 'money'
          THEN COALESCE(u.money, 0) + CASE WHEN u.id = $3 THEN -$2 ELSE $2 END
          ELSE u.money END,
        limite = CASE WHEN $1 = 'limite'
          THEN COALESCE(u.limite, 0) + CASE WHEN u.id = $3 THEN -$2 ELSE $2 END
          ELSE u.limite END
    WHERE u.id IN ($3, $4) AND (SELECT allowed FROM eligibility)
    RETURNING u.id
  )
  SELECT COUNT(*) = 2 AS transferred FROM updated
`, [type, count, sender, to])
if (!transfer.rows[0]?.transferred) {
return m.reply('❌ La transferencia no pudo completarse; revisa el saldo o vuelve a intentarlo.')
}
m.reply(`✅ *TRANSFERENCIA HECHA:*\n\n*${count} ${type} para* @${(to || '').replace(/@s\.whatsapp\.net/g, '')}`, null, { mentions: [to] })
clearTimeout(timeout)
delete confirmation[sender]
}
}
handler.help = ['transfer'].map(v => v + ' [tipo] [cantidad] [@tag]')
handler.tags = ['econ']
handler.command = ['payxp', 'transfer', 'darxp', 'dar', 'enviar', 'transferir']
handler.disabled = false
handler.register = true

export default handler

function special(type) {
let b = type.toLowerCase()
let special = (['common', 'uncoommon', 'mythic', 'legendary', 'pet'].includes(b) ? ' Crate' : '')
return special
}

function isNumber(x) {
return !isNaN(x)
}
