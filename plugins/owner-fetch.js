// Un proxy HTTP controlado desde WhatsApp aumenta la superficie de SSRF,
// exfiltracion y agotamiento de memoria. No forma parte del runtime publico.
const handler = async m => {
  await m.reply('La descarga remota arbitraria esta deshabilitada permanentemente en esta edicion de produccion.')
}

handler.help = ['fetch (deshabilitado)']
handler.tags = ['owner']
handler.command = /^(fetch|get)$/i
handler.owner = true

export default handler
