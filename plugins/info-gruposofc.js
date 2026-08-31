const handler = async m => {
  const group = global.info?.nn2 || 'No configurado'
  const channel = global.info?.nna || 'No configurado'
  const repository = global.info?.md || 'No configurado'
  const text = [
    '「 ꛕ 」 *Comunidad oficial de Kantu Bot* 🌐',
    '',
    '• Grupo y soporte: ' + group,
    '• Canal de novedades: ' + channel,
    '• Código y documentación: ' + repository,
    '',
    '_Verifica siempre que los enlaces coincidan con la configuración oficial de esta instancia._'
  ].join('\n')
  await m.reply(text)
}

handler.help = ['grupos']
handler.tags = ['main']
handler.command = /^(linkgc|grupos|gruposkantu|kantugrupos|gruposdekantu|groupofc|gruposkb|grupokb|groupkb)$/i
handler.register = true

export default handler
