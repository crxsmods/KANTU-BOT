import { generateWAMessageFromContent } from "@whiskeysockets/baileys"
import * as fs from 'fs'

var handler = async (m, { conn, text, participants, isOwner, usedPrefix, command, isAdmin }) => {
    // Verificación de contenido
    if (!m.quoted && !text) return m.reply(`「 ꛕ 」 Por favor, ingresa el contenido o responde a un mensaje para difundir. 📣`) 

    let users = participants.map(u => conn.decodeJid(u.id))
    
    // Configuración del mensaje falso (Fake Reply)
    const fakes = {
        key: { fromMe: false, participant: `0@s.whatsapp.net`, ...(m.chat ? { remoteJid: "status@broadcast" } : {}) },
        message: { conversation: `「 ꛕ 」𝙼𝚎𝚗𝚜𝚊𝚓𝚎 𝙿𝚊𝚛𝚊 𝚃𝚘𝚍𝚘𝚜  🗣️ - 𝙺𝚊𝚗𝚝𝚞 𝙱𝚘𝚝` }
    }

    if (m.quoted && m.quoted.message) {
        const type = Object.keys(m.quoted.message)[0]
        const isMedia = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage'].includes(type)
        
        if (isMedia) {
            try {
                let mediax = await m.quoted.download()
                let msg = { contextInfo: { mentionedJid: users } }
                
                if (type === 'imageMessage') {
                    msg.image = mediax
                    if (text) msg.caption = text
                } else if (type === 'videoMessage') {
                    msg.video = mediax
                    if (text) msg.caption = text
                } else if (type === 'audioMessage') {
                    msg.audio = mediax
                    msg.ptt = true
                    msg.fileName = 'Notificacion.mp3'
                    msg.mimetype = 'audio/mp4'
                } else if (type === 'stickerMessage') {
                    msg.sticker = mediax
                } else if (type === 'documentMessage') {
                    msg.document = mediax
                    msg.fileName = m.quoted.fileName || 'Archivo_Sistema'
                    msg.mimetype = m.quoted.mimetype || 'application/octet-stream'
                }
                
                await conn.sendMessage(m.chat, msg, { quoted: fakes })
                return
            } catch (e) {
                console.error(e)
            }
        }
    }

    // Lógica para texto plano
    let texto = text || (m.quoted?.message?.conversation || m.quoted?.message?.extendedTextMessage?.text || '')
    
    try {
        await conn.sendMessage(m.chat, { 
            text: texto, 
            contextInfo: { mentionedJid: users } 
        }, { quoted: fakes })
    } catch (e) {
        console.error(e)
    }
}

handler.help = ['hidetag']
handler.tags = ['group']
handler.command = /^(hidetag|notificar|notify)$/i
handler.group = true
handler.admin = true
handler.register = true 

export default handler
