import { db, invalidateSubbotConfig } from "../lib/postgres.js";

const handler = async (m, { args, conn }) => {
const id = conn.user?.id;
if (!id) return;
const name = args.join(" ").trim();
if (!name) return m.reply("❌ Escribe un nombre para el bot.\n\nEjemplo:\n/setbotname KantuBot 😎");
const cleanId = id.replace(/:\d+/, '');
await db.query(`UPDATE subbots SET name = $1 WHERE id = $2`, [name, cleanId]);
invalidateSubbotConfig(cleanId);
m.reply(`✅ Nombre del bot actualizado a:\n*${name}*`);
};
handler.help = ["setbotname <name>"];
handler.tags = ["jadibot"];
handler.command = /^setbotname$/i;
handler.register = true
handler.owner = true;

export default handler;
