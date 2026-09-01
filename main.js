// Creador CrxsMods
// Https://Github.com/CrxsMods 
// https://t.me/CrxsMods 
// 🚨 DO NOT EDIT  - NO EDITAR 🚨
import * as baileys from "@whiskeysockets/baileys";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import readline from "node:readline";
import qrcodeTerminal from "qrcode-terminal";
import QRCode from "qrcode";
import pino from "pino";
import NodeCache from 'node-cache';
import { startSubBot, deadSubbots } from "./lib/subbot.js";
import "./config.js";
import { handler, callUpdate, participantsUpdate, groupsUpdate } from "./handler.js";
import { loadPlugins } from './lib/plugins.js';
import { dbReady } from './lib/postgres.js';
import { peekGroupMetadata, invalidateGroupMetadata } from './lib/groupcache.js';
import { recallMessage } from './lib/msgstore.js';
import { runtimePaths, ensureRuntimeDirectories } from './lib/paths.js';
import { ensureRuntimeDataFiles } from './lib/runtime-data.js';
import { checkFfmpeg } from './lib/ffmpeg.js';
import { startHealthServer, updateHealth } from './lib/health.js';
import {
  isShuttingDown,
  managedInterval,
  managedTimeout,
  registerProcessHandlers,
  registerShutdownTask,
  setPrimarySocket,
  shutdown,
  shutdownAndExit
} from './lib/lifecycle.js';
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

await ensureRuntimeDirectories();
await ensureRuntimeDataFiles();
registerProcessHandlers();
await startHealthServer();

const ffmpegStatus = await checkFfmpeg();
updateHealth('ffmpeg', {
  available: ffmpegStatus.available,
  error: ffmpegStatus.error || null,
  path: ffmpegStatus.path,
  version: ffmpegStatus.version || null
});
if (!ffmpegStatus.available) log.warn(ffmpegStatus.error);

try {
  await dbReady;
  updateHealth('database', { ready: true, error: null });
  log.success("Base de datos PostgreSQL lista (migraciones aplicadas).");
} catch (err) {
  updateHealth('database', { ready: false, error: err?.message || String(err) });
  log.error("No se pudo conectar/preparar la base de datos PostgreSQL. El bot no iniciará.");
  console.error(err);
  await shutdown('database-startup-failed', 1, err);
  throw err;
}
const pluginStatus = await loadPlugins();
updateHealth('plugins', {
  ready: pluginStatus.failures.length === 0,
  loaded: pluginStatus.loaded,
  expected: pluginStatus.expected,
  error: pluginStatus.failures.length ? pluginStatus.failures : null
});
if (pluginStatus.failures.length) {
  const error = new Error(`${pluginStatus.failures.length} plugin(s) no pudieron cargarse.`);
  await shutdown('plugin-startup-failed', 1, error);
  throw error;
}
const BOT_SESSION_FOLDER = runtimePaths.botSession;
const BOT_CREDS_PATH = path.join(BOT_SESSION_FOLDER, "creds.json");
const BOT_QR_PATH = path.join(BOT_SESSION_FOLDER, "kantu-qr.png");
registerShutdownTask(() => fs.promises.rm(BOT_QR_PATH, { force: true }));

if (!globalThis.conns || !(globalThis.conns instanceof Array)) globalThis.conns = [];
const reconectando = new Set();
let usarCodigo = false;
let numero = "";
let ultimoQr = "";
let reconnectAttempts = 0;
let rechazosSesion = 0;
let maintenanceStarted = false;

// Prefijos de ID que identifican a otros bots de forma inequívoca.
const BOTS_IGNORADOS = ['NJX-', 'Lyru-', 'EvoGlobalBot-', 'FizzxyTheGreat-'];
const MAX_RECONNECT_ATTEMPTS = 5;

// --- Entrada del usuario (funciona con y sin TTY) ---
// Los paneles de hosting (Pterodactyl, Docker) entregan la consola como una
// tubería, no como un TTY: readline-sync se cuelga ahí, pero node:readline lee
// la línea sin problema. Devuelve null cuando no hay entrada posible (stdin
// cerrado) o cuando nadie responde dentro del tiempo límite, para que quien
// llama decida el valor por defecto en vez de esperar indefinidamente.
const PAIR_PROMPT_TIMEOUT_MS = (() => {
  const value = Number.parseInt(process.env.PAIR_PROMPT_TIMEOUT_MS || "", 10);
  return Number.isFinite(value) && value > 0 ? value : 180_000;
})();

// Una sola interfaz readline para todo el flujo de vinculación, con las líneas
// en cola: si el usuario pega varias de golpe, readline las emite antes de que
// se pregunte por ellas y se perderían al crear una interfaz por pregunta.
let pairReader = null;
let pairReaderClosed = false;
let pairWaiter = null;
const pairLines = [];

function openPairReader() {
  if (pairReader) return pairReader;
  pairReaderClosed = false;
  pairReader = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: Boolean(process.stdin.isTTY)
  });
  const deliver = value => {
    const waiter = pairWaiter;
    pairWaiter = null;
    waiter(value);
  };
  pairReader.on("line", line => {
    const value = String(line).trim();
    if (pairWaiter) deliver(value);
    else pairLines.push(value);
  });
  pairReader.once("close", () => {
    pairReaderClosed = true;
    if (pairWaiter) deliver(null);
  });
  return pairReader;
}

// Libera stdin en cuanto termina la vinculación: mantener la interfaz abierta
// dejaría el stream en modo fluido durante toda la vida del bot.
function closePairReader() {
  pairReader?.removeAllListeners("line");
  pairReader?.close();
  pairReader = null;
  pairWaiter = null;
  pairLines.length = 0;
  process.stdin.pause();
}

function askQuestion(promptText, timeoutMs = PAIR_PROMPT_TIMEOUT_MS) {
  if (process.stdin.destroyed) {
    log.warn("La consola no acepta entrada; se usará el valor por defecto.");
    return Promise.resolve(null);
  }
  openPairReader();
  process.stdout.write(promptText);
  if (pairLines.length) return Promise.resolve(pairLines.shift());
  if (pairReaderClosed) {
    process.stdout.write("\n");
    log.warn("La consola no acepta entrada; se usará el valor por defecto.");
    return Promise.resolve(null);
  }
  return new Promise(resolve => {
    const settle = value => {
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => {
      if (pairWaiter === settle) pairWaiter = null;
      process.stdout.write("\n");
      log.warn(`Sin respuesta en ${Math.round(timeoutMs / 1000)}s; se usará el valor por defecto.`);
      resolve(null);
    }, timeoutMs);
    pairWaiter = settle;
  });
}

// Normaliza el número de emparejamiento: acepta "+52 156 168 97881",
// "5215616897881" o cualquier variante con separadores. Devuelve "" si no
// queda un número utilizable.
function normalizePairNumber(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("52") && !digits.startsWith("521")) digits = "521" + digits.slice(2);
  return /^\d{10,15}$/.test(digits) ? digits : "";
}

// --- Detector de spam de "ekey bundle" ---
let spamCount = 0;

managedInterval(() => { spamCount = 0 }, 60 * 1000);

const origError = console.error;
console.error = (...args) => {
  if (args[0]?.toString().includes("Closing stale open session")) {
    spamCount++;
    if (spamCount > 50) {
      log.warn("Detectado loop de sesiones, reiniciando...");
      void shutdown('stale-session-loop', 1, new Error('Loop de sesiones detectado'));
    }
  }
  origError(...args);
};

try {
  await main();
} catch (error) {
  await shutdown('whatsapp-startup-failed', 1, error);
  throw error;
}
// Creador CrxsMods
// Https://Github.com/CrxsMods 
// https://t.me/CrxsMods 
async function main() {
const hayCredencialesPrincipal = fs.existsSync(BOT_CREDS_PATH);
const subbotsFolder = runtimePaths.subbotSessions;
const haySubbotsActivos = fs.existsSync(subbotsFolder) && fs.readdirSync(subbotsFolder).some(folder => fs.existsSync(path.join(subbotsFolder, folder, "creds.json"))
);

if (!hayCredencialesPrincipal && !haySubbotsActivos) {
try {
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
      chalk.hex(theme.muted)(' Escribe 1 o 2 y pulsa Enter.'),
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
      chalk.hex(theme.muted)('  Escribe 1 o 2 en la consola y pulsa Enter.'),
      '',
    ],
    theme.primary
  );
}

// Siempre se pregunta por consola: la consola del panel es una tubería, no un
// TTY, pero acepta líneas igual. PAIR_METHOD/PAIR_NUMBER solo actúan como
// valor por defecto cuando nadie responde (despliegue desatendido) para no
// dejar el proceso esperando una entrada que nunca llegará.
const envMethod = (process.env.PAIR_METHOD || "").trim();
const envNumero = normalizePairNumber(process.env.PAIR_NUMBER);
const defaultMethod = envMethod === "2" ? "2" : "1";

let opcion = "";
for (let intento = 0; intento < 3 && !["1", "2"].includes(opcion); intento += 1) {
  const respuesta = await askQuestion(
    chalk.hex(theme.secondary).bold('  ➜ ') + chalk.hex(theme.cyan)(`Opción [1=QR, 2=código] (${defaultMethod}): `)
  );
  if (respuesta === null) {
    opcion = defaultMethod;
    log.info(`Sin respuesta interactiva; se usa el método ${defaultMethod === "1" ? "QR" : "código"}.`);
    break;
  }
  opcion = respuesta === "" ? defaultMethod : respuesta;
  if (!["1", "2"].includes(opcion)) log.warn('Escribe 1 para QR o 2 para código de 8 dígitos.');
}
if (!["1", "2"].includes(opcion)) opcion = defaultMethod;

usarCodigo = opcion === "2";
if (usarCodigo) {
const mobile = isMobile();
if (mobile) {
  createSimpleBox(
    chalk.hex(theme.cyan).bold(' 📱 NÚMERO'),
    [
      chalk.white(' Solo dígitos, sin +'),
      chalk.hex(theme.muted)(' Ej: 5215616897881'),
    ],
    theme.info
  );
} else {
  createSimpleBox(
    chalk.hex(theme.cyan).bold(' 📱 INGRESO DE NÚMERO TELEFÓNICO'),
    [
      '',
      chalk.white(' Ingresa tu número con código de país, solo dígitos'),
      chalk.hex(theme.muted)(' Ejemplo: ') + chalk.hex(theme.success)('521') + chalk.white('5616897881'),
      chalk.hex(theme.muted)(' No escribas el ') + chalk.hex(theme.warning)('+') + chalk.hex(theme.muted)(' ni espacios.'),
      '',
    ],
    theme.info
  );
}
numero = "";
for (let intento = 0; intento < 3 && !numero; intento += 1) {
  const respuesta = await askQuestion(
    chalk.hex(theme.secondary).bold('  ➜ ') + chalk.hex(theme.cyan)('Número: ')
  );
  if (respuesta === null) {
    numero = envNumero;
    if (numero) log.info('Sin respuesta interactiva; se usa PAIR_NUMBER.');
    break;
  }
  numero = normalizePairNumber(respuesta === "" ? envNumero : respuesta);
  if (!numero) log.warn('Número inválido. Escribe entre 10 y 15 dígitos con código de país, ej: 5215616897881');
}

if (!numero) {
  log.error(`Número inválido o vacío ("${numero}"). No se puede solicitar código de emparejamiento.`);
  createBox(
    chalk.bold.white(' ❌ NÚMERO INVÁLIDO'),
    [
      '',
      chalk.white(' No se recibió un número de teléfono válido.'),
      chalk.hex(theme.muted)(' Usa PAIR_METHOD=2 y PAIR_NUMBER=521xxxxxxxxxx'),
      chalk.hex(theme.muted)(' como variables de entorno si tu panel de hosting'),
      chalk.hex(theme.muted)(' no permite entrada interactiva por consola.'),
      '',
    ],
    theme.error
  );
  throw new Error('PAIR_NUMBER no contiene un numero valido.');
}
}
} finally {
  closePairReader();
}
}

await cargarSubbots();

if (hayCredencialesPrincipal || !haySubbotsActivos) {
try {
await startBot();
} catch (err) {
log.error("Error al iniciar bot principal");
console.error(err);
throw err;
}} else {
log.warn("Subbots activos. Bot principal desactivado.");
}}

async function cargarSubbots() {
const folder = runtimePaths.subbotSessions;
if (!fs.existsSync(folder)) return;

const subbotIds = fs.readdirSync(folder);

for (const userId of subbotIds) {
const sessionPath = path.join(folder, userId);
const credsPath = path.join(sessionPath, "creds.json");
if (!fs.existsSync(credsPath)) continue;
if (globalThis.conns?.some(conn => conn.userId === userId)) continue;
if (reconectando.has(userId)) continue;
if (deadSubbots.has(userId)) continue;

let registrado = false;
try { registrado = Boolean(JSON.parse(fs.readFileSync(credsPath, "utf8"))?.registered); } catch {}
if (!registrado) continue;

try {
reconectando.add(userId);
await startSubBot(null, null, "Auto reconexión", false, userId, null);
} catch (e) {
log.error(`Falló carga de ${userId}`);
} finally {
reconectando.delete(userId);
}

await new Promise(res => setTimeout(res, 2500))}
managedTimeout(cargarSubbots, 60 * 1000); 
}

async function startBot() {
if (isShuttingDown()) return;
updateHealth('whatsapp', { connected: false, status: 'connecting', changedAt: new Date().toISOString() });
const { state, saveCreds } = await baileys.useMultiFileAuthState(BOT_SESSION_FOLDER);
const msgRetryCounterMap = new Map();
const msgRetryCounterCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });
const userDevicesCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });
const { version } = await baileys.fetchLatestBaileysVersion();
// Creador CrxsMods
// Https://Github.com/CrxsMods 
// https://t.me/CrxsMods 
console.info = () => {};
console.debug = () => {};
const sock = baileys.makeWASocket({
// printQRInTerminal está DEPRECADO en Baileys 7 (solo emite un warning y no
// dibuja nada). El QR se maneja abajo, en el evento connection.update.
logger: pino({ level: 'silent' }),
browser: ['Windows', 'Chrome'],
auth: { creds: state.creds,
keys: baileys.makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
},
markOnlineOnConnect: false, 
generateHighQualityLinkPreview: false, 
syncFullHistory: false,
// Baileys pide aquí el mensaje original cuando a alguien le falló el
// descifrado. Devolver "" dejaba el reintento roto (de ahí los
// "Esperando este mensaje" que veían los demás).
getMessage: async (key) => recallMessage(key),
msgRetryCounterCache: msgRetryCounterCache || new Map(),
userDevicesCache: userDevicesCache || new Map(),
// Caché compartida y real (lib/groupcache.js). La anterior era un NodeCache
// al que nunca se le hacía .set(), así que siempre devolvía undefined.
cachedGroupMetadata: async (jid) => peekGroupMetadata(jid),
version: version, 
defaultQueryTimeoutMs: 30_000,
keepAliveIntervalMs: 55000, 
maxIdleTimeMs: 60000, 
});

globalThis.conn = sock;
setPrimarySocket(sock);
setupGroupEvents(sock);
sock.ev.on("creds.update", saveCreds);

sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
const code = lastDisconnect?.error?.output?.statusCode || 0;
const mobile = isMobile();

if (qr && !usarCodigo && qr !== ultimoQr) {
updateHealth('whatsapp', { connected: false, status: 'awaiting_qr', changedAt: new Date().toISOString() });
ultimoQr = qr;
try {
  await QRCode.toFile(BOT_QR_PATH, qr, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 512,
  });
} catch {
  log.warn('No se pudo guardar la imagen temporal del QR');
}
createSimpleBox(
  chalk.hex(theme.cyan).bold(' 📲 ESCANEA EL CÓDIGO QR'),
  [
    '',
    chalk.white(' WhatsApp > Dispositivos vinculados'),
    chalk.white(' > Vincular un dispositivo'),
    '',
  ],
  theme.info
);
qrcodeTerminal.generate(qr, { small: true });
}

if (connection === "open") {
updateHealth('whatsapp', { connected: true, status: 'connected', changedAt: new Date().toISOString() });
ultimoQr = "";
rechazosSesion = 0;
if (fs.existsSync(BOT_QR_PATH)) fs.unlinkSync(BOT_QR_PATH);
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
updateHealth('whatsapp', { connected: false, status: 'disconnected', changedAt: new Date().toISOString(), code });
const yaRegistrado = state.creds.registered;
const mostrarErrorSesion = () => {
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
};

// Antes de vincular no se reintenta con códigos de sesión: evita el loop
// infinito en paneles cuando requestPairingCode falla en silencio.
if (!yaRegistrado && [401, 440, 428, 405].includes(code)) {
  mostrarErrorSesion();
  log.error(`Sesión inválida (código ${code}) antes de completar la vinculación. Elimina "BotSession" y reinicia para vincular de nuevo.`);
  return;
}

if ([401, 440].includes(code)) {
  rechazosSesion++;
  if (rechazosSesion >= 5) {
    mostrarErrorSesion();
    log.error(`La sesión fue rechazada ${rechazosSesion} veces seguidas (código ${code}). Elimina "BotSession" y vincula de nuevo.`);
    return;
  }
  log.warn(`Sesión rechazada (código ${code}). Reintento ${rechazosSesion}/5...`);
} else {
  rechazosSesion = 0;
}

if (usarCodigo && !yaRegistrado) {
  reconnectAttempts++;
  if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
    log.error(`Se alcanzó el máximo de ${MAX_RECONNECT_ATTEMPTS} intentos de vinculación sin éxito. Deteniendo reintentos automáticos.`);
    createBox(
      chalk.bold.white(' ❌ VINCULACIÓN FALLIDA'),
      [
        '',
        chalk.white(' No se pudo completar la vinculación tras varios intentos.'),
        chalk.hex(theme.muted)(' Verifica el número (PAIR_NUMBER) e inténtalo de nuevo.'),
        '',
      ],
      theme.error
    );
    return;
  }
  log.system(`Reconectando en 3s... (intento ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
} else {
  reconnectAttempts = 0;
  log.system("Reconectando en 3s...");
}
managedTimeout(() => startBot(), 3000);
}});

if (usarCodigo && !state.creds.registered) {
managedTimeout(async () => {
try {
if (!numero) {
  log.error("No hay número configurado para solicitar el código de emparejamiento.");
  return;
}
const code = await sock.requestPairingCode(numero);
reconnectAttempts = 0;
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
} catch (err) {
  log.error("No se pudo generar el código de emparejamiento: " + (err?.message || err));
  console.error(err);
  createBox(
    chalk.bold.white(' ❌ ERROR AL GENERAR CÓDIGO'),
    [
      '',
      chalk.white(' Verifica que el número tenga el código de país correcto'),
      chalk.white(' y que no tenga espacios ni símbolos (solo dígitos).'),
      chalk.hex(theme.muted)(` Detalle: ${(err?.message || err || '').toString().slice(0, 80)}`),
      '',
    ],
    theme.error
  );
}
}, 2000);
}

sock.ev.on("messages.upsert", async ({ messages, type }) => {
if (type !== "notify") return;
for (const msg of messages) {
if (!msg.message) continue;
if (msg.messageTimestamp && (Date.now()/1000 - msg.messageTimestamp > 120)) continue; 
// Ignoramos mensajes de otros bots conocidos, para no entrar en bucles.
//
// Antes esta lista incluía además prefijos hexadecimales genéricos
// ('3EB0', '3E83', 'B24E', 'BAE5', '3E38', '8SCO'). '3EB0' en concreto es
// el prefijo que genera el propio Baileys (Utils/generics.js:
// `generateMessageID = () => '3EB0' + ...`) y que usa también WhatsApp
// Web/Escritorio, así que se estaban descartando mensajes legítimos de
// usuarios reales. Solo quedan los prefijos con nombre, que son inequívocos.
//
// Además esto era `return` dentro del for: un solo mensaje filtrado
// abortaba el lote entero y se perdían los demás. Ahora es `continue`.
if (BOTS_IGNORADOS.some(prefijo => msg.key.id.startsWith(prefijo))) continue
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
    
if (!maintenanceStarted) {
maintenanceStarted = true;

// Limpieza de temporales compartida por todas las reconexiones.
managedInterval(() => {
const tmp = runtimePaths.tmp;
try {
if (!fs.existsSync(tmp)) return;
const files = fs.readdirSync(tmp, { withFileTypes: true });
files.forEach(entry => {
if (!entry.isFile()) return;
const file = entry.name;
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
// Reinicio periódico. Esto solo tiene sentido si algo relanza el proceso
// (PM2, Docker, systemd, un panel de hosting). Ejecutado con `npm start` a
// secas, el process.exit(0) apagaba el bot a las 3 horas y ya no volvía.
// Por eso ahora es opt-in: define AUTO_RESTART_HOURS para activarlo.
const autoRestartHours = Number.parseFloat(process.env.AUTO_RESTART_HOURS || '0');
if (Number.isFinite(autoRestartHours) && autoRestartHours > 0) {
log.info(`Reinicio automático activado: cada ${autoRestartHours}h (requiere gestor de procesos).`);
managedInterval(() => {
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
void shutdownAndExit('automatic-restart', 0);
}, autoRestartHours * 60 * 60 * 1000);
}

// Las claves de sesion pertenecen a Baileys y no se podan por antiguedad.
// Borrarlas durante una desconexion puede corromper una sesion valida.
}
    
function setupGroupEvents(sock) {
sock.ev.on("group-participants.update", async (update) => {
console.log(update)
// Cambió la membresía: invalidamos aquí también, porque participantsUpdate
// puede salir antes de refrescar (modo privado, sin permisos, etc.).
invalidateGroupMetadata(update?.id);
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
