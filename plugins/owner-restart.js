import { shutdownAndExit } from '../lib/lifecycle.js'

const handler = async (m, { conn }) => {
  await conn.sendMessage(m.chat, {
    text: 'Reinicio solicitado. Cerrando conexiones y base de datos de forma segura...'
  }, { quoted: m })
  await shutdownAndExit('owner-restart', 0)
}

handler.help = ['restart']
handler.tags = ['owner']
handler.command = ['restart', 'reiniciar']
handler.owner = true

export default handler
