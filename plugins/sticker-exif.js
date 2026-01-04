import { db } from '../lib/postgres.js';

let handler = async (m, { conn, args, usedPrefix, command }) => {
if (!args[0]) return m.reply(`「 ꛕ 」 Para personalizar la información de tus stickers, utiliza el formato correcto 🏷️\n\n*Uso:* ${usedPrefix}${command} nombre | autor\n*Ejemplo:* ${usedPrefix}${command} KantuBot | CrxsMods`)

let text = args.join(' ').split('|');
let packname = text[0].trim();
let author = text[1] ? text[1].trim() : '';

if (!packname) return m.reply('「 ꛕ 」 Es necesario que proporciones al menos el nombre del paquete (packname) ⚠️');
if (packname.length > 600) return m.reply('「 ꛕ 」 El nombre del paquete es demasiado extenso, intenta con uno más corto 🛑');
if (author && author.length > 650) return m.reply('「 ꛕ 」 El nombre del autor supera el límite de caracteres permitido 🛑');

await db.query(`UPDATE usuarios
      SET sticker_packname = $1,
          sticker_author = $2
      WHERE id = $3`, [packname, author || null, m.sender]);

await m.reply(`┏──────────────
┊ 『 ✨ STICKER EXIF 』
┊ 「 ꛕ 」 𝑫𝒆𝒗 𝑩𝒚 𝑪𝒓𝒙𝒔𝑴𝒐𝒅𝒔
┗─────────────❐
│ᐉⴰ📦┊ *Pack:* ${packname}
│ᐉⴰ👤┊ *Autor:* ${author || 'No definido'}

「 ꛕ 」 Configuración guardada. Todos los stickers que generes a partir de ahora llevarán tu marca personal ✅`)
};
handler.help = ['exif <packname> | <author>'];
handler.tags = ['sticker'];
handler.command = ['exif'];
handler.register = true;

export default handler;
