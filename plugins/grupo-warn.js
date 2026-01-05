import { db } from '../lib/postgres.js';

const maxwarn = 3;

let handler = async (m, { conn, text, usedPrefix, command }) => {
    try {
        let who;
        if (m.isGroup) {
            who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false;
        } else {
            who = m.chat;
        }

        if (!who) return m.reply(`「 ꛕ 」 *Acción Requerida*\n\nDebe etiquetar a un usuario o citar un mensaje para aplicar la advertencia.`);
        
        let userResult = await db.query(`SELECT * FROM usuarios WHERE id = $1`, [who]);

        if (userResult.rows.length === 0) {
            await db.query(`INSERT INTO usuarios (id, warn) VALUES ($1, 0)`, [who]);
            userResult = await db.query(`SELECT * FROM usuarios WHERE id = $1`, [who]);
        }

        const moderatorName = m.pushName || 'Administrador';
        let warn = userResult.rows[0].warn || 0;

        // LIMPIEZA DE LA RAZÓN: Eliminamos la mención del texto para que no se repita
        let mentionTag = `@${who.split('@')[0]}`;
        let reason = text.replace(mentionTag, '').trim(); 
        if (!reason || reason === mentionTag) reason = 'No especificada por el emisor';

        if (warn < maxwarn - 1) {
            await db.query(`UPDATE usuarios SET warn = warn + 1 WHERE id = $1`, [who]);
            warn += 1;
            
            await conn.reply(m.chat, `「 ꛕ 」 *Nueva Advertencia Registrada*\n\nSe ha emitido un aviso formal para @${who.split`@`[0]}\n\n📋 *Detalles:*\n• *Moderador:* ${moderatorName}\n• *Razón:* ${reason}\n• *Estado:* ${warn} / ${maxwarn}`, m, { mentions: [who] });
            
        } else {
            await db.query(`UPDATE usuarios SET warn = 0 WHERE id = $1`, [who]);
            await conn.reply(m.chat, `「 ꛕ 」 *Límite de Sanciones Alcanzado*\n\nEl usuario @${who.split`@`[0]} ha excedido el máximo de ${maxwarn} advertencias. Iniciando proceso de expulsión...`, m, { mentions: [who] });
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            await conn.groupParticipantsUpdate(m.chat, [who], 'remove');
        }
    } catch (err) {
        console.error(err);
        m.reply(`「 ꛕ 」 *Error de Sistema*\n\nNo se pudo procesar la solicitud en la base de datos.`);
    }
};

handler.help = ['warn @user [razón]'];
handler.tags = ['group'];
handler.command = /^warn$/i;
handler.group = true;
handler.admin = true;
handler.botAdmin = true;
handler.register = true;

export default handler;
