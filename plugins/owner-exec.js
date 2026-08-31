// Ejecutar JavaScript recibido por WhatsApp equivale a control remoto total.
// El prefijo se conserva para responder claramente, pero nunca evalua codigo.
const handler = async (m, { isOwner }) => {
  if (!isOwner) return
  await m.reply('La consola JavaScript remota esta deshabilitada permanentemente en esta edicion de produccion.')
}

handler.help = ['> (deshabilitado)', '=> (deshabilitado)', '= (deshabilitado)']
handler.tags = ['owner']
handler.customPrefix = /^=?>\s?/
handler.command = () => true

export default handler
