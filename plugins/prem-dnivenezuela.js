import axios from 'axios';
import cheerio from 'cheerio';

const handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!args[0]) throw `⚠️ *Por favor, ingresa un número de cédula válido*\nEjemplo: ${usedPrefix + command} 15088538`;

    const cedula = args[0].replace(/[^0-9]/g, ''); // Limpiar el input para que solo contenga números

    try {
        const url = 'http://www.ivss.gob.ve:28083/CuentaIndividualIntranet/';

        // Realizar la solicitud inicial para cargar la página
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        // Aquí debes encontrar el formulario y enviar la cédula
        // Esto depende de cómo esté estructurada la página

        // Simular el envío de datos del formulario
        const postResponse = await axios.post(url, new URLSearchParams({
            nacionalidad: 'Venezolano', // Ajusta según lo que necesites
            cedula: cedula
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        // Cargar la página de resultados
        const resultPage = cheerio.load(postResponse.data);

        // Extraer la información deseada (ajusta los selectores según la estructura HTML)
        const nombre = resultPage('selector-del-nombre').text(); // Cambia 'selector-del-nombre' a lo que necesites
        const estado = resultPage('selector-del-estado').text(); // Cambia 'selector-del-estado' a lo que necesites

        // Formatear la respuesta
        const respuesta = `👤 *Información de la Cuenta*\n\n` +
                          `🌟 *Nombre:* ${nombre || 'No disponible'}\n` +
                          `🔍 *Estado:* ${estado || 'No disponible'}\n`;

        await conn.sendMessage(m.chat, { text: respuesta }, { quoted: m });

    } catch (error) {
        console.error("Error:", error.message);
        await conn.sendMessage(m.chat, { text: `⚠️ Ocurrió un error al buscar la información: ${error.message}` }, { quoted: m });
    }
};

handler.help = ['ivss'];
handler.tags = ['info'];
handler.command = /^(ivss)$/i;
handler.limit = 3;

export default handler;
