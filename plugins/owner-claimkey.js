import fs from 'fs';
import path from 'path';

const keysFilePath = path.resolve('./src/key.json');

// Función para cargar keys
const loadKeys = () => {
    try {
        if (!fs.existsSync(keysFilePath)) {
            return [];
        }
        const data = fs.readFileSync(keysFilePath, "utf8");
        return JSON.parse(data);
    } catch (err) {
        console.error("❌ Error al cargar las keys:", err.message);
        return [];
    }
};

// Función para guardar keys
const saveKeys = (keys) => {
    try {
        fs.writeFileSync(keysFilePath, JSON.stringify(keys, null, 2));
        return true;
    } catch (err) {
        console.error("❌ Error al guardar las keys:", err.message);
        return false;
    }
};

let handler = async (m, { conn, args, text, usedPrefix, command }) => {
    if (!text) {
        return m.reply(`📝 Formato correcto:
${usedPrefix}${command} <key>

📌 Ejemplo:
${usedPrefix}${command} Key-KantuBot-Ax7B9k2M

> ℹ️ Nota: Comando Por HackStoreX "`);
    }

    try {
        // Validar formato de la key
        if (!text.startsWith('Key-KantuBot-')) {
            return m.reply('❌ Error: Formato de key inválido');
        }

        // Cargar keys
        let keys = loadKeys();
        
        // Buscar la key
        let keyIndex = keys.findIndex(k => k.key === text);
        
        if (keyIndex === -1) {
            return m.reply(`❌ Key no encontrada
            
📝 Verifica que:
▢ La key esté bien escrita
▢ La key exista
▢ No hayas usado una key caducada`);
        }

        let keyData = keys[keyIndex];

        // Verificar usos disponibles
        if (keyData.uses <= 0) {
            return m.reply(`❌ Esta key ya ha sido utilizada

ℹ️ Información:
▢ Key: ${keyData.key}
▢ Título: ${keyData.title}
▢ Estado: Agotada`);
        }

        // Reducir usos y actualizar
        keyData.uses--;
        keys[keyIndex] = keyData;

        // Guardar cambios
        if (saveKeys(keys)) {
            // Mensaje para el usuario en el chat
            await conn.reply(m.chat, `✅ *¡Key canjeada con éxito!*\n\n📦 *${keyData.title}*\n\nℹ️ El contenido ha sido enviado a tu privado.`, m);

            // Mensaje privado con el contenido
            let privateMessage = `🎉 *¡Key Canjeada Exitosamente!*\n\n`;
            privateMessage += `📦 *${keyData.title}*\n\n`;
            privateMessage += `📝 *Contenido:*\n${keyData.text}\n\n`;
            privateMessage += `ℹ️ *Información:*\n`;
            privateMessage += `▢ Usos restantes: ${keyData.uses}\n`;
            privateMessage += `▢ Estado: ${keyData.uses > 0 ? 'Activa ✅' : 'Agotada ❌'}\n\n`;
            privateMessage += `📌 *Nota:* Guarda esta información cuidadosamente.`;

            await conn.sendMessage(m.sender, { text: privateMessage });

            // Notificación al creador
            let creatorNotif = `┏━━⊜ *KEY CANJEADA* ⊜━━┓\n\n`;
            creatorNotif += `⊜ *Usuario:* wa.me/${m.sender.split`@`[0]}\n`;
            creatorNotif += `⊜ *Nombre:* ${m.name || 'No disponible'}\n`;
            creatorNotif += `⊜ *Key:* ${keyData.key}\n`;
            creatorNotif += `⊜ *Título:* ${keyData.title}\n`;
            creatorNotif += `⊜ *Usos restantes:* ${keyData.uses}\n`;
            creatorNotif += `⊜ *Fecha:* ${new Date().toLocaleString()}\n`;
            creatorNotif += `\n┗━━━━━━━━━━━━━━━┛`;

            // Enviar notificación al creador (reemplaza con tu número)
            await conn.sendMessage('5217121649714@s.whatsapp.net', { text: creatorNotif });

        } else {
            throw new Error('Error al actualizar la base de datos');
        }

    } catch (error) {
        console.error(error);
        return m.reply(`❌ Error al procesar la key: ${error.message}`);
    }
};

handler.help = ['.claimkey <key>'];
handler.tags = ['main'];
handler.command = /^(claimkey|ckey|claim)$/i;
handler.register = true

export default handler;
