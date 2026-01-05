// Creador CrxsMods
// Https://Github.com/CrxsMods 
// https://t.me/CrxsMods 
// 🚨 DO NOT EDIT  - NO EDITAR 🚨
import * as baileys from "@whiskeysockets/baileys";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import readlineSync from "readline-sync";
import pino from "pino";
import NodeCache from 'node-cache';
import { startSubBot } from "./lib/subbot.js";
import "./config.js";
import { handler, callUpdate, participantsUpdate, groupsUpdate } from "./handler.js";
import { loadPlugins } from './lib/plugins.js';
const getWidth = () => Math.min(process.stdout.columns || 45, 65) - 4;
const isMobile = () => (process.stdout.columns || 45) < 55;

const theme = {
  gradient: ['#ff006e', '#8338ec', '#3a86ff'],
  primary: '#8338ec',
  secondary: '#ff006e', 
  accent: '#3a86ff',
  success: '#00f5d4',
  warning: '#fee440',
  error: '#ef233c',
  info: '#4cc9f0',
  muted: '#6c757d',
  gold: '#ffd700',
  cyan: '#8be9fd',
  green: '#50fa7b'
};
//  SISTEMA DE LOGGING
const getTimestamp = () => {
  const now = new Date();
  return chalk.hex(theme.muted)(`[${now.toLocaleTimeString('es-MX', { hour12: false })}]`);
};

const log = {
  success: (msg) => console.log(`  ${chalk.hex(theme.success)('✔')} ${chalk.white(msg)}`),
  error: (msg) => console.log(`  ${chalk.hex(theme.error)('✖')} ${chalk.white(msg)}`),
  warn: (msg) => console.log(`  ${chalk.hex(theme.warning)('⚠')} ${chalk.white(msg)}`),
  info: (msg) => console.log(`  ${chalk.hex(theme.info)('ℹ')} ${chalk.white(msg)}`),
  system: (msg) => console.log(`  ${chalk.hex(theme.cyan)('⟳')} ${chalk.gray(msg)}`),
};
const createBox = (title, lines, color = theme.primary) => {
  const w = getWidth();
  console.log('');
  console.log(chalk.hex(color)(`  ╔${'═'.repeat(w)}╗`));
  
  const cleanTitle = title.replace(/\x1b\[[0-9;]*m/g, '');
  const titlePad = Math.max(0, w - cleanTitle.length);
  console.log(chalk.hex(color)(`  ║`) + title + ' '.repeat(titlePad) + chalk.hex(color)('║'));
  
  console.log(chalk.hex(color)(`  ╠${'═'.repeat(w)}╣`));
  
  lines.forEach(line => {
    const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '');
    const pad = Math.max(0, w - cleanLine.length);
    console.log(chalk.hex(color)(`  ║`) + line + ' '.repeat(pad) + chalk.hex(color)('║'));
  });
  
  console.log(chalk.hex(color)(`  ╚${'═'.repeat(w)}╝`));
  console.log('');
};

const createSimpleBox = (title, lines, color = theme.muted) => {
  const w = getWidth();
  console.log('');
  console.log(chalk.hex(color)(`  ╭${'─'.repeat(w)}╮`));
  
  const cleanTitle = title.replace(/\x1b\[[0-9;]*m/g, '');
  const titlePad = Math.max(0, w - cleanTitle.length);
  console.log(chalk.hex(color)(`  │`) + title + ' '.repeat(titlePad) + chalk.hex(color)('│'));
  
  console.log(chalk.hex(color)(`  ├${'─'.repeat(w)}┤`));
  
  lines.forEach(line => {
    const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '');
    const pad = Math.max(0, w - cleanLine.length);
    console.log(chalk.hex(color)(`  │`) + line + ' '.repeat(pad) + chalk.hex(color)('│'));
  });
  
  console.log(chalk.hex(color)(`  ╰${'─'.repeat(w)}╯`));
  console.log('');
};

await loadPlugins();
const BOT_SESSION_FOLDER = "./BotSession";
const BOT_CREDS_PATH = path.join(BOT_SESSION_FOLDER, "creds.json");
if (!fs.existsSync(BOT_SESSION_FOLDER)) fs.mkdirSync(BOT_SESSION_FOLDER);

if (!globalThis.conns || !(globalThis.conns instanceof Array)) globalThis.conns = [];
const reconectando = new Set();
let usarCodigo = false;
let numero = "";

// --- Detector de spam de "ekey bundle" ---
let spamCount = 0;

setInterval(() => { spamCount = 0 }, 60 * 1000);

const origError = console.error;
console.error = (...args) => {
  if (args[0]?.toString().includes("Closing stale open session")) {
    spamCount++;
    if (spamCount > 50) {
      log.warn("Detectado loop de sesiones, reiniciando...");
      process.exit(1);
    }
  }
  origError(...args);
};

main();
// Creador CrxsMods
// Https://Github.com/CrxsMods 
// https://t.me/CrxsMods 
async function main() {
const hayCredencialesPrincipal = fs.existsSync(BOT_CREDS_PATH);
const subbotsFolder = "./jadibot";
const haySubbotsActivos = fs.existsSync(subbotsFolder) && fs.readdirSync(subbotsFolder).some(folder => fs.existsSync(path.join(subbotsFolder, folder, "creds.json"))
);

if (!hayCredencialesPrincipal && !haySubbotsActivos) {
const mobile = isMobile();

if (mobile) {
  // Versión móvil compacta
  createBox(
    chalk.hex(theme.gold).bold(' 🔐 VINCULACIÓN'),
    [
      '',
      chalk.hex(theme.cyan)(' Selecciona método:'),
      '',
      chalk.hex(theme.success)(' ❶ ') + chalk.white('Código QR'),
      chalk.hex(theme.warning)(' ❷ ') + chalk.white('Código 8 dígitos'),
      '',
    ],
    theme.primary
  );
} else {
  // Versión PC completa
  createBox(
    chalk.hex(theme.gold).bold(' 🔐 CONFIGURACIÓN DE VINCULACIÓN'),
    [
      '',
      chalk.hex(theme.cyan)(' Selecciona el método para conectar WhatsApp:'),
      '',
      chalk.hex(theme.success).bold('  ❶  ') + chalk.white('Escanear código QR'),
      chalk.hex(theme.muted)('      └─ Recomendado para conexión rápida'),
      '',
      chalk.hex(theme.warning).bold('  ❷  ') + chalk.white('Código de emparejamiento (8 dígitos)'),
      chalk.hex(theme.muted)('      └─ Útil si no puedes escanear QR'),
      '',
    ],
    theme.primary
  );
}

const opcion = readlineSync.question(chalk.hex(theme.secondary).bold('  ➜ ') + chalk.hex(theme.cyan)('Opción: '));

usarCodigo = opcion === "2";
if (usarCodigo) {
const mobile = isMobile();
if (mobile) {
  createSimpleBox(
    chalk.hex(theme.cyan).bold(' 📱 NÚMERO'),
    [
      chalk.white(' Ej: +5217121649714'),
      chalk.hex(theme.muted)(' Ej: +5217121649714'),
    ],
    theme.info
  );
} else {
  createSimpleBox(
    chalk.hex(theme.cyan).bold(' 📱 INGRESO DE NÚMERO TELEFÓNICO'),
    [
      '',
      chalk.white(' Ingresa tu número con código de país'),
      chalk.hex(theme.muted)(' Ejemplo: ') + chalk.hex(theme.success)('+52') + chalk.white('1234567890'),
      '',
    ],
    theme.info
  );
}
numero = readlineSync.question(chalk.hex(theme.secondary).bold('  ➜ ') + chalk.hex(theme.cyan)('Número: ')).replace(/[^0-9]/g, '');
if (numero.startsWith('52') && !numero.startsWith('521')) {
numero = '521' + numero.slice(2);
}}
}

await cargarSubbots();

if (hayCredencialesPrincipal || !haySubbotsActivos) {
try {
await startBot();
} catch (err) {
log.error("Error al iniciar bot principal");
console.error(err);
}} else {
log.warn("Subbots activos. Bot principal desactivado.");
}}

async function cargarSubbots() {
const folder = "./jadibot";
if (!fs.existsSync(folder)) return;

const subbotIds = fs.readdirSync(folder);

for (const userId of subbotIds) {
const sessionPath = path.join(folder, userId);
const credsPath = path.join(sessionPath, "creds.json");
if (!fs.existsSync(credsPath)) continue;
if (globalThis.conns?.some(conn => conn.userId === userId)) continue;
if (reconectando.has(userId)) continue;

try {
reconectando.add(userId);
await startSubBot(null, null, "Auto reconexión", false, userId, null);
} catch (e) {
log.error(`Falló carga de ${userId}`);
} finally {
reconectando.delete(userId);
}

await new Promise(res => setTimeout(res, 2500))}
setTimeout(cargarSubbots, 60 * 1000); 
}

async function startBot() {
const { state, saveCreds } = await baileys.useMultiFileAuthState(BOT_SESSION_FOLDER);
const msgRetryCounterMap = new Map();
const msgRetryCounterCache = new NodeCache({ stdTTL: 0, checkperiod: 0 }); 
const userDevicesCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });
const groupCache = new NodeCache({ stdTTL: 3600, checkperiod: 300 });
const { version } = await baileys.fetchLatestBaileysVersion();
// Creador CrxsMods
// Https://Github.com/CrxsMods 
// https://t.me/CrxsMods 
console.info = () => {};
console.debug = () => {};
const sock = baileys.makeWASocket({
printQRInTerminal: !usarCodigo && !fs.existsSync(BOT_CREDS_PATH),
logger: pino({ level: 'silent' }),   
browser: ['Windows', 'Chrome'],
auth: { creds: state.creds,
keys: baileys.makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
},
markOnlineOnConnect: false, 
generateHighQualityLinkPreview: true, 
syncFullHistory: false,
getMessage: async () => {
return "";
},
msgRetryCounterCache: msgRetryCounterCache || new Map(),
userDevicesCache: userDevicesCache || new Map(),
defaultQueryTimeoutMs: undefined,
cachedGroupMetadata: async (jid) => groupCache.get(jid),
version: version, 
defaultQueryTimeoutMs: 30_000,
keepAliveIntervalMs: 55000, 
maxIdleTimeMs: 60000, 
});

globalThis.conn = sock;
setupGroupEvents(sock);
sock.ev.on("creds.update", saveCreds);

sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
const code = lastDisconnect?.error?.output?.statusCode || 0;
const mobile = isMobile();

if (connection === "open") {
const connTime = new Date().toLocaleTimeString('es-MX', { hour12: false });

if (mobile) {
  createBox(
    chalk.bold.white(' ✅ CONECTADO'),
    [
      '',
      chalk.hex(theme.green)(' ◈ ') + chalk.white('WhatsApp listo'),
      chalk.hex(theme.muted)(` ◈ ${connTime}`),
      '',
    ],
    theme.success
  );
} else {
  createBox(
    chalk.bold.white(' ✅ CONEXIÓN ESTABLECIDA CON ÉXITO'),
    [
      '',
      chalk.hex(theme.cyan)(' ◈ Estado:     ') + chalk.hex(theme.green).bold('CONECTADO'),
      chalk.hex(theme.cyan)(' ◈ Plataforma: ') + chalk.white('WhatsApp Multi-Device'),
      chalk.hex(theme.cyan)(' ◈ Hora:       ') + chalk.white(connTime),
      '',
      chalk.hex(theme.muted)(' 🤖 Bot listo para recibir comandos'),
      '',
    ],
    theme.success
  );
}
}

if (connection === "close") {
if ([401, 440, 428, 405].includes(code)) {
if (mobile) {
  createBox(
    chalk.bold.white(' ❌ ERROR SESIÓN'),
    [
      '',
      chalk.hex(theme.warning)(` ⚠ Código: ${code}`),
      chalk.white(' Borra "BotSession"'),
      '',
    ],
    theme.error
  );
} else {
  createBox(
    chalk.bold.white(' ❌ ERROR DE SESIÓN'),
    [
      '',
      chalk.hex(theme.warning)(`  ⚠ Código de error: ${code}`),
      '',
      chalk.hex(theme.muted)('  Solución:'),
      chalk.white('  1. Elimina la carpeta "BotSession"'),
      chalk.white('  2. Reinicia el bot'),
      chalk.white('  3. Vincula nuevamente'),
      '',
    ],
    theme.error
  );
}
}
log.system("Reconectando en 3s...");
setTimeout(() => startBot(), 3000);
}});

process.on('uncaughtException', console.error);
process.on('unhandledRejection', console.error);
  
if (usarCodigo && !state.creds.registered) {
setTimeout(async () => {
try {
const code = await sock.requestPairingCode(numero);
const mobile = isMobile();

if (mobile) {
  createBox(
    chalk.bold.white(' 🔑 CÓDIGO'),
    [
      '',
      '   ' + chalk.bgHex('#1a1a2e').hex(theme.success).bold(` ${code} `),
      '',
      chalk.hex(theme.muted)(' Ingresa en WhatsApp'),
      '',
    ],
    theme.info
  );
} else {
  createBox(
    chalk.bold.white(' 🔑 CÓDIGO DE EMPAREJAMIENTO'),
    [
      '',
      '       ' + chalk.bgHex('#1a1a2e').hex(theme.success).bold(`  ✦  ${code}  ✦  `),
      '',
      chalk.hex(theme.muted)(' 📲 Instrucciones:'),
      chalk.white(' 1. Abre WhatsApp'),
      chalk.white(' 2. Ajustes > Dispositivos vinculados'),
      chalk.white(' 3. Vincular con número de teléfono'),
      chalk.white(' 4. Ingresa el código de arriba'),
      '',
    ],
    theme.info
  );
}
} catch {}
}, 2000);
}

sock.ev.on("messages.upsert", async ({ messages, type }) => {
if (type !== "notify") return;
for (const msg of messages) {
if (!msg.message) continue;
if (msg.messageTimestamp && (Date.now()/1000 - msg.messageTimestamp > 120)) continue; 
if(msg.key.id.startsWith('NJX-') || msg.key.id.startsWith('Lyru-') || msg.key.id.startsWith('EvoGlobalBot-') || msg.key.id.startsWith('BAE5') && msg.key.id.length === 16 || msg.key.id.startsWith('3EB0') && msg.key.id.length === 12 || msg.key.id.startsWith('3EB0') || msg.key.id.startsWith('3E83') || msg.key.id.startsWith('3E38') && (msg.key.id.length === 20 || msg.key.id.length === 22) || msg.key.id.startsWith('B24E') || msg.key.id.startsWith('8SCO') && msg.key.id.length === 20 || msg.key.id.startsWith('FizzxyTheGreat-')) return
try {
await handler(sock, msg);
} catch (err) {
console.error(err);
}}
});
  
sock.ev.on("call", async (calls) => {
try {
for (const call of calls) {
await callUpdate(sock, call);
}} catch (err) {
log.error("Error en llamada");
console.error(err);
}
});
    
//tmp    
setInterval(() => {
const tmp = './tmp';
try {
if (!fs.existsSync(tmp)) return;
const files = fs.readdirSync(tmp);
files.forEach(file => {
if (file.endsWith('.file')) return;
const filePath = path.join(tmp, file);
const stats = fs.statSync(filePath);
const now = Date.now();
const modifiedTime = new Date(stats.mtime).getTime();
const age = now - modifiedTime;
if (age > 3 * 60 * 1000) {
fs.unlinkSync(filePath);
}
})
} catch (err) {
console.error('Error cleaning tmp:', err);
}}, 30 * 1000);
// Creador CrxsMods
// Https://Github.com/CrxsMods 
// https://t.me/CrxsMods    
setInterval(() => {
const mobile = isMobile();
if (mobile) {
  console.log('');
  log.warn('♻️ Reiniciando...');
  console.log('');
} else {
  createSimpleBox(
    chalk.bold.white(' ♻️  REINICIO AUTOMÁTICO'),
    [
      chalk.hex(theme.muted)(' Reiniciando para mantener rendimiento...'),
    ],
    theme.warning
  );
}
process.exit(0); 
}, 10800000) //3hs

//tmp session basura
setInterval(() => {
  const now = Date.now();
  const carpetas = ['./jadibot', './BotSession'];
  for (const basePath of carpetas) {
    if (!fs.existsSync(basePath)) continue;

    const subfolders = fs.readdirSync(basePath);
    for (const folder of subfolders) {
      const sessionPath = path.join(basePath, folder);
      if (!fs.statSync(sessionPath).isDirectory()) continue;
      const isActive = globalThis.conns?.some(c => c.userId === folder || c.user?.id?.includes(folder));
      const files = fs.readdirSync(sessionPath);

      const prekeys = files.filter(f => f.startsWith("pre-key"));
      if (prekeys.length > 500) {
        prekeys
          .sort((a, b) => fs.statSync(path.join(sessionPath, a)).mtimeMs - fs.statSync(path.join(sessionPath, b)).mtimeMs)
          .slice(0, prekeys.length - 300)
          .forEach(pk => {
            fs.unlinkSync(path.join(sessionPath, pk));
          });
      }

      for (const file of files) {
        const fullPath = path.join(sessionPath, file);
        if (!fs.existsSync(fullPath)) continue;
        if (file === 'creds.json') continue;
        try {
          const stats = fs.statSync(fullPath);
          const ageMs = now - stats.mtimeMs;

          if (file.startsWith('pre-key') && ageMs > 24 * 60 * 60 * 1000 && !isActive) {
            fs.unlinkSync(fullPath);
          } else if (ageMs > 30 * 60 * 1000 && !isActive) {
            fs.unlinkSync(fullPath);
          }
        } catch (err) {
          log.error(`Error limpiando ${file}`);
        }
      }
    }
  }
  
  const mobile = isMobile();
  if (mobile) {
    console.log('');
    log.success('Limpieza completada');
    console.log('');
  } else {
    createSimpleBox(
      chalk.bold.white(' 🗑️  LIMPIEZA AUTOMÁTICA'),
      [
        '',
        chalk.hex(theme.success)(' ✔ ') + chalk.white('Temporales eliminados'),
        chalk.hex(theme.success)(' ✔ ') + chalk.white('Sesiones optimizadas'),
        chalk.hex(theme.success)(' ✔ ') + chalk.white('Pre-keys limpiadas'),
        '',
      ],
      theme.cyan
    );
  }
}, 10 * 60 * 1000);
    
function setupGroupEvents(sock) {
sock.ev.on("group-participants.update", async (update) => {
console.log(update)
try {
await participantsUpdate(sock, update);
} catch (err) {
log.error("Error en participantes");
console.error(err);
}});

sock.ev.on("groups.update", async (updates) => {
console.log(updates)
try {
for (const update of updates) {
await groupsUpdate(sock, update);
}} catch (err) {
log.error("Error en grupo");
console.error(err);
}});
}
}