import axios from 'axios';

const tokens = [
    'apis-token-14320.awVJI8iaE5FpqTYQ47K6y4SDCxicRWQf',
    'apis-token-14321.mNXp29CXnvA169VpfuSOA7kvfFX4clcQ',
    'apis-token-14322.qJb9HOM4MM9rJFM4xRG2I4O76T37cFVa'
];

const handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!args[0]) throw `⚠️ *Por favor, ingresa un DNI válido de Perú*\nEjemplo: ${usedPrefix + command} 46027897`;

    const input = args[0].replace(/[^0-9]/g, ''); // Limpiar el input para que solo contenga números
    const apiUrl = `https://api.apis.net.pe/v2/reniec/dni?numero=${input}`;
    
    // Seleccionar un token al azar
    const token = tokens[Math.floor(Math.random() * tokens.length)];

    try {
        // Realizar la solicitud a la API
        const response = await axios.get(apiUrl, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        // Verificar que la respuesta tenga datos
        if (response.status === 200) {
            const info = response.data; // Obtenemos los datos para DNI
            const respuestaDNI = `👤 *Información de DNI*\n\n` +
                `🌟 *Nombres:* ${info.nombres || 'No disponible'}\n` +
                `👨‍👦 *Apellido Paterno:* ${info.apellidoPaterno || 'No disponible'}\n` +
                `👩‍👦 *Apellido Materno:* ${info.apellidoMaterno || 'No disponible'}\n` +
                `🆔 *Número de DNI:* ${info.numeroDocumento || 'No disponible'}\n` +
                `🔢 *Dígito Verificador:* ${info.digitoVerificador || 'No disponible'}\n`;
            await conn.sendMessage(m.chat, { text: respuestaDNI }, { quoted: m });
        } else {
            throw new Error("No se encontraron datos para el número proporcionado.");
        }
    } catch (error) {
        console.error("Error:", error.message);
        await conn.sendMessage(m.chat, { text: `⚠️ Ocurrió un error al buscar la información: ${error.message}` }, { quoted: m });
    }
};

handler.help = ['dni PERU'];
handler.tags = ['info'];
handler.command = /^(dnipe)$/i;
handler.limit = 130;
handler.register = true  // Correcto

export default handler;
