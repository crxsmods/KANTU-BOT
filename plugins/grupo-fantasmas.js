import { db } from '../lib/postgres.js';

let handler = async (m, { conn, text, participants, args, command, metadata }) => {
try {
    // Consultamos la base de datos para obtener el conteo real de mensajes
    const result = await db.query(`SELECT user_id, message_count FROM messages WHERE group_id = $1`, [m.chat]);
    
    let memberData = participants.map(mem => {
        const userId = mem.id;
        const userData = result.rows.find(row => row.user_id === userId) || { message_count: 0 };
        return { 
            id: userId,
            messages: parseInt(userData.message_count), // Aseguramos que sea un número
            isAdmin: mem.admin === 'admin' || mem.admin === 'superadmin'
        }
    });

    let sum = text ? parseInt(text) : memberData.length;
    if (isNaN(sum) || sum <= 0) sum = memberData.length;

    // Filtro estricto: 0 mensajes y que NO sea admin
    let sider = memberData.slice(0, sum).filter(mem => mem.messages === 0 && !mem.isAdmin);
    let total = sider.length;

    switch (command.toLowerCase()) {
        case 'fantasmas':
            if (total === 0) return m.reply(`「 ꛕ 」 No se han detectado usuarios inactivos en este grupo. ✨`);
            
            let teks = `「 ꛕ 」 👻 *REVISIÓN DE INACTIVOS* 👻\n\n`;
            teks += `◦ *Grupo:* ${metadata.subject}\n`;
            teks += `◦ *Miembros analizados:* ${memberData.length}\n`;
            teks += `◦ *Usuarios inactivos:* ${total}\n\n`;
            teks += `[ *LISTA DE FANTASMAS* ]\n`;
            teks += sider.map(v => `  👉🏻 @${v.id.split('@')[0]}`).join('\n');
            teks += `\n\n_Nota: El sistema contabiliza la actividad desde que el bot fue incorporado al grupo._ ⚠️`;
            
            await conn.sendMessage(m.chat, { text: teks, contextInfo: { mentionedJid: sider.map(v => v.id)}}, { quoted: m });
            break;

        case 'kickfantasmas':
            if (total === 0) return m.reply(`「 ꛕ 」 No hay usuarios inactivos disponibles para depuración. ✅`);
            
            let kickTeks = `「 ꛕ 」 *DEPURACIÓN DE FANTASMAS* 👻\n\n`;
            kickTeks += `◦ *Usuarios a eliminar:* ${total}\n`;
            kickTeks += `◦ *Estado:* Iniciando protocolo...\n\n`;
            kickTeks += `[ *IDENTIFICADOS* ]\n`;
            kickTeks += sider.map(v => `@${v.id.split('@')[0]}`).join('\n');
            kickTeks += `\n\n_El proceso de expulsión comenzará en 20 segundos con intervalos de seguridad._ 🛡️`;
            
            await conn.sendMessage(m.chat, { text: kickTeks, contextInfo: { mentionedJid: sider.map(v => v.id) }}, { quoted: m });

            let chatSettings = (await db.query("SELECT * FROM group_settings WHERE group_id = $1", [m.chat])).rows[0] || {};
            let originalWelcome = chatSettings.welcome || true;
            await db.query(`UPDATE group_settings SET welcome = false WHERE group_id = $1`, [m.chat]);
            
            await delay(20000); 
            try {
                for (let user of sider) {
                    if (user.id !== conn.user.jid) { 
                        await conn.groupParticipantsUpdate(m.chat, [user.id], 'remove');
                        await delay(10000); 
                    }
                }
            } finally {
                await db.query(`UPDATE group_settings SET welcome = $1 WHERE group_id = $2`, [originalWelcome, m.chat]);
            }
            await m.reply(`「 ꛕ 」 La limpieza de miembros inactivos se ha completado. ✅`);
            break;
    }
} catch (err) {
    console.error(err);
    m.reply("「 ꛕ 」 Error al sincronizar con la base de datos. Intente nuevamente. ⚠️");
}}; 

handler.help = ['fantasmas', 'kickfantasmas'];
handler.tags = ['group'];
handler.command = /^(fantasmas|kickfantasmas)$/i;
handler.group = true;
handler.botAdmin = true;
handler.admin = true; 
handler.register = true;

export default handler;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
