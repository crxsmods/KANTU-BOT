import { db } from '../lib/postgres.js'
import { getSubbotConfig, invalidateSubbotConfig } from '../lib/postgres.js'

const handler = async (m, { conn, args, usedPrefix, command, isAdmin, isOwner }) => {
const isEnable = /true|enable|(turn)?on|1/i.test(command)
const type = (args[0] || '').toLowerCase()
const chatId = m.chat
const botId = conn.user?.id
const cleanId = botId.replace(/:\d+/, '');
const isSubbot = botId !== 'main'
let isAll = false, isUser = false
let res = await db.query('SELECT * FROM group_settings WHERE group_id = $1', [chatId]);
let chat = res.rows[0] || {};
const subbotConfig = isSubbot ? await getSubbotConfig(botId) : null;

// Indicadores visuales más limpios
const getStatus = (flag) => m.isGroup ? (chat[flag] ? '🟢' : '🔴') : '🚫';

// --- DISEÑO DEL MENÚ ---
let menu = `「 ⚙️ *PANEL DE CONFIGURACIÓN* 」\n\n`
menu += `> _Active o desactive funciones usando los comandos indicados._\n\n`
menu += `📊 *ESTADO ACTUAL:*
🟢 ⇢ _Activado_
🔴 ⇢ _Desactivado_
🚫 ⇢ _No disponible aquí_\n\n`

menu += `「 🛡️ *GESTIÓN DE GRUPOS* 」\n`
menu += `🔹 *Bienvenida* | ${getStatus('welcome')}
↳ _${usedPrefix + command} welcome_
\n`
menu += `🔹 *Detector* | ${getStatus('detect')}
↳ _${usedPrefix + command} detect_
\n`
menu += `🔹 *Antilink (Grupos)* | ${getStatus('antilink')}
↳ _${usedPrefix + command} antilink_
\n`
menu += `🔹 *Antilink (Todos)* | ${getStatus('antilink2')}
↳ _${usedPrefix + command} antilink2_
\n`
menu += `🔹 *Antifake* | ${getStatus('antifake')}
↳ _${usedPrefix + command} antifake_
\n`
menu += `🔹 *Modo NSFW* | ${getStatus('modohorny')}
↳ _${usedPrefix + command} nsfw_
\n`
menu += `🔹 *Solo Admins* | ${getStatus('modoadmin')}
↳ _${usedPrefix + command} modoadmin_
\n\n`

menu += `「 👑 *AJUSTES DE DUEÑO* 」\n`
menu += `🔸 *Antiprivado* | ${isSubbot ? (subbotConfig?.anti_private ? '🟢' : '🔴') : '🚫'}
↳ _${usedPrefix + command} antiprivate_
\n`
menu += `🔸 *Antillamadas* | ${isSubbot ? (subbotConfig?.anti_call ? '🟢' : '🔴') : '🚫'}
↳ _${usedPrefix + command} anticall_`
// --- FIN DEL MENÚ ---

switch (type) {
case 'welcome': case 'bienvenida':
if (!m.isGroup) throw '「⚠️」 *Esta función solo está disponible en grupos.*'
if (!isAdmin) throw "「⚠️」 *Acceso denegado. Solo administradores.*";
await db.query(`INSERT INTO group_settings (group_id) VALUES ($1) ON CONFLICT DO NOTHING`, [chatId])
await db.query(`UPDATE group_settings SET welcome = $1 WHERE group_id = $2`, [isEnable, chatId])
break

case 'detect': case 'avisos':
if (!m.isGroup) throw '「⚠️」 *Esta función solo está disponible en grupos.*'
if (!isAdmin) throw "「⚠️」 *Acceso denegado. Solo administradores.*";
await db.query(`INSERT INTO group_settings (group_id) VALUES ($1) ON CONFLICT DO NOTHING`, [chatId])
await db.query(`UPDATE group_settings SET detect = $1 WHERE group_id = $2`, [isEnable, chatId])
break

case 'antilink': case 'antienlace':
if (!m.isGroup) throw '「⚠️」 *Esta función solo está disponible en grupos.*'
if (!isAdmin) throw "「⚠️」 *Acceso denegado. Solo administradores.*";
await db.query(`INSERT INTO group_settings (group_id) VALUES ($1) ON CONFLICT DO NOTHING`, [chatId])
await db.query(`UPDATE group_settings SET antilink = $1 WHERE group_id = $2`, [isEnable, chatId])
break
      
case 'antilink2':
if (!m.isGroup) throw '「⚠️」 *Esta función solo está disponible en grupos.*'
if (!isAdmin) throw "「⚠️」 *Acceso denegado. Solo administradores.*";
await db.query(`INSERT INTO group_settings (group_id) VALUES ($1) ON CONFLICT DO NOTHING`, [chatId])
await db.query(`UPDATE group_settings SET antilink2 = $1 WHERE group_id = $2`, [isEnable, chatId])
break
            
case 'antiporn': case 'antiporno': case 'antinwfs':
if (!m.isGroup) throw '「⚠️」 *Esta función solo está disponible en grupos.*'
if (!isAdmin) throw "「⚠️」 *Acceso denegado. Solo administradores.*";
await db.query(`INSERT INTO group_settings (group_id) VALUES ($1) ON CONFLICT DO NOTHING`, [chatId])
await db.query(`UPDATE group_settings SET antiporn = $1 WHERE group_id = $2`, [isEnable, chatId])
break
            
case 'antifake':
if (!m.isGroup) throw '「⚠️」 *Esta función solo está disponible en grupos.*'
if (!isAdmin) throw "「⚠️」 *Acceso denegado. Solo administradores.*";
await db.query(`INSERT INTO group_settings (group_id) VALUES ($1) ON CONFLICT DO NOTHING`, [chatId])
await db.query(`UPDATE group_settings SET antifake = $1 WHERE group_id = $2`, [isEnable, chatId])
break
      
case 'nsfw': case "modohorny": case "modocaliente":
if (!m.isGroup) throw '「⚠️」 *Esta función solo está disponible en grupos.*'
if (!isAdmin) throw "「⚠️」 *Acceso denegado. Solo administradores.*";
  await db.query(`INSERT INTO group_settings (group_id) VALUES ($1) ON CONFLICT DO NOTHING`, [chatId])
  await db.query(`UPDATE group_settings SET modohorny = $1 WHERE group_id = $2`, [isEnable, chatId])
  break
      
case 'modoadmin': case 'onlyadmin':
if (!m.isGroup) throw '「⚠️」 *Esta función solo está disponible en grupos.*'
if (!isAdmin) throw "「⚠️」 *Acceso denegado. Solo administradores.*";
await db.query(`INSERT INTO group_settings (group_id) VALUES ($1) ON CONFLICT DO NOTHING`, [chatId])
await db.query(`UPDATE group_settings SET modoadmin = $1 WHERE group_id = $2`, [isEnable, chatId])
break

case 'antiprivate': case 'antiprivado':
if (!isSubbot && !isOwner) return m.reply('「❌」 *Esta configuración es exclusiva del Dueño.*');
await db.query(`INSERT INTO subbots (id, anti_private)
    VALUES ($1, $2)
    ON CONFLICT (id) DO UPDATE SET anti_private = $2`, [cleanId, isEnable]);
invalidateSubbotConfig(cleanId);
isAll = true;
break;

case 'anticall': case 'antillamada':
if (!isSubbot && !isOwner) return m.reply('「❌」 *Esta configuración es exclusiva del Dueño.*');
await db.query(`INSERT INTO subbots (id, anti_call)
    VALUES ($1, $2)
    ON CONFLICT (id) DO UPDATE SET anti_call = $2`, [cleanId, isEnable]);
invalidateSubbotConfig(cleanId);
isAll = true;
break;

default:
return m.reply(menu.trim());
}

// Mensaje de confirmación final
await m.reply(`✅ *Ajuste Actualizado*

📌 *Opción:* ${type.toUpperCase()}
⚙️ *Estado:* ${isEnable ? 'ENCENDIDO' : 'APAGADO'}
📍 *Alcance:* ${isAll ? 'General' : 'Este chat'}`)
}

handler.help = ['enable <opción>', 'disable <opción>']
handler.tags = ['config']
handler.command = /^((en|dis)able|(tru|fals)e|(turn)?o(n|ff)|[01])$/i
handler.register = true
export default handler
