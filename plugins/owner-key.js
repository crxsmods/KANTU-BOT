import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const keysFilePath = path.resolve('./src/key.json');

// Función para generar key única
const generateUniqueKey = () => {
    const prefix = "Key-KantuBot-";
    const length = Math.floor(Math.random() * (10 - 8 + 1)) + 8;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < length; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return prefix + key;
};

// Función para cargar keys
const loadKeys = () => {
    try {
        if (!fs.existsSync(keysFilePath)) {
            fs.writeFileSync(keysFilePath, '[]', 'utf8');
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

// Función para verificar key única
const isKeyUnique = (key, existingKeys) => {
    return !existingKeys.some(k => k.key === key);
};

let handler = async (m, { conn, text, args, usedPrefix, command }) => {
    if (!text) {
        return m.reply(`📝 Formato correcto:
${usedPrefix}${command} título|texto|usos

📌 Ejemplo:
${usedPrefix}${command} Netflix Premium|usuario: ejemplo@gmail.com contraseña: 123456|5

ℹ️ Notas:
- Usa | para separar el título, texto y usos
- Usos permitidos: 1-100
- La key se generará automáticamente`);
    }

    try {
        // Separar título, texto y usos
        let [title, content, usosStr] = text.split('|');
        
        if (!title || !content || !usosStr) {
            return m.reply('❌ Error: Debes incluir título, texto y usos separados por |');
        }

        // Validar título
        if (title.length < 3) {
            return m.reply('❌ Error: El título es demasiado corto');
        }

        // Validar contenido
        if (content.length < 3) {
            return m.reply('❌ Error: El texto es demasiado corto');
        }

        // Validar y convertir usos
        let usos = parseInt(usosStr);
        
        if (isNaN(usos)) {
            return m.reply('❌ Error: El número de usos debe ser un número válido');
        }

        if (usos < 1 || usos > 100) {
            return m.reply('❌ Error: Los usos deben estar entre 1 y 100');
        }

        // Cargar keys existentes
        let keys = loadKeys();

        // Generar key única
        let newKey;
        do {
            newKey = generateUniqueKey();
        } while (!isKeyUnique(newKey, keys));

        // Crear nueva entrada
        let keyEntry = {
            "key": newKey,
            "title": title.trim(),
            "text": content.trim(),
            "uses": usos
        };

        // Añadir nueva key
        keys.push(keyEntry);

        // Guardar cambios
// En la parte donde se envían los mensajes, reemplaza ese bloque por este:

if (saveKeys(keys)) {
    try {
        // Función de delay
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // Primer mensaje con los detalles privados
        let mensajePrivado = `✅ Key generada exitosamente\n\n`;
        mensajePrivado += `📝 Detalles:\n`;
        mensajePrivado += `▢ Key: ${newKey}\n`;
        mensajePrivado += `▢ Título: ${title.trim()}\n`;
        mensajePrivado += `▢ Usos: ${usos}\n`;
        mensajePrivado += `▢ Total de keys: ${keys.length}`;
        
        await conn.reply(m.chat, mensajePrivado, m);
        await delay(1000); // Espera 1 segundo

        // Segundo mensaje solo con la key
        await conn.reply(m.chat, `🔑 *KEY:*\n\n${newKey}`, m);
        await delay(1000); // Espera 1 segundo

        // Tercer mensaje público
        let mensajePublico = `╭━━━━━━━━━⬣
┃ ✅ *KEY GENERADA*
┃━━━━━━━━━━⬣
┃ 📝 *DETALLES*
┃
┃ ▢ *Key:* 
┃ ${newKey}
┃
┃ ▢ *Título:* 
┃ ${title.trim()}
┃
┃ ▢ *Usos:* 
┃ ${usos}
┃
┃━━━━━━━━━━⬣
┃ 📱 *Canjea la key en:*
┃ wa.me/525662019549
┃
┃ 📍 *Comando:*
┃ .claimkey {KEY}
╰━━━━━━━━━⬣`;

        await conn.reply(m.chat, mensajePublico, m);

    } catch (sendError) {
        console.error("Error al enviar mensajes:", sendError);
        throw new Error('Error al enviar los mensajes');
    }
} else {
    throw new Error('Error al guardar en el archivo');
}

    } catch (error) {
        console.error(error);
        return m.reply(`❌ Error al generar la key: ${error.message}`);
    }
};

handler.help = ['.dropkey <título>|<texto>|<usos>'];
handler.tags = ['owner'];
handler.command = /^(dropkey)$/i;
handler.rowner = true;


export default handler;
