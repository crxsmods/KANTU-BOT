import { createHash, randomBytes } from 'crypto';
import { db } from '../lib/postgres.js';
import { paisDesdeNumero } from '../lib/pais.js';

const Reg = /\|?(.*)([.|] *?)([0-9]*)$/i;

const canalNotificaciones = () => {
  const jid = (process.env.MENU_NEWSLETTER_JID || '120363371008200788@newsletter').trim();
  return /^\d{10,30}@newsletter$/.test(jid) ? jid : '120363371008200788@newsletter';
};

const estados = {} 

let handler = async (m, { conn, text, args, usedPrefix, command }) => {
  const userResult = await db.query(`SELECT * FROM usuarios WHERE id = $1`, [m.sender]);
  let user = userResult.rows[0] || { registered: false };
  let name2 = m.pushName || 'Usuario'

  // --- LÓGICA DE REGISTRO ---
  if (command === 'reg' || command === 'verify' || command === 'verificar') {
    if (user.registered) return m.reply(`Ya estás Registrado Usuario 👆*`)
    if (estados[m.sender]?.step) return m.reply('「 ꛕ 」 ⚠️ Ya tienes un registro en curso. Completa el registro respondiendo el paso anterior.')
    if (!Reg.test(text)) return m.reply(`「 ꛕ 」 *⚠️ ¿No sabes cómo usar este comando?* Usa de la siguiente manera:\n\n*${usedPrefix + command} nombre.edad*\n*• Ejemplo:* ${usedPrefix + command} ${name2}.16`)

    let [_, name, splitter, age] = text.match(Reg)
    if (!name) return m.reply('「 ꛕ 」 *¿Y el nombre?*')
    if (!age) return m.reply('「 ꛕ 」 *La edad no puede estar vacía, agrega tu edad*')
    if (name.length >= 45) return m.reply('「 ꛕ 」 *¿Qué?, ¿tan largo va a ser tu nombre?*')
    age = parseInt(age)
    if (age > 100) return m.reply('「 ꛕ 」 👴🏻 ¡Estás muy viejo para esto!')
    if (age < 5) return m.reply('「 ꛕ 」 🚼 ¿Los bebés saben escribir? ✍️😳')

    estados[m.sender] = { step: 1, nombre: name, edad: age, usedPrefix }
    return m.reply(`「 ꛕ 」 🧑 Registro Paso 2: ¿Cuál es tu género?\n\n1. Hombre ♂️\n2. Mujer ♀️\n3. Otro 🧬\n\n*Responde con el número*`)
  }

  // --- COMANDOS COMPLEMENTARIOS ---
  if (command == 'nserie' || command == 'myns' || command == 'sn') {
    if (!user.registered) return m.reply(`「 ꛕ 」 ⚠️ *No estás registrado(a)*\n\nPara registrarte usa:\n*#reg nombre.edad*`);
    const sn = user.serial_number || createHash('md5').update(m.sender).digest('hex');
    await conn.fakeReply(m.chat, sn, '0@s.whatsapp.net', `「 ꛕ 」 ⬇️ ᴇsᴛᴇ ᴇs sᴜs ɴᴜᴍᴇʀᴏ ᴅᴇʟ sᴇʀɪᴇ ⬇️`, 'status@broadcast')
  }

  if (command == 'unreg') {
    if (!user.registered) return m.reply(`「 ꛕ 」 ⚠️ *No estás registrado(a)*\n\nPara registrarte usa:\n*#reg nombre.edad*`);
    if (!args[0]) return m.reply(`「 ꛕ 」 ✳️ *Ingrese número de serie*\n\n*${usedPrefix}nserie*`)
    const sn = user.serial_number || createHash('md5').update(m.sender).digest('hex');
    if (args[0] !== sn) return m.reply('「 ꛕ 」 ⚠️ *Número de serie incorrecto*')
    const removed = await db.query(`
      UPDATE usuarios
      SET registered = false,
          nombre = NULL,
          edad = NULL,
          gender = NULL,
          birthday = NULL,
          email = NULL,
          money = GREATEST(COALESCE(money, 0) - 400, 0),
          limite = GREATEST(COALESCE(limite, 0) - 2, 0),
          exp = GREATEST(COALESCE(exp, 0) - 150, 0),
          reg_time = NULL,
          serial_number = NULL
      WHERE id = $1
        AND registered = true
        AND COALESCE(serial_number, md5(id)) = $2
      RETURNING id
    `, [m.sender, args[0]]);
    if (!removed.rowCount) return m.reply('「 ꛕ 」 ⚠️ No se pudo validar o eliminar el registro.')
    await conn.fakeReply(m.chat, `「 ꛕ 」 😢 Ya no estas registrado`, '0@s.whatsapp.net', `ᴿᵉᵍᶦˢᵗʳᵒ ᵉᶦᵐᶦⁿᵃᵈᵒ`, 'status@broadcast')
  }
}  

handler.before = async (m, { conn, usedPrefix }) => {
  const who = m.sender
  const step = estados[who]?.step
  const input = (m.originalText || m.text || '').trim()
  if (!step) return

  if (!m.text.startsWith(usedPrefix)) {
    // PASO 1: SELECCIÓN DE GÉNERO
    if (step === 1) {
      let lower = input.toLowerCase()
      let genero = lower === '1' || lower === 'hombre' ? 'hombre' : lower === '2' || lower === 'mujer' ? 'mujer' : lower === '3' || lower === 'otro' ? 'otro' : null
      if (!genero) return m.reply('「 ꛕ 」 ⚠️ Responde con 1, 2 o 3 para seleccionar tu género')
      const { nombre, edad } = estados[who]
      const serial = randomBytes(18).toString('base64url')
      const reg_time = new Date()

      const registered = await db.query(`
        INSERT INTO usuarios (id, nombre, edad, gender, money, limite, exp, reg_time, registered, serial_number)
        VALUES ($1,$2,$3,$4,400,2,150,$5,true,$6)
        ON CONFLICT (id) DO UPDATE
        SET nombre = $2,
            edad = $3,
            gender = $4,
            money = COALESCE(usuarios.money, 0) + 400,
            limite = COALESCE(usuarios.limite, 0) + 2,
            exp = COALESCE(usuarios.exp, 0) + 150,
            reg_time = $5,
            registered = true,
            serial_number = $6,
            email = NULL
        WHERE usuarios.registered IS NOT TRUE
        RETURNING id
      `, [who, nombre + '✓', edad, genero, reg_time, serial])
      if (!registered.rowCount) {
        delete estados[who]
        return m.reply('Tu usuario ya fue registrado por otra solicitud.')
      }

      delete estados[who]

      const pais = paisDesdeNumero(who)
      const botNum = (conn.user?.id || '').replace(/:\d+/, '').split('@')[0]
      const sn = createHash('md5').update(who).digest('hex')
      const fecha = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
      const aviso = `◉ Usuarios: ${m.pushName || nombre} 💔👑
◉ País: ${pais.nombre} ${pais.bandera}
◉ Verificación: ${nombre}
◉ Edad: ${edad} años
◉ Fecha: ${fecha}
◉ Bot: wa.me/${botNum}?text=/code
◉ Número de serie:
⤷ ${sn}`

      await conn.sendMessage(canalNotificaciones(), { text: aviso }).catch(() => {})
      return m.reply(aviso)
    }
  }
}

handler.help = ['reg'];
handler.tags = ['rg'];
handler.command = /^(nserie|unreg|verify|verificar|reg(ister)?)$/i;

export default handler;

function toNum(number) {
  if (number >= 1000) return (number / 1000).toFixed(1) + 'k';
  return number.toString();
}
