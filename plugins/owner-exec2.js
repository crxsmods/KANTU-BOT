// La ejecucion de shell por mensajes equivale a acceso remoto total al host.
// Se conserva el prefijo para responder de forma explicita, pero no ejecuta.
const handler = async (m, { isROwner }) => {
  if (!isROwner) return
  await m.reply('La consola remota esta deshabilitada permanentemente en esta edicion de produccion.')
}

handler.help = ['$ (deshabilitado)']
handler.tags = ['owner']
handler.customPrefix = /^[$]\s?/
handler.command = () => true

export default handler
