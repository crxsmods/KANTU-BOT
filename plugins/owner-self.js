import { db, getSubbotConfig, invalidateSubbotConfig } from "../lib/postgres.js";

const handler = async (m, { args, conn, usedPrefix, command }) => {
const id = conn.user?.id;
if (!id) return
const cleanId = id.replace(/:\d+/, '');
const modoNuevo = args[0]?.toLowerCase();
if (!["on", "off", "private", "public"].includes(modoNuevo)) return m.reply(`⚙️ Usa: *${usedPrefix + command} on* o *${usedPrefix + command} off*`);

const nuevoModo = (modoNuevo === "on" || modoNuevo === "private") ? "private" : "public";
try {
const res = await db.query(`INSERT INTO subbots (id, mode)
      VALUES ($1, $2)
      ON CONFLICT (id) DO UPDATE SET mode = $2 RETURNING mode
    `, [cleanId, nuevoModo]);
invalidateSubbotConfig(cleanId);
    
const estado = nuevoModo === "private" ? "🔒 *Privado*" : "🌐 *Público*";
m.reply(`✅ Modo cambiado a: ${estado}`);
} catch (err) {
console.error(err);
}};
handler.help = ['self'];
handler.tags = ['jadibot'];
handler.command = /^modoprivado|self|modoprivate$/i;
handler.owner = true;

export default handler;