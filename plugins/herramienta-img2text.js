const handler = async (m, { conn, text, usedPrefix, command }) => {
  // Verificar si se proporcionó una URL de imagen
  if (!text) return m.reply(`*🖼️ Image2Text IA*\n\n*Por favor, ingresa la URL de una imagen*\n\nEjemplo:\n.img2text https://ejemplo.com/imagen.jpg`)

  try {
    // Enviar mensaje inicial de "Procesando"
    const { key } = await conn.sendMessage(m.chat, {text: `*🖼️ Image2Text IA*\n▰▱▱▱▱▱▱▱▱\n🔍 Iniciando análisis de imagen...`}, {quoted: m});
    
    // Pequeña pausa
    await delay(1000);
    
    // Actualizar progreso
    await conn.sendMessage(m.chat, {text: `*🖼️ Image2Text IA*\n▰▰▰▱▱▱▱▱▱\n🔎 Detectando elementos...`, edit: key});
    
    // Otra pausa
    await delay(1000);
    
    // Más progreso
    await conn.sendMessage(m.chat, {text: `*🖼️ Image2Text IA*\n▰▰▰▰▰▱▱▱▱\n📝 Generando descripción...`, edit: key});

    // Codificar la URL de la imagen para la solicitud
    const encodedUrl = encodeURIComponent(text)

    // Realizar la solicitud a la API
    const response = await fetch(`https://api.siputzx.my.id/api/ai/image2text?url=${encodedUrl}`)
    
    // Verificar si la respuesta es válida
    if (!response.ok) {
      throw new Error('Error en la solicitud a la API')
    }

    // Parsear la respuesta JSON
    const data = await response.json()

    // Verificar si hay un resultado válido
    if (data && data.status && data.data) {
      // Enviar respuesta final editando el mismo mensaje
      await conn.sendMessage(m.chat, {
        text: `*🖼️ Image2Text IA*\n▰▰▰▰▰▰▰▰▰\n> *KantuBot*\n\n📸 *Descripción de la imagen:*\n\n${data.data}`, 
        edit: key
      });
    } else {
      throw new Error('No se recibió respuesta válida')
    }

  } catch (error) {
    console.error('Error en Image2Text:', error)
    m.reply(`❌ *Error en Image2Text IA*\n\nNo se pudo analizar la imagen. Verifica que la URL sea válida y accesible.\n\nError: ${error.message}`)
  }
}

// Función de delay
const delay = (time) => new Promise(resolve => setTimeout(resolve, time))

handler.help = ['img2text']
handler.tags = ['tools']
handler.command = /^(img2text|image2text|imagetotext|i2t)$/i

export default handler