const handler = async (m, { conn }) => {
  const result = await m.db.query(`
    WITH candidate AS MATERIALIZED (
      SELECT id,
             COALESCE(exp, 0) AS exp,
             COALESCE(lastwork, 0) AS lastwork,
             FLOOR(EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::bigint AS now_ms,
             FLOOR(random() * 6500)::integer AS reward
      FROM usuarios
      WHERE id = $1
      FOR UPDATE
    ),
    updated AS (
      UPDATE usuarios AS u
      SET exp = LEAST(2147483647, c.exp::bigint + c.reward)::integer,
          lastwork = c.now_ms
      FROM candidate AS c
      WHERE u.id = c.id
        AND c.lastwork + 600000 <= c.now_ms
      RETURNING c.reward, u.lastwork
    )
    SELECT reward, lastwork, 0::bigint AS remaining_ms
    FROM updated
    UNION ALL
    SELECT NULL::integer, c.lastwork,
           GREATEST(0, c.lastwork + 600000 - c.now_ms)::bigint AS remaining_ms
    FROM candidate AS c
    WHERE NOT EXISTS (SELECT 1 FROM updated)
  `, [m.sender])

  const outcome = result.rows[0]
  if (!outcome) return m.reply('No fue posible localizar tu perfil de economía.')
  if (outcome.reward === null) {
    return conn.reply(
      m.chat,
      `*⏳ Debes descansar ${msToTime(Number(outcome.remaining_ms))} antes de volver a trabajar.*`,
      m
    )
  }

  const reward = Number(outcome.reward)
  await conn.reply(m.chat, `🛠 ${pickRandom(work)} *${formatNumber(reward)} XP*`, m)
}

handler.help = ['work', 'trabajar', 'w']
handler.tags = ['econ']
handler.command = /^(work|trabajar|chambear|w|chamba)$/i
handler.register = true

export default handler

function msToTime(duration) {
  const totalSeconds = Math.max(0, Math.floor(duration / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes} minutos ${seconds} segundos`
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function formatNumber(number) {
  return number.toLocaleString('es-MX')
}

const work = [
  'Ayudas a moderar la comunidad de Kantu Bot y obtienes:',
  'Desarrollas una función útil para el proyecto y obtienes:',
  'Resuelves una incidencia difícil del servidor y obtienes:',
  'Exploras ruinas antiguas y encuentras una reliquia que vale:',
  'Diseñas una ciudad futurista y recibes:',
  'Ganas un torneo de estrategia y recibes:',
  'Creas una obra memorable y obtienes:',
  'Descubres un nuevo planeta y recibes:',
  'Completas una misión de investigación y obtienes:',
  'Construyes una herramienta para la comunidad y ganas:'
]
