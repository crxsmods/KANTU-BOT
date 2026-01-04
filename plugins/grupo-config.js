let handler = async (m, { conn, args, usedPrefix, command, isOwner, text}) => {
let groupId = m.isGroup ? m.chat : null;

// 1. Validación de permisos en privado
if (!m.isGroup && !isOwner) return m.reply('「 ꛕ 」 *ACCESO RESTRINGIDO*\n\n> _Esta función en chat privado es exclusiva para el propietario del bot._ ⚠️');

let identifier, action, target;

if (!m.isGroup && !m.isAdmin && isOwner) {
if (args.length < 2) return m.reply(`「 ꛕ 」 *FORMATO INVÁLIDO*\n\n📌 *Uso:* ${usedPrefix + command} [id/enlace] [ID/URL] - [acción] [+número]\n\n💡 *Ejemplo:* ${usedPrefix + command} id 12345 - abrir`)

if (args[0].startsWith('id')) {
identifier = args[1];
action = args[2]?.replace('-', '').trim().toLowerCase();
target = args[3]?.replace('+', '') + '@s.whatsapp.net';
groupId = identifier;
} else if (args[0].match(/chat\.whatsapp\.com/)) {
identifier = args[0];
if (args[1] === '-') {
action = args[2]?.trim().toLowerCase();
target = args[3]?.replace('+', '') + '@s.whatsapp.net';
} else {
action = args[1]?.replace('-', '').trim().toLowerCase();
target = args[2]?.replace('+', '') + '@s.whatsapp.net';
}
const inviteCode = identifier.match(/(?:https:\/\/)?(?:www\.)?(?:chat\.|wa\.)?whatsapp\.com\/(?:invite\/|joinchat\/)?([0-9A-Za-z]{22,24})/i)?.[1];
if (!inviteCode) return m.reply('「 ꛕ 」 *ERROR DE ENLACE*\n\n> _El enlace proporcionado no es válido o ha expirado._ ⚠️')
try {
const inviteInfo = await conn.groupGetInviteInfo(inviteCode);
groupId = inviteInfo.id;
} catch (e) {
return m.reply('「 ꛕ 」 *ERROR DE CONEXIÓN*\n\n> _No se pudo obtener información del grupo. Verifique los permisos del bot._ ⚠️')
}} else if (args[0] === 'enlace') {
identifier = args[1];
if (args[2] === '-') {
action = args[3]?.trim().toLowerCase();
target = args[4]?.replace('+', '') + '@s.whatsapp.net';
} else {
action = args[2]?.replace('-', '').trim().toLowerCase();
target = args[3]?.replace('+', '') + '@s.whatsapp.net';
}
if (!identifier.match(/chat\.whatsapp\.com/)) {
return m.reply('「 ꛕ 」 *ENLACE INVÁLIDO*\n\n> _Debe proporcionar una URL de invitación válida._ ⚠️')
}
const inviteCode = identifier.match(/(?:https:\/\/)?(?:www\.)?(?:chat\.|wa\.)?whatsapp\.com\/(?:invite\/|joinchat\/)?([0-9A-Za-z]{22,24})/i)?.[1];
if (!inviteCode) return m.reply('「 ꛕ 」 *ERROR DE ENLACE*\n\n> _El enlace proporcionado no es válido._ ⚠️')
try {
const inviteInfo = await conn.groupGetInviteInfo(inviteCode);
groupId = inviteInfo.id;
} catch (e) {
return m.reply('「 ꛕ 」 *ERROR DE ACCESO*\n\n> _No se pudo recuperar la ID del grupo desde el enlace._ ⚠️')
}} else {
return m.reply('「 ꛕ 」 *PARÁMETRO REQUERIDO*\n\n> _Use "id" o "enlace" para especificar el destino en privado._ 📌')
}} else if (m.isGroup) {
action = args[0]?.toLowerCase();
target = (args[1]?.replace(/@/, '') || m.quoted?.sender?.split('@')[0]) + '@s.whatsapp.net';
}

if (!groupId) return m.reply('「 ꛕ 」 *UBICACIÓN NO IDENTIFICADA*\n\n> _Debe ejecutar esto en un grupo o especificar un destino válido._ ⚠️');
if (!action) return m.reply('「 ꛕ 」 *ACCIÓN NO ESPECIFICADA*\n\n> _Por favor, indique la tarea a realizar (abrir, cerrar, daradmin, etc.)._ ⚙️')

switch (action) {
case 'abrir': case 'open': case 'abierto':
await conn.groupSettingUpdate(groupId, 'not_announcement');
m.reply(`「 ꛕ 」 *CONFIGURACIÓN ACTUALIZADA*\n\n> _El grupo ha sido abierto. Ahora todos los participantes pueden enviar mensajes._ 🟢`);
break;

case 'cerrar': case 'close': case 'cerrado':
await conn.groupSettingUpdate(groupId, 'announcement');
m.reply(`「 ꛕ 」 *CONFIGURACIÓN ACTUALIZADA*\n\n> _El grupo ha sido cerrado. Solo los administradores pueden enviar mensajes._ 🔴`);
break;

case 'addadmin': case 'promote': case 'daradmin':
if (!target || target.includes('undefined')) return m.reply('「 ꛕ 」 *USUARIO REQUERIDO*\n\n> _Mencione a alguien o ingrese su número con el formato internacional._ ⚠️')
await conn.groupParticipantsUpdate(groupId, [target], 'promote');
m.reply(`「 ꛕ 」 *RANGO ACTUALIZADO*\n\n@${target.split('@')[0]} ha sido ascendido a Administrador correctamente. ✅`, null, { mentions: [target] });
break;

case 'removeadmin': case 'demote': case 'quitaradmin':
if (!target || target.includes('undefined')) return m.reply('「 ꛕ 」 *USUARIO REQUERIDO*\n\n> _Especifique al administrador que desea degradar._ ⚠️')
await conn.groupParticipantsUpdate(groupId, [target], 'demote');
m.reply(`「 ꛕ 」 *RANGO ACTUALIZADO*\n\n@${target.split('@')[0]} ya no posee facultades administrativas. ❌`, null, { mentions: [target] });
break;

case 'kick': case 'eliminar':
if (!target || target.includes('undefined')) return m.reply('「 ꛕ 」 *USUARIO REQUERIDO*\n\n> _Identifique al usuario que será removido del grupo._ ⚠️')
await conn.groupParticipantsUpdate(groupId, [target], 'remove');
m.reply(`「 ꛕ 」 *ACCION COMPLETADA*\n\nEl usuario @${target.split('@')[0]} ha sido expulsado del grupo. 🗑️`, null, { mentions: [target] });
break;

case 'aprobar':
if (!target || target.includes('undefined')) return m.reply('「 ꛕ 」 *USUARIO REQUERIDO*\n\n> _Indique el número de la solicitud que desea aprobar._ ⚠️')
await conn.groupRequestParticipantsUpdate(groupId, [target], 'approve');
m.reply(`「 ꛕ 」 *SOLICITUD ACEPTADA*\n\n@${target.split('@')[0]} ahora forma parte del grupo. ✅`, null, { mentions: [target] });
break;

default:
return m.reply(`「 ꛕ 」 *COMANDO INVÁLIDO*

*MODO GRUPO:*
↳ ${usedPrefix + command} abrir
↳ ${usedPrefix + command} cerrar
↳ ${usedPrefix + command} daradmin @usuario
↳ ${usedPrefix + command} eliminar @usuario

*MODO DUEÑO (PRIVADO):*
↳ ${usedPrefix + command} id [ID] - abrir
↳ ${usedPrefix + command} enlace [URL] - cerrar
↳ ${usedPrefix + command} id [ID] - daradmin +número`)
}
};

handler.help = ['grupo abrir', 'grupo cerrar', 'grupo eliminar'];
handler.tags = ['group'];
handler.command = /^(group|grupo)$/i;

export default handler;
