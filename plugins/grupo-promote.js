const handler = async (m, { conn, text, usedPrefix, command }) => {
    // Definimos quién es el usuario objetivo (Prioridad: Mención > Respuesta > Texto)
    let who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : false;

    // 1. Si no se detecta a quién remover privilegios
    if (!who) return conn.reply(m.chat, `「 ꛕ 」 Es necesario mencionar a un usuario o responder a su mensaje para realizar esta acción. 👤`, m);

    // 2. Validación de longitud
    let userNumber = who.split('@')[0];
    if (userNumber.length < 8 || userNumber.length > 15) return conn.reply(m.chat, `「 ꛕ 」 El identificador ingresado no es válido. Por favor, verifica el número o etiqueta a un usuario activo. 📑`, m);

    try {
        // Ejecución del comando
        await conn.groupParticipantsUpdate(m.chat, [who], 'demote');
        
        // Mensaje de éxito profesional
        conn.reply(m.chat, `「 ꛕ 」 Privilegios de administrador removidos correctamente. ⚖️`, m);
        
    } catch (e) {
        // En caso de que el usuario no sea admin o haya ocurrido un error
        conn.reply(m.chat, `「 ꛕ 」 No se pudo completar la operación. Verifica que el usuario tenga un rango asignado. ⚠️`, m);
    }
};

handler.help = ['demote'].map((v) => v + ' *@tag*');
handler.tags = ['group'];
handler.command = /^(demote|quitaradmin|quitarpoder)$/i;
handler.group = true;
handler.admin = true;
handler.botAdmin = true;
handler.register = true;

export default handler;
