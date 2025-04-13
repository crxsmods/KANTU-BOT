import fs from 'fs';
import path from 'path';

const cuentasFilePath = path.resolve('./src/cuentas.json');

// Función para cargar cuentas
const loadCuentas = () => {
    try {
        const data = fs.readFileSync(cuentasFilePath, "utf8");
        return JSON.parse(data);
    } catch (err) {
        console.error("❌ Error al cargar las cuentas:", err.message);
        return [];
    }
};

// Función para guardar cuentas
const saveCuentas = (cuentas) => {
    try {
        fs.writeFileSync(cuentasFilePath, JSON.stringify(cuentas, null, 2));
        return true;
    } catch (err) {
        console.error("❌ Error al guardar las cuentas:", err.message);
        return false;
    }
};

let handler = async (m, { conn, text, args, usedPrefix, command }) => {
    // Verificar si es admin/owner
    let isAdmin = global.db.data.users[m.sender].admin || false;
    if (!isAdmin) return m.reply('⚠️ Este comando es solo para administradores.');

    if (!text) return m.reply(`⚠️ Formato incorrecto. Uso correcto:
${usedPrefix}${command} <cuenta>|<usos>

📝 Ejemplo:
${usedPrefix}${command} CUENTA PREMIUM ⭐(NETFLIX)\n\nCorreo: ejemplo@gmail.com\nContraseña: Contraseña123|3

📌 Notas:
- Usa | para separar la cuenta y el número de usos
- El número de usos debe ser entre 1 y 100
- Mantén el formato consistente para mejor presentación`);

    try {
        // Separar texto y usos
        let [cuenta, usosStr] = text.split('|');
        
        if (!cuenta || !usosStr) {
            return m.reply('❌ Error: Debes proporcionar tanto la cuenta como el número de usos, separados por |');
        }

        // Validar y convertir usos a número
        let usos = parseInt(usosStr);
        
        if (isNaN(usos)) {
            return m.reply('❌ Error: El número de usos debe ser un número válido');
        }

        if (usos < 1 || usos > 100) {
            return m.reply('❌ Error: El número de usos debe estar entre 1 y 100');
        }

        // Cargar cuentas existentes
        let cuentas = loadCuentas();

        // Crear nueva cuenta
        let nuevaCuenta = {
            "text": cuenta.trim(),
            "uses": usos
        };

        // Añadir nueva cuenta
        cuentas.push(nuevaCuenta);

        // Guardar cambios
        if (saveCuentas(cuentas)) {
            let mensaje = `✅ Cuenta añadida exitosamente\n\n`;
            mensaje += `📝 Detalles:\n`;
            mensaje += `▢ Cuenta: ${cuenta.trim()}\n`;
            mensaje += `▢ Usos: ${usos}\n`;
            mensaje += `▢ Total de cuentas: ${cuentas.length}`;
            
            await m.reply(mensaje);
        } else {
            throw new Error('Error al guardar en el archivo');
        }

    } catch (error) {
        console.error(error);
        return m.reply(`❌ Error al añadir la cuenta: ${error.message}`);
    }
};

handler.help = ['.addrop <cuenta>|<usos>'];
handler.tags = ['owner'];
handler.command = /^(addrop)$/i;
handler.rowner = true;

export default handler;
