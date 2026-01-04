import { db } from '../lib/postgres.js';

const maxwarn = 3;
let handler = async (m, { conn, participants, metadata }) => {
    try {
        const result = await db.query(`SELECT id, warn FROM usuarios WHERE warn > 0`);
        
        // Filtramos usuarios que pertenecen al grupo actual
        const warnedUsers = result.rows.filter(user => 
            participants.some(p => p.id === user.id)
        ).map(user => ({ id: user.id, warn: user.warn }));

        // Ordenamos de mayor a menor número de advertencias
        warnedUsers.sort((a, b) => b.warn - a.warn);

        let teks = `「 ꛕ 」 *REPORTE DE INFRACCIONES* 📋\n\n`;
        teks += `🔹 *Grupo:* ${metadata.subject || 'Desconocido'}\n`;
        teks += `🔹 *Usuarios sancionados:* ${warnedUsers.length}\n\n`;

        if (warnedUsers.length === 0) {
            teks += `No se han detectado registros de advertencias en esta unidad. ✅`;
        } else {
            teks += `[ **LISTADO DE PENALIZACIONES** ]\n`;
            // Aplicando la función de mapeo para los tags
            teks += warnedUsers.map(u => `  ◦ @${u.id.split('@')[0]} | Advertencias: [ ${u.warn} / ${maxwarn} ]`).join('\n');
            
            teks += `\n\n⚠️ *Aviso:* Al acumular un total de *${maxwarn}* faltas, el sistema procederá con la restricción de acceso (expulsión).`;
        }

        // Enviamos el mensaje con las menciones habilitadas
        await conn.sendMessage(m.chat, { 
            text: teks, 
            contextInfo: { mentionedJid: warnedUsers.map(u => u.id) }
        }, { quoted: m });

    } catch (err) {
        console.error(err);
        m.reply(`「 ꛕ 」 Se ha producido una anomalía al consultar el registro de sanciones. ⚠️`);
    }
};

handler.help = ['listwarn'];
handler.tags = ['group'];
handler.command = /^listwarn$/i;
handler.group = true;
handler.register = true;

export default handler;
