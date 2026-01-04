import { generateWAMessageFromContent } from '@whiskeysockets/baileys'

let handler = async (m, { conn }) => {
// Variables de entorno seguras para evitar errores de referencia
let canalUpdate = global.info?.nna2 || 'https://whatsapp.com/channel/0029Vb6I6zTEQIanas9U0N2I'
let contactoWp= global.info?.wp || 'https://wa.me/5217121649714'
let repositorio = global.info?.md || 'https://github.com/crxsmods/KANTU-BOT'
let nombreBot = global.info?.wm || 'ᴋᴀɴᴛᴜ - ʙᴏᴛ'

let texto = `「 ꛕ 」 GUÍA TÉCNICA DE DESPLIEGUE Y CONFIGURACIÓN ⚙️

🔹 *Recursos de Instalación*
◦ Videotutorial de asistencia: https://youtu.be/
◦ Canal oficial de actualizaciones: ${canalUpdate}

🔹 *Soporte Técnico*
◦ Para consultas específicas sobre el despliegue, contactar vía WhatsApp: ${contactoWp} 📩
◦ _Nota: Canal exclusivo para incidencias de instalación._

🔹 *Repositorio de Código*
◦ Acceda al código fuente y documentación extendida en GitHub. Si el proyecto le es de utilidad, agradecemos su apoyo con una estrella:
◦ ${repositorio} ⭐

🔹 *Requisitos del Sistema (Hosting)*

◦ Almacenamiento: 1 GB disponible.
◦ Entorno: WhatsApp secundario activo.
◦ Vinculación: Soporta código de 8 dígitos para vinculación directa. ✅

🚨 *En Hosting De Swallox Todo El Procedimiento Es Automático* 🚨

🔹 *Instalación en SwalloX Host*

◦ Dashboard principal: https://dash.swallox.com
◦ Panel de control: https://panel.dash.swallox.com

◦ Comunidad de soporte (HSX): https://chat.whatsapp.com/JmEDWrlCambFqelUQgji6b 🌐

🚨 *En Hosting De Swallox Todo El Procedimiento Es Automático* 🚨


🔹 *Despliegue vía Terminal (Termux)*
1. Actualización de paquetes:
   \`\`\`apt update && apt upgrade -y && pkg install -y git nodejs ffmpeg imagemagick yarn\`\`\`

2. Clonación del repositorio:
   \`\`\`git clone ${repositorio} && cd ${repositorio.split('/').pop()}\`\`\`

3. Ejecución del asistente:
   \`\`\`bash install.sh\`\`\`

4. Inicio de servicios:
   \`\`\`npm start\`\`\` 🚀

━━━━━━━━━━━━━━━━━━━━
_Sistema de despliegue automatizado. Asegúrese de cumplir con todos los requisitos previos._`.trim()

let aa = { quoted: m, userJid: conn.user.id }
let prep = generateWAMessageFromContent(m.chat, { 
    extendedTextMessage: { 
        text: texto, 
        contextInfo: { 
            externalAdReply: { 
                title: nombreBot, 
                body: "Manual de Usuario", 
                thumbnailUrl: await conn.profilePictureUrl(conn.user.jid, 'image').catch(_ => 'https://telegra.ph/file/33bed21a0eaa789852c30.jpg'), 
                mediaUrl: 'https://youtu.be/', 
                mediaType: 2 
            }, 
            mentionedJid: [m.sender] 
        }
    }
}, aa)

conn.relayMessage(m.chat, prep.message, { messageId: prep.key.id, mentions: [m.sender] })  
}

handler.help = ['instalarbot']
handler.tags = ['main']
handler.command = /^(instalarbot)/i
handler.register = true

export default handler
