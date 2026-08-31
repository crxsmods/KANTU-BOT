import { startSubBot } from '../lib/subbot.js';
let commandFlags = {}; 

const handler = async (m, { conn, command }) => {
commandFlags[m.sender] = true;
  
const rtx = `*💎 KANTU BOT 💎*\nㅤㅤㅤㅤSer sub bot\n\n*Con otro telefono que tengas o en la PC escanea este QR para convertirte en un sub bot*\n\n*1. Haga clic en los tres puntos en la esquina superior derecha*\n*2. Toca WhatsApp Web*\n*3. Escanee este código QR*\n*Este código QR expira en 45 segundos!*\n\n> *⚠️ No nos hacemos responsable del mal uso que se le pueda dar.*\n\n🚨 Usa *.code* para solicitar codigo 8 dígitos 🚨`;
const rtx2 = `🟢 *_NUEVA FUNCIÓN DE HACERTE UN SUB BOT_* 🟢

*1️⃣ Diríjase en los tres puntos en la esquina superior derecha*
*2️⃣ Ir a la opción Dispositivos vinculados*
*3️⃣ da click en vincular con codigo de teléfono*
*4️⃣ pega el codigo a continuación*

> Codigo de 8 digitos vencen en 60 segundos`;

const phone = m.sender?.split('@')[0];
const isCode = /^(serbot|code)$/.test(command);
const caption = isCode ? rtx2 : rtx;
await startSubBot(m, conn, caption, isCode, phone, m.chat, commandFlags);
};
handler.help = ['jadibot', 'serbot', 'code'];
handler.tags = ['jadibot'];
handler.command = /^(serbot|code|jadibot|qr)$/i;
handler.register = false;

export default handler;
