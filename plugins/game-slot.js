const handler = async (m, { conn, args }) => {
const cooldown = 30_000;
const now = Date.now();

const res = await m.db.query('SELECT exp, money, limite, wait FROM usuarios WHERE id = $1', [m.sender]);
const user = res.rows[0];

const last = Number(user?.wait) || 0;
const remaining = last + cooldown - now;
if (remaining > 0) return conn.reply(m.chat, `🕓 Calma crack, espera *${msToTime(remaining)}* antes de volver a jugar.`, m);

const tipoArg = (args[0] || '').toLowerCase();
const tipo = tipoArg === 'xp' ? 'exp' : tipoArg;
const cantidad = parseInt(args[1]);

if (!['exp', 'money', 'limite'].includes(tipo)) return m.reply(`⚠️ Usa correctamente: /slot <xp|money|limite> <cantidad>\nEjemplo: /slot xp 500`);
if (!cantidad || isNaN(cantidad) || cantidad < 10) return m.reply(`❌ Mínimo 10 para apostar.`);

const saldo = user[tipo];
if (saldo < cantidad) return m.reply(`❌ No tienes suficiente ${tipo.toUpperCase()} para apostar. Tienes *${formatNumber(saldo)}*`);

const emojis = ['💎', '⚡', '🪙', '🧿', '💣', '🔮'];
let final;
const msg = await conn.sendMessage(m.chat, { text: renderRandom(emojis) }, { quoted: m });

for (let i = 0; i < 6; i++) {
await delay(300);
if (i < 5) {
await conn.sendMessage(m.chat, { text: renderRandom(emojis), edit: msg.key });
} else {
final = [
[rand(emojis), rand(emojis), rand(emojis)],
[rand(emojis), rand(emojis), rand(emojis)],
[rand(emojis), rand(emojis), rand(emojis)],
];
await conn.sendMessage(m.chat, { text: render(final), edit: msg.key });
}}
let ganancia = 0;
let textoFinal = '';

const outcome = await m.db.query(`
  WITH candidate AS MATERIALIZED (
    SELECT id, COALESCE(exp, 0) AS exp, COALESCE(money, 0) AS money,
           COALESCE(limite, 0) AS limite, COALESCE(wait, 0) AS wait,
           FLOOR(EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::bigint AS now_ms,
           random() AS roll
    FROM usuarios
    WHERE id = $1
    FOR UPDATE
  ),
  rolled AS (
    SELECT *,
      CASE WHEN roll < (1.0 / 36.0) THEN 3
           WHEN roll < (1.0 / 36.0) + (5.0 / 12.0) THEN 1
           ELSE -1 END AS multiplier
    FROM candidate
  ),
  updated AS (
    UPDATE usuarios AS u
    SET exp = CASE WHEN $2 = 'exp'
          THEN LEAST(2147483647, GREATEST(0, COALESCE(u.exp, 0)::bigint + $3::bigint * r.multiplier))::integer
          ELSE u.exp END,
        money = CASE WHEN $2 = 'money'
          THEN LEAST(2147483647, GREATEST(0, COALESCE(u.money, 0)::bigint + $3::bigint * r.multiplier))::integer
          ELSE u.money END,
        limite = CASE WHEN $2 = 'limite'
          THEN LEAST(2147483647, GREATEST(0, COALESCE(u.limite, 0)::bigint + $3::bigint * r.multiplier))::integer
          ELSE u.limite END,
        wait = r.now_ms
    FROM rolled AS r
    WHERE u.id = r.id
      AND $2 IN ('exp', 'money', 'limite')
      AND $3 BETWEEN 10 AND 1000000
      AND r.wait + 30000 <= r.now_ms
      AND CASE $2 WHEN 'exp' THEN r.exp WHEN 'money' THEN r.money ELSE r.limite END >= $3
    RETURNING u.exp, u.money, u.limite, u.wait, r.multiplier
  )
  SELECT * FROM updated
`, [m.sender, tipo, cantidad]);
if (!outcome.rowCount) return m.reply('❌ La apuesta no pudo aplicarse; revisa tu saldo o el tiempo de espera.')
const multiplier = Number(outcome.rows[0].multiplier)
ganancia = cantidad * multiplier
final[1] = renderOutcome(emojis, multiplier)
textoFinal = multiplier === 3
  ? `🎉 ¡Triple! Ganaste *${formatNumber(ganancia)} ${tipoBonito(tipo)}*`
  : multiplier === 1
    ? `😏 Dos iguales. Recuperaste *${formatNumber(ganancia)} ${tipoBonito(tipo)}*`
    : `💀 Mala suerte. Perdiste *${formatNumber(cantidad)} ${tipoBonito(tipo)}*`
await delay(600);
await conn.sendMessage(m.chat, { text: render(final) + `\n\n${textoFinal}`, edit: msg.key });
};
handler.command = ['slot'];
handler.help = ['slot <xp|money|limite> <cantidad>'];
handler.tags = ['game'];
handler.register = true;

export default handler;

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function render(matriz) {
  return `🎰 | *SLOTS* | 🎰\n────────────\n${matriz.map(row => row.join(' | ')).join('\n')}\n────────────`;
}

function renderRandom(emojis) {
  const temp = [
    [rand(emojis), rand(emojis), rand(emojis)],
    [rand(emojis), rand(emojis), rand(emojis)],
    [rand(emojis), rand(emojis), rand(emojis)],
  ];
  return render(temp);
}

function renderOutcome(emojis, multiplier) {
  if (multiplier === 3) {
    const value = rand(emojis)
    return [value, value, value]
  }
  if (multiplier === 1) {
    const value = rand(emojis)
    let other = rand(emojis)
    while (other === value) other = rand(emojis)
    return Math.random() < 0.5 ? [value, value, other] : [other, value, value]
  }
  const available = [...emojis]
  return [0, 1, 2].map(() => available.splice(Math.floor(Math.random() * available.length), 1)[0])
}

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function formatNumber(num) {
  return num.toLocaleString('en').replace(/,/g, '.');
}

function msToTime(duration) {
  const s = Math.floor(duration / 1000) % 60;
  const m = Math.floor(duration / (1000 * 60)) % 60;
  return `${m ? `${m}m ` : ''}${s}s`;
}

function tipoBonito(tipo) {
  if (tipo === 'money') return 'KantuCoins';
  if (tipo === 'limite') return 'Diamantes';
  return 'XP';
}
