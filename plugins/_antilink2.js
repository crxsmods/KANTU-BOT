let linkRegex = /https:/i
export async function before(m, { isAdmin, isBotAdmin, text }) {
  if (m.isBaileys && m.fromMe)
    return !0
  if (!m.isGroup) return !1
  
  // Asegurarse de que chat existe y tiene un valor predeterminado
  let chat = global.db.data.chats[m.chat] || {};
  
  let delet = m.key.participant
  let bang = m.key.id
  const user = `@${m.sender.split`@`[0]}`;
  
  // Asegurarse de que bot tiene un valor predeterminado
  let bot = global.db.data.settings[this.user.jid] || {};
  
  const isGroupLink = linkRegex.exec(m.text)
  
  // Comprobar si chat.antiLink2 existe antes de usarlo
  if (chat && chat.antiLink2 && isGroupLink && !isAdmin) {
    if (isBotAdmin) {
      try {
        const linkThisGroup = `https://chat.whatsapp.com/${await this.groupInviteCode(m.chat)}`
        const linkThisGroup2 = `https://www.youtube.com/`
        const linkThisGroup3 = `https://youtu.be/`
        if (m.text.includes(linkThisGroup)) return !0
        if (m.text.includes(linkThisGroup2)) return !0
        if (m.text.includes(linkThisGroup3)) return !0
      } catch (e) {
        console.error('Error al obtener el código de invitación del grupo', e);
      }
    }    
    
    await conn.sendMessage(m.chat, {
      text: `*「 ANTILINK DETECTADO 」*\n\n${user} 🤨 Rompiste las reglas del Grupo sera eliminado....`, 
      mentions: [m.sender]
    }, {quoted: m})
    
    if (!isBotAdmin) return m.reply('*Te salvarte gil, no soy admin no te puedo eliminar*')  
    
    if (isBotAdmin) {
      try {
        await conn.sendMessage(m.chat, { 
          delete: { 
            remoteJid: m.chat, 
            fromMe: false, 
            id: bang, 
            participant: delet 
          }
        })
        
        let responseb = await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
        if (responseb[0].status === "404") return
      } catch (e) {
        console.error('Error al eliminar mensaje o participante', e);
      }
    } else if (!bot.restrict) {
      return m.reply('*𝙀𝙡 𝙥𝙧𝙤𝙥𝙞𝙚𝙩𝙖𝙧𝙞𝙤 𝙙𝙚𝙡 𝙗𝙤𝙩 𝙣𝙤 𝙩𝙞𝙚𝙣𝙚 𝙖𝙘𝙩𝙞𝙫𝙖𝙙𝙤 𝙚𝙡 𝙧𝙚𝙨𝙩𝙧𝙞𝙘𝙘𝙞𝙤́𝙣 (𝙚𝙣𝙖𝙗𝙡𝙚 𝙧𝙚𝙨𝙩𝙧𝙞𝙘𝙩) 𝙘𝙤𝙣𝙩𝙖𝙘𝙩𝙚 𝙘𝙤𝙣 𝙚𝙡 𝙥𝙖𝙧𝙖 𝙦𝙪𝙚 𝙡𝙤𝙨 𝙝𝙖𝙗𝙞𝙡𝙞𝙩𝙚*')
    }
  }
  return !0
} 
