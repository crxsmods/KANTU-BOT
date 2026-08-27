import { db, getSubbotConfig, invalidateSubbotConfig } from "../lib/postgres.js";

const handler = async (m, { args, conn, usedPrefix }) => {
const id = conn.user?.id;
if (!id) return 
const cleanId = id.replace(/:\d+/, '');
const config = await getSubbotConfig(id);
const actuales = Array.isArray(config.prefix) ? config.prefix : [config.prefix];

if (args.length === 0) {
const lista = actuales.length > 0 ? actuales.map(p => `\`${p || '(sin prefijo)'}\``).join(", ") : "Sin prefijo";
return m.reply(`📌 *Prefijos actuales:* ${lista}

✏️ *Ejemplos de uso:*
• \`${usedPrefix}setprefix /\` _(solo responde a “/”)_
• \`${usedPrefix}setprefix 0\` _(sin prefijo)_
• \`${usedPrefix}setprefix 0,#,!\` _(sin prefijo, # y !)_`);
  }

const entrada = args.join(" ").trim();
if (entrada.toLowerCase() === "noprefix" || entrada === "0") {
try {
const res = await db.query(`INSERT INTO subbots (id, prefix)
         VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET prefix = $2 RETURNING prefix`, [cleanId, [""]]);
invalidateSubbotConfig(cleanId);
return m.reply(`✅ Ahora el bot funciona *sin prefijo*. Puedes escribir comandos directamente como:\n• \`menu\``);
} catch (err) {
console.error(err);
return m.reply("❌ Error al guardar prefijos, revisa la base de datos.");
}}

const lista = entrada.split(",").map(p => p.trim()).map(p => (p === "0" ? "" : p)).filter((p, i, self) => self.indexOf(p) === i); // evitar duplicados
if (lista.length === 0) return m.reply("❌ No se detectaron prefijos válidos.");
if (lista.length > 9) return m.reply("⚠️ Máximo 9 prefijos permitidos.");
try {
const res = await db.query(`INSERT INTO subbots (id, prefix)
       VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET prefix = $2 RETURNING prefix`, [cleanId, lista]);
invalidateSubbotConfig(cleanId);
const nuevoTexto = lista.map(p => `\`${p || '(sin prefijo)'}\``).join(", ");
m.reply(`✅ Prefijos actualizados a: ${nuevoTexto}`);
} catch (err) {
console.error(err);
return m.reply("❌ Error al guardar prefijos, revisa la base de datos, reportarlo a mi creator con el comando: /report");
}};
handler.help = ['setprefix'];
handler.tags = ['jadibot'];
handler.command = /^setprefix$/i;
handler.owner = true;

export default handler;