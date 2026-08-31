const CANAL = { isForwarded: true, forwardingScore: 1, forwardedNewsletterMessageInfo: { newsletterJid: '120363417790731866@newsletter', newsletterName: 'KantuBot Test ✨' } };

const handler = async (m, { text, usedPrefix, command }) => {
  if (!text) return m.reply(`✳️ Usa:\n${usedPrefix + command} texto`);

  try {
    const base64 = Buffer.from(text, 'utf-8').toString('base64');
    return m.reply(`${base64}`, CANAL);
  } catch (e) {
    return m.reply(`❌ Error al convertir: ${e.message}`);
  }
};

handler.help = ['tobase64']
handler.tags = ['tools']
handler.command = ['tobase64']
handler.register = true
handler.limit = 1

export default handler
