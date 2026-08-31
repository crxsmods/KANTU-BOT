const handler = async m => {
  await m.reply([
    'Las actualizaciones desde el chat estan deshabilitadas en produccion.',
    'Publica una imagen/version nueva mediante CI y conserva una ruta de rollback.'
  ].join('\n'))
}

handler.help = ['update']
handler.tags = ['owner']
handler.command = /^(update|actualizar|gitpull)$/i
handler.owner = true

export default handler
