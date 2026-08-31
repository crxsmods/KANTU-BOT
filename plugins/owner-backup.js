// Las credenciales de WhatsApp equivalen a una sesion iniciada y nunca deben
// enviarse como documento por el propio chat. El respaldo se hace copiando las
// carpetas desde el servidor, no desde el chat.
const handler = async m => {
  await m.reply([
    '*Respaldo de sesion*',
    '',
    'Kantu no envia creds.json por WhatsApp: equivale a entregar tu sesion.',
    'Copia estas carpetas desde tu servidor con el bot apagado:',
    '',
    '- BotSession/  (sesion principal)',
    '- jadibot/     (subbots)',
    '- database/    (economia, perfiles y ajustes)'
  ].join('\n'))
}

handler.help = ['backup']
handler.tags = ['owner']
handler.command = /^(backup|respaldo|copia)$/i
handler.owner = true

export default handler
