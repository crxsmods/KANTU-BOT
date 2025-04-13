let handler = async (m, { conn, args, text, command }) => {
let fkontak = { "key": { "participants":"0@s.whatsapp.net", "remoteJid": "status@broadcast", "fromMe": false, "id": "Halo" }, "message": { "contactMessage": { "vcard": `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${conn.user.jid.split('@')[0]}:${conn.user.jid.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD` }}, "participant": "0@s.whatsapp.net" }

if (!text) throw `*⚠️ Uso correcto del comando:*\n\n*.setcrxs ID_GRUPO|mensaje*\n\n*📝 Ejemplo:*\n.setcrxs 123456789@g.us|Hola a todos\n\n*💡 Para obtener el ID:*\nUse .inspect dentro del grupo deseado`  
  
// Dividir el texto solo por la primera ocurrencia de '|'
let splitIndex = text.indexOf('|');
if (splitIndex === -1) throw '*⚠️ Formato incorrecto. Use: ID_GRUPO|mensaje*';

let groupId = text.substring(0, splitIndex).trim();
let message = text.substring(splitIndex + 1).trim(); // Toma todo el contenido después del primer '|'
  
if (!groupId || !message) throw '*⚠️ Formato incorrecto. Use: ID_GRUPO|mensaje*'  
  
try {  
    let status = await conn.reply(m.chat, '*🚀 Iniciando envío del mensaje...*', m)  
    let success = false  
    let error = ''  
    let methodUsed = ''  
      
    // Obtener metadata del grupo  
    let groupMetadata = await conn.groupMetadata(groupId)  
    let participants = groupMetadata.participants  
      
    // Actualizar estado  
    await conn.sendMessage(m.chat, { text: '*⚡ Probando diferentes métodos de envío...*', edit: status.key })  
      
    // Método 1: SendMessage con menciones
    try {  
        await conn.sendMessage(groupId, {  
            text: message,  
            mentions: participants.map(v => v.id)  
        }, { quoted: fkontak })  
        success = true  
        methodUsed = 'Mensaje con menciones'  
    } catch (e) {  
        error += '❌ Método 1 falló\n'  
          
        // Método 2: Reply directo  
        try {  
            await conn.reply(groupId, message, null)  
            success = true  
            methodUsed = 'Reply directo'  
        } catch (e) {  
            error += '❌ Método 2 falló\n'  
              
            // Método 3: SendMessage simple  
            try {  
                await conn.sendMessage(groupId, { text: message })  
                success = true  
                methodUsed = 'Mensaje simple'  
            } catch (e) {  
                error += '❌ Método 3 falló\n'  
                  
                // Método 4: Legacy send  
                try {  
                    await conn.sendMessage(groupId, message)  
                    success = true  
                    methodUsed = 'Envío legacy'  
                } catch (e) {  
                    error += '❌ Método 4 falló\n'  
                      
                    // Méto do 5: Envío en partes  
                    try {  
                        const chunkSize = 4096; // Tamaño máximo del mensaje  
                        for (let i = 0; i < message.length; i += chunkSize) {  
                            const chunk = message.substring(i, i + chunkSize);  
                            await conn.sendMessage(groupId, { text: chunk });  
                        }  
                        success = true;  
                        methodUsed = 'Envío en partes';  
                    } catch (e) {  
                        error += '❌ Método 5 falló\n';  
                    }  
                }  
            }  
        }  
    }  

    if (success) {  
        await conn.sendMessage(m.chat, {  
            text: `*✅ MENSAJE ENVIADO EXITOSAMENTE*\n\n*📝 Detalles:*\n• *Grupo:* ${groupMetadata.subject}\n• *Miembros:* ${participants.length}\n• *Método:* ${methodUsed}\n\n*📄 Mensaje:*\n${message}`,  
            edit: status.key  
        });  
    } else {  
        throw `*⚠️ No se pudo enviar el mensaje*\n\n${error}\n\n*Posibles causas:*\n- ID de grupo incorrecto\n- Bot no está en el grupo\n- Bot no tiene permisos\n- Grupo no existe`;  
    }  
      
} catch (e) {  
    console.log(e);  
    await conn.sendMessage(m.chat, {  
        text: `*❌ ERROR AL ENVIAR*\n\n- Verifique el ID del grupo\n- Confirme que el bot esté en el grupo\n- El bot debe tener permisos\n\n*ID usado:* ${groupId}`,  
        edit: status.key  
    });  
}  
}  

handler.help = ['setcrxs <groupid|mensaje>'];  
handler.tags = ['owner'];  
handler.command = /^(setcrxs)$/i;  
handler.owner = true;  
handler.fail = null;  

export default handler;