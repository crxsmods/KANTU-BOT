let handler = async (m, { conn, command, text }) => {

if (command == 'eliminardiamantes' || command == 'quitardiamantes' || command == 'dellimit') {
  const pajak = 0;
  let who;
  if (m.isGroup) who = m.mentionedJid[0];
  else who = m.chat;
  if (!who) return m.reply(`⚠️ etiqueta a una persona con el @tag`) 
  const txt = text.replace('@' + who.split`@`[0], '').trim();
  if (!txt) return m.reply(`⚠️ Ingresa la cantidad que desea eliminar`)   
  if (isNaN(txt)) return m.reply(`⚠️ Falta el Num`)   
  const dmt = parseInt(txt);
  let limit = dmt;
  const pjk = Math.ceil(dmt * pajak);
  limit += pjk; 
  if (limit < 1) return m.reply(`⚠️ No tiene `) 
  const users = global.db.data.users;
  
  // Verificar que no se eliminen más diamantes de los que tiene
  if (dmt > users[who].limit) {
    return m.reply(`⚠️ No puedes eliminar más diamantes de los que tiene.\n*Diamantes actuales:* ${users[who].limit}`)
  }
  
  users[who].limit -= dmt;
  m.reply(`*≡ 💎 ＳＥ ＥＬＩＭＩＮＡＤＯ:*
┏╍╍╍╍╍╍╍╍╍╍╍╍╍
┃• *𝗍᥆𝗍ᥲᥣ:* ${dmt}
┃• *𝖣𝗂ᥲ𝗆ᥲ𝗇𝗍ᥱ𝗌 𝗋ᥱ𝗌𝗍ᥲ𝗇𝗍ᥱ𝗌:* ${users[who].limit}
┗╍╍╍╍╍╍╍╍╍╍╍╍╍`)}

if (command == 'eliminarxp' || command == 'delexp' || command == 'delxp') {
  const pajak = 0;
  let who;
  if (m.isGroup) who = m.mentionedJid[0];
  else who = m.chat;
  if (!who) return m.reply(`⚠️ etiqueta a una persona con el @tag`) 
  const txt = text.replace('@' + who.split`@`[0], '').trim();
  if (!txt) return m.reply(`⚠️ Ingresa la cantidad que desea eliminar`)   
  if (isNaN(txt)) return m.reply(`⚠️ Falta el Num`)   
  const xp = parseInt(txt);
  let exp = xp;
  const pjk = Math.ceil(xp * pajak);
  exp += pjk;
  if (exp < 1) return m.reply(`⚠️ Se `) 
  const users = global.db.data.users;
  
  // Verificar que no se eliminen más XP de los que tiene
  if (xp > users[who].exp) {
    return m.reply(`⚠️ No puedes eliminar más XP de los que tiene.\n*XP actual:* ${users[who].exp}`)
  }
  
  users[who].exp -= xp;
  m.reply(`*≡ ＥＸＰ ＥＬＩＭＩＮＡＤＯ:*
┏╍╍╍╍╍╍╍╍╍╍╍╍╍
┃• *𝗍᥆𝗍ᥲᥣ:* ${xp}
┃• *𝖷𝖯 𝗋ᥱ𝗌𝗍ᥲ𝗇𝗍ᥱ:* ${users[who].exp}
┗╍╍╍╍╍╍╍╍╍╍╍╍╍`)
}}
handler.help = ['delexp', 'dellimit']
handler.tags = ['owner']
handler.command = /^(eliminardiamantes|quitardiamantes|dellimit|eliminarxp|delexp|delxp)$/i
handler.rowner = true
handler.register = true 
export default handler
