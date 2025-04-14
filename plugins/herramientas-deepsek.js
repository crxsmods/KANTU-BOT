const handler = async (m, { conn, text, usedPrefix, command }) => {
  // Verificar si se proporcionó texto
  if (!text) return m.reply(`*🤖 DeepSeek IA*\n\n*Por favor, ingresa un mensaje*\n\nEjemplo:\n.deepseek Explícame la teoría de la relatividad`)

  try {
    // Enviar mensaje inicial de "Pensando"
    const { key } = await conn.sendMessage(m.chat, {text: `*🤖 DeepSeek IA*\n▰▱▱▱▱▱▱▱▱\n🔍 Iniciando análisis...`}, {quoted: m});
    
    // Pequeña pausa
    await delay(1000);
    
    // Actualizar progreso
    await conn.sendMessage(m.chat, {text: `*▰▰▰▱▱▱▱▱▱..*\n\n☁️☁️.`, edit: key});
    
    // Otra pausa
    await delay(1000);
    
    // Más progreso
    await conn.sendMessage(m.chat, {text: `*▰▰▰▰▰▱▱▱▱*\n\n*Pensando...💭*`, edit: key});

    // Codificar el texto para la URL
    const encodedText = encodeURIComponent(text)

    // Realizar la solicitud a la API
    const response = await fetch(`https://api.siputzx.my.id/api/ai/deepseek-llm-67b-chat?content=${encodedText}`)
    
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
        text: `*🤖 DeepSeek IA*\n▰▰▰▰▰▰▰▰▰\n> *KantuBot*\n\n${data.data}`, 
        edit: key
      });
    } else {
      throw new Error('No se recibió respuesta válida')
    }

  } catch (error) {
    console.error('Error en DeepSeek:', error)
    m.reply(`❌ *Error en DeepSeek IA*\n\n${error.message}`)
  }
}

// Función de delay
const delay = (time) => new Promise(resolve => setTimeout(resolve, time))

handler.help = ['deepseek']
handler.tags = ['tools']
handler.command = /^(deepseek)$/i

export default handler
