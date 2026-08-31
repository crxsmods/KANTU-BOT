const handler = async m => {
  const donationUrl = String(process.env.DONATION_URL || '').trim()
  if (!donationUrl) {
    return m.reply('Las contribuciones no están configuradas en esta instancia de Kantu Bot.')
  }
  let url
  try {
    url = new URL(donationUrl)
  } catch {
    return m.reply('La dirección de contribuciones configurada no es válida.')
  }
  if (url.protocol !== 'https:') {
    return m.reply('La dirección de contribuciones debe usar HTTPS.')
  }
  await m.reply('Gracias por apoyar el desarrollo de Kantu Bot: ' + url.toString())
}

handler.help = ['donar']
handler.tags = ['main']
handler.command = /^(donar|apoyar|donating)$/i
handler.register = true

export default handler
