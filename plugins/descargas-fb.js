import fetch from 'node-fetch';

const handler = async (m, {conn, args, command, usedPrefix}) => {
  // Verificar que se proporcionó una URL
  if (!args[0]) {
    throw `⚠️ Ingrese un enlace de Facebook para descargar el video
• *Ejemplo:* ${usedPrefix + command} https://www.facebook.com/watch?v=636541475139`;
  }
  
  // Verificar que la URL sea de Facebook
  if (!args[0].match(/www.facebook.com|fb.watch/g)) {
    throw `⚠️ Ingrese un enlace válido de Facebook para descargar el video
• *Ejemplo:* ${usedPrefix + command} https://www.facebook.com/watch?v=636541475139`;
  }
  
  // Indicar que se está procesando
  m.react(`⌛`);
  
  try {
    // Usar la API de siputzx para obtener los enlaces de descarga
    const apiUrl = `https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(args[0])}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    // Verificar si la respuesta fue exitosa
    if (!data.status) {
      throw new Error('No se pudo obtener el video de Facebook');
    }
    
    // Obtener la URL del video en la mejor calidad disponible
    const videoOptions = data.data;
    
    if (!videoOptions || videoOptions.length === 0) {
      throw new Error('No se encontraron enlaces de descarga');
    }
    
    // Prefiere la resolución HD si está disponible, sino usa SD
    const hdVideo = videoOptions.find(v => v.resolution.includes('HD'));
    const sdVideo = videoOptions.find(v => v.resolution.includes('SD'));
    const videoUrl = hdVideo ? hdVideo.url : (sdVideo ? sdVideo.url : videoOptions[0].url);
    
    // Enviar el video al chat
    await conn.sendFile(
      m.chat,
      videoUrl,
      'facebook_video.mp4',
      `✅ *Video descargado exitosamente*\n📱 *Resolución:* ${hdVideo ? 'HD' : 'SD'}`,
      m
    );
    
    // Reacción de éxito
    m.react(`✅`);
    
  } catch (error) {
    // Manejar errores
    console.error('Error al descargar el video:', error);
    m.react(`❌`);
    m.reply(`⚠️ *Ocurrió un error al descargar el video*\n\nPor favor, intente con otro enlace o reporte este problema con el comando: #report`);
  }
};

// Configuración del comando
handler.help = ['fb', 'facebook', 'fbdl'];
handler.tags = ['downloader'];
handler.command = /^(facebook|fb|facebookdl|fbdl)$/i;
handler.limit = 2; // Reducido de 3 a 2 por mayor eficiencia
handler.register = true;

export default handler;
