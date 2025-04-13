let mutedUsers = new Set();

let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!m.mentionedJid?.length) return m.reply(`⚠️ Menciona a un usuario para silenciar.`);

    let target = m.mentionedJid[0];

    if (command === 'mute') {
        mutedUsers.add(target);
        m.reply(`✅ ${target.includes('@s.whatsapp.net') ? target.split('@')[0] : target} ha sido silenciado.`);
    } else if (command === 'unmute') {
        mutedUsers.delete(target);
        m.reply(`✅ ${target.includes('@s.whatsapp.net') ? target.split('@')[0] : target} ha sido desilenciado.`);
    }
};

let messageHandler = async (m) => {
    if (mutedUsers.has(m.sender)) {
        try {
            await conn.sendMessage(m.chat, { delete: m.key });
        } catch (err) {
            console.error(err);
        }
    }
};

handler.help = ['mute *@user*', 'unmute *@user*'];
handler.tags = ['group'];
handler.command = /^mute|unmute$/i;
handler.group = true; 
handler.admin = true; 
handler.botAdmin = true; 
handler.register = true;

export default { handler, messageHandler };