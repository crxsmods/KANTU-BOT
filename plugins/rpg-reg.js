import { createHash } from 'crypto';
import moment from 'moment-timezone'
import { db } from '../lib/postgres.js';
import fs from 'fs';
import path from 'path';

const Reg = /\|?(.*)([.|] *?)([0-9]*)$/i;
const JSON_PATH = path.join(process.cwd(), 'lib/KantuBot.json');

const formatPhoneNumber = (jid) => {
  if (!jid) return null;
  const number = jid.replace('@s.whatsapp.net', '');
  if (!/^\d{8,15}$/.test(number)) return null;
  return `+${number}`;
};

const estados = {} 

let handler = async (m, { conn, text, args, usedPrefix, command, isOwner }) => {
  let fkontak = {key: { participants: "0@s.whatsapp.net", remoteJid: "status@broadcast", fromMe: false, id: "Halo" }, message: {contactMessage: {vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`}}, participant: "0@s.whatsapp.net"};
  
  // --- COMANDO EXCLUSIVO OWNER: CONSULTAR CORREO DASH ---
  if (command === 'correoswall') {
    if (!isOwner) return m.reply('「 ꛕ 」 *ACCESO RESTRINGIDO*\n\n> _Esta función es de uso exclusivo para el propietario del bot._ ⚠️');
    let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : (args[0] ? args[0].replace(/[@+-]/g, '') + '@s.whatsapp.net' : null);
    if (!who) return m.reply('「 ꛕ 」 *USUARIO REQUERIDO*\n\n> _Etiquete a un usuario o ingrese su número para consultar el correo._');
    
    if (!fs.existsSync(JSON_PATH)) return m.reply('「 ꛕ 」 *REGISTRO VACÍO*\n\n> _No se ha encontrado el archivo de base de datos local._');
    let db_local = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
    let user_email = db_local[who];
    
    if (!user_email) return m.reply(`「 ꛕ 」 *SIN DATOS*\n\n> _El usuario @${who.split('@')[0]} no tiene un correo vinculado en la dash._`, null, { mentions: [who] });
    return m.reply(`「 ꛕ 」 *DATOS ENCONTRADOS*\n\n👤 *Usuario:* @${who.split('@')[0]}\n✉️ *Correo:* ${user_email}`, null, { mentions: [who] });
  }

  const userResult = await db.query(`SELECT * FROM usuarios WHERE id = $1`, [m.sender]);
  let user = userResult.rows[0] || { registered: false };
  const date = moment.tz('America/Bogota').format('DD/MM/YYYY')
  const time = moment.tz('America/Argentina/Buenos_Aires').format('LT')
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

    let userNationality = null;
    try {
      const phone = formatPhoneNumber(m.sender);
      if (phone) {
        const response = await fetch(`${info.apis}/tools/country?text=${phone}`);
        const data = await response.json();
        userNationality = data.result ? `${data.result.name} ${data.result.emoji}` : null;
      }
    } catch (err) { userNationality = null; }

    estados[m.sender] = { step: 1, nombre: name, edad: age, usedPrefix, userNationality }
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
    await db.query(`UPDATE usuarios SET registered = false, nombre = NULL, edad = NULL, money = money - 400, limite = limite - 2, exp = exp - 150, reg_time = NULL, serial_number = NULL WHERE id = $1`, [m.sender]);
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
      estados[who].genero = genero
      estados[who].step = 2
      return m.reply(`「 ꛕ 」 📧 *Registro Paso 3: Correo de dash.swallox.com (Opcional)*\n\nSi tienes cuenta en la dash, escribe tu correo para acumular créditos en dinámicas futuras.\n\n🚨 Ten en Cuenta Que No Se Puede Editar Después 🚨\n\n> O escribe "omitir" si no quieres agregarlo`)
    }

    // PASO 2: CORREO Y FINALIZACIÓN
    if (step === 2) {
      let email = input.toLowerCase() === 'omitir' ? null : input;
      const { nombre, edad, genero, userNationality } = estados[who]
      const serial = createHash('md5').update(who).digest('hex')
      const reg_time = new Date()
      const date = moment.tz('America/Bogota').format('DD/MM/YYYY')

      // 1. Guardar en Base de Datos Principal
      await db.query(`
        INSERT INTO usuarios (id, nombre, edad, gender, money, limite, exp, reg_time, registered, serial_number)
        VALUES ($1,$2,$3,$4,400,2,150,$5,true,$6)
        ON CONFLICT (id) DO UPDATE
        SET nombre = $2, edad = $3, gender = $4, money = usuarios.money + 400, limite = usuarios.limite + 2, exp = usuarios.exp + 150, reg_time = $5, registered = true, serial_number = $6
      `, [who, nombre + '✓', edad, genero, reg_time, serial])

      // 2. Guardar correo en archivo JSON (Exclusivo)
      if (email) {
        let data = fs.existsSync(JSON_PATH) ? JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8')) : {};
        data[who] = email;
        fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2));
      }

      // 3. Notificación al Grupo de Moderación
      const modMsg = `👤 *Nombre:* ${nombre}\n🎂 *Edad:* ${edad}\n🧬 *Género:* ${genero}\n🔢 *S/N:* ${serial}${email ? `\n✉️ *Correo:* ${email}` : ''}`;
      await db.query(`INSERT INTO reportes (sender_id, sender_name, mensaje, tipo) VALUES ($1, $2, $3, $4)`, [who, nombre, modMsg, 'registro']);

      // 4. Notificación al Canal (Newsletter)
      await conn.sendMessage("120363371008200788@newsletter", { 
        text: `◉ *Usuarios:* ${m.pushName || 'Anónimo'} ${userNationality ? `\n◉ *País:* ${userNationality}` : ''}\n◉ *Verificación:* ${nombre}\n◉ *Edad:* ${edad} años\n◉ *Fecha:* ${date}\n◉ *Bot:* wa.me/5215646254697?text=/code\n◉ *Número de serie:*\n⤷ ${serial}`,
        contextInfo: { 
          externalAdReply: {
            title: "『 𝙉𝙊𝙏𝙄𝙁𝙄𝘾𝘼𝘾𝙄𝙊́𝙉 📢 』",
            body: "Nuevo usuario registrado 🥳", 
            thumbnailUrl: 'https://telegra.ph/file/33bed21a0eaa789852c30.jpg',
            sourceUrl: "https://play.google.com/store/apps/details?id=com.haxkstorex.gen",
            mediaType: 1,
            showAdAttribution: false,
            renderLargerThumbnail: false
          }
        }
      }).catch(err => console.error("❌ Error enviando notificación al canal:", err));

      const totalRegResult = await db.query(`SELECT COUNT(*) AS total FROM usuarios WHERE registered = true`);
      const rtotalreg = parseInt(totalRegResult.rows[0].total);
      delete estados[who]

      // 5. Confirmación final al usuario
      return m.reply(`「 ꛕ 」 [ ✅ REGISTRO COMPLETADO ]\n\n👤 *Nombre:* ${nombre}\n🎂 *Edad:* ${edad} años\n🧬 *Género:* ${genero}\n🔢 *S/N:* ${serial}\n\n◉ *Total registrados:* ${rtotalreg}`);
    }
  }
}

handler.help = ['reg', 'correoswall'];
handler.tags = ['rg'];
handler.command = /^(correoswall|nserie|unreg|verify|verificar|reg(ister)?)$/i;

export default handler;

function toNum(number) {
  if (number >= 1000) return (number / 1000).toFixed(1) + 'k';
  return number.toString();
}
