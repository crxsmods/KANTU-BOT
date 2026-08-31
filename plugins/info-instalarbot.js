const CANAL = { isForwarded: true, forwardingScore: 1, forwardedNewsletterMessageInfo: { newsletterJid: '120363178718483875@newsletter', newsletterName: 'The Kantu Bot 🔥' } }

const handler = async m => {
  const repository = global.info?.md || 'https://github.com/crxsmods/KANTU-BOT'
  const text = [
    '「 ꛕ 」 *Instalación de Kantu Bot* ⚙️',
    '',
    'Repositorio: ' + repository,
    '',
    'Requisitos: Node.js 24 LTS, npm 11 y FFmpeg.',
    '1. Copia .env.example a .env y pon tu numero en BOT_OWNERS.',
    '2. Ejecuta npm ci.',
    '3. Inicia con npm start.',
    '',
    'No necesitas base de datos: se crea sola en la carpeta database/.',
    'Nunca compartas .env, tokens ni creds.json.',
    '',
    '> https://kxntu.com'
  ].join('\n')
  await m.reply(text, CANAL)
}

handler.help = ['instalarbot']
handler.tags = ['main']
handler.command = /^(instalarbot)$/i
handler.register = true

export default handler
