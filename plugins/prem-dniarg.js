import axios from 'axios';

const proxies = [
    {
        host: 'p.webshare.io',
        port: 80,
        auth: {
            username: 'wgnpcicf-rotate',
            password: 'yz5jafyih9xe'
        }
    },
    // Puedes agregar más proxies aquí
    {
        host: 'p.webshare.io',
        port: 80,
        auth: {
            username: 'otro-usuario',
            password: 'otra-contraseña'
        }
    }
];

const handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!args[0]) throw `⚠️ *Por favor, ingresa un DNI válido de Argentina*\nEjemplo: ${usedPrefix + command} 40407273`;

    // Limpiar el DNI ingresado (eliminar puntos y otros caracteres no numéricos)
    const dni = args[0].replace(/[.\s]/g, '');
    const apiUrl = `https://clientes.credicuotas.com.ar/v1/onboarding/resolvecustomers/${dni}`;

    try {
        // Realizar la solicitud a la API
        const response = await axios.get(apiUrl);

        // Verificar que la respuesta tenga datos
        if (response.data && response.data.length > 0) {
            // Procesar cada cliente en la respuesta
            let clientesInfo = `🧑‍🤝‍🧑 *DOXX ARGENTINA: ${dni}*:\n\n`;
            response.data.forEach(cliente => {
                clientesInfo += `🌟 *Nombre Completo:* ${cliente.nombrecompleto}\n`;
                clientesInfo += `📄 *CUIT:* ${cliente.cuit}\n`;
                clientesInfo += `🆔 *DNI:* ${cliente.dni}\n`;
                clientesInfo += `🎂 *Fecha de Nacimiento:* ${cliente.fechanacimiento}\n`;
                clientesInfo += `♂️ *Sexo:* ${cliente.sexo === 'F' ? 'Femenino' : 'Masculino'}\n`;
                clientesInfo += `> Kantu - Bot - Crxs\n`;
            });

            // Enviar la información al chat
            await conn.sendMessage(m.chat, { text: clientesInfo }, { quoted: m });
        } else {
            throw new Error("No se encontraron clientes con ese DNI.");
        }
    } catch (error) {
        console.error("Error en la API:", error.message);

        // Si hay un error, intentamos con un proxy
        for (const proxy of proxies) {
            try {
                const response = await axios.get(apiUrl, { proxy });
                
                // Verificar que la respuesta tenga datos
                if (response.data && response.data.length > 0) {
                    // Procesar cada cliente en la respuesta
                    let clientesInfo = `🧑‍🤝‍🧑 *DOXX ARGENTINA: ${dni}*:\n\n`;
                    response.data.forEach(cliente => {
                        clientesInfo += `🌟 *Nombre Completo:* ${cliente.nombrecompleto}\n`;
                        clientesInfo += `📄 *CUIT:* ${cliente.cuit}\n`;
                        clientesInfo += `🆔 *DNI:* ${cliente.dni}\n`;
                        clientesInfo += `🎂 *Fecha de Nacimiento:* ${cliente.fechanacimiento}\n`;
                        clientesInfo += `♂️ *Sexo:* ${cliente.sexo === 'F' ? 'Femenino' : 'Masculino'}\n`;
                        clientesInfo += `> Kantu - Bot - Crxs\n`;
                    });

                    // Enviar la información al chat
                    await conn.sendMessage(m.chat, { text: clientesInfo }, { quoted: m });
                    return; // Salir del bucle si la solicitud fue exitosa
                } else {
                    throw new Error("No se encontraron clientes con ese DNI a través del proxy.");
                }
            } catch (proxyError) {
                console.error("Error con el proxy:", proxyError.message);
                // Continúa al siguiente proxy
            }
        }

        // Si todos los proxies fallan
        await conn.sendMessage(m.chat, { text: `⚠️ Ocurrió un error al buscar la información del cliente a través de todos los proxies.` }, { quoted: m });
    }
};

handler.help = ['dniarg DOXX'];
handler.tags = ['info'];
handler.command = /^(dniarg|argdni|argentina)$/i;
handler.limit = 130;
handler.register = true  // Correcto
export default handler;
