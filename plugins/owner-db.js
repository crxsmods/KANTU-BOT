import { db } from '../lib/postgres.js';

let handler = async (m, { conn, args, isOwner, command }) => {
  const subcmd = args[0]?.toLowerCase();

  switch (subcmd) {
    case 'info': {
      try {
        const [usuarios, registrados, chats, grupos, mensajes] = await Promise.all([
          db.query('SELECT COUNT(*) FROM usuarios'),
          db.query('SELECT COUNT(*) FROM usuarios WHERE registered = true'),
          db.query('SELECT COUNT(*) FROM chats'),
          db.query("SELECT COUNT(*) FROM group_settings WHERE welcome IS NOT NULL"),
          db.query('SELECT COALESCE(SUM(message_count), 0) AS total FROM messages')
        ]);

        const text = [
          `📊 *\`ESTADÍSTICAS DE BASE DE DATOS\`*`,
          `> 👤 Usuarios: *${usuarios.rows[0].count}*`,
          `> ✅ Registrados: *${registrados.rows[0].count}*`,
          `> 💬 Chats totales: *${chats.rows[0].count}*`,
          `> 👥 Grupos configurados: *${grupos.rows[0].count}*`,
          `> 📨 Mensajes contabilizados: *${mensajes.rows[0].total}*`
        ].join('\n');

        await m.reply(text);
      } catch (e) {
        console.error('[❌] /db info error:', e);
        await m.reply('❌ Error al consultar la base de datos.');
      }
      break;
    }

    default:
      await m.reply('❓ Usa /db info para ver estadisticas operativas.');
  }
};

handler.help = ['db info'];
handler.tags = ['owner'];
handler.command = /^(db)$/i;
handler.rowner = true;

export default handler;
