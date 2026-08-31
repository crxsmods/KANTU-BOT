const COOLDOWN_MS = 122_400_000 // 34 horas
const CHEST_IMAGE = 'https://img.freepik.com/vector-gratis/cofre-monedas-oro-piedras-preciosas-cristales-trofeo_107791-7769.jpg?w=2000'

const REWARDS = {
  diamantes: { max: 30, emoji: '💎' },
  coins:     { max: 4000, emoji: '🪙' },
  exp:       { max: 5000, emoji: '⚡' },
}

const rand = (max) => Math.floor(Math.random() * max)

const msToTime = (ms) => {
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  return `${h} Horas ${m} Minutos`
}

const QUOTED_HEADER = {
  key: {
    fromMe: false,
    participant: '0@s.whatsapp.net',
    remoteJid: 'status@broadcast',
  },
  message: { conversation: '🎉 Obtiene un regalo 🎁' },
}

const handler = async (m, { conn }) => {
  const now = Date.now()

  const { rows: [user] } = await m.db.query(
    'SELECT exp, money, limite, lastcofre FROM usuarios WHERE id = $1',
    [m.sender],
  )

  const lastCofre = Number(user?.lastcofre) || 0
  const restante = Math.max(0, lastCofre + COOLDOWN_MS - now)

  if (restante > 0) {
    return m.reply(
      `🕛 𝐘𝐚 𝐫𝐞𝐜𝐥𝐚𝐦𝐚𝐬𝐭𝐞 𝐭𝐮 𝐜𝐨𝐟𝐫𝐞 🎁\n` +
      `𝐕𝐮𝐞𝐥𝐯𝐞 𝐞𝐧 *${msToTime(restante)}* 𝐩𝐚𝐫𝐚 𝐫𝐞𝐜𝐥𝐚𝐦𝐚𝐫 𝐧𝐮𝐞𝐯𝐚𝐦𝐞𝐧𝐭𝐞`,
    )
  }

  const diamantes = rand(REWARDS.diamantes.max)
  const coins = rand(REWARDS.coins.max)
  const xp = rand(REWARDS.exp.max)

  await m.db.query(
    `UPDATE usuarios 
     SET exp = exp + $1, money = money + $2, limite = limite + $3, lastcofre = $4 
     WHERE id = $5`,
    [xp, coins, diamantes, now, m.sender],
  )

  const caption = [
    '[ 🛒 𝐎𝐁𝐓𝐈𝐄𝐍𝐄𝐒 𝐔𝐍 𝐂𝐎𝐅𝐑𝐄 🎉 ]',
    '',
    `* ${diamantes} 𝐃𝐢𝐚𝐦𝐚𝐧𝐭𝐞𝐬 ${REWARDS.diamantes.emoji}`,
    `* ${coins} 𝐂𝐨𝐢𝐧𝐬 ${REWARDS.coins.emoji}`,
    `* ${xp} 𝐄𝐱𝐩 ${REWARDS.exp.emoji}`,
  ].join('\n')

  await conn.sendMessage(
    m.chat,
    { image: { url: CHEST_IMAGE }, caption },
    { quoted: QUOTED_HEADER },
  )
}

handler.help = ['cofre', 'coffer', 'abrircofre']
handler.tags = ['econ']
handler.command = ['coffer', 'cofre', 'abrircofre', 'cofreabrir']
handler.level = 9
handler.register = true

export default handler
