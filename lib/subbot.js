import path from 'node:path'
import {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeWASocket,
  useMultiFileAuthState
} from '@whiskeysockets/baileys'
import pino from 'pino'
import qrcode from 'qrcode'
import chalk from 'chalk'
import NodeCache from 'node-cache'
import { handler, callUpdate, participantsUpdate, groupsUpdate } from '../handler.js'
import { runtimePaths } from './paths.js'
import { isShuttingDown, managedTimeout } from './lifecycle.js'
import { updateHealth } from './health.js'
import { recallMessage } from './msgstore.js'
import { peekGroupMetadata, invalidateGroupMetadata } from './groupcache.js'
import { paisDesdeNumero } from './pais.js'

const canalNotificaciones = () => {
  const jid = (process.env.MENU_NEWSLETTER_JID || '120363371008200788@newsletter').trim()
  return /^\d{10,30}@newsletter$/.test(jid) ? jid : '120363371008200788@newsletter'
}

if (!Array.isArray(globalThis.conns)) globalThis.conns = []

const retryCounters = new Map()
const starting = new Set()
const ignoredBotPrefixes = ['NJX-', 'Lyru-', 'EvoGlobalBot-', 'FizzxyTheGreat-']

const cleanId = value => String(value || '')
  .replace(/:\d+/, '')
  .split('@')[0]
  .replace(/[^0-9]/g, '')

const closeSocket = socket => {
  try {
    socket.ev?.removeAllListeners?.()
    socket.ws?.close?.()
  } catch {}
}

const transientReasons = new Set([
  DisconnectReason.connectionClosed,
  DisconnectReason.connectionLost,
  DisconnectReason.restartRequired,
  DisconnectReason.timedOut
])

export async function startSubBot(m, parentConnection, caption = '', isCode = false, phone = '', chatId = '', commandFlags = {}) {
  if (isShuttingDown()) return null

  const id = cleanId(phone || m?.sender)
  if (!/^\d{7,15}$/.test(id)) throw new Error('Identificador de subbot invalido.')
  if (starting.has(id)) return null
  if (globalThis.conns.some(connection => connection.userId === id)) return null

  starting.add(id)
  try {
    const sessionFolder = path.join(runtimePaths.subbotSessions, id)
    const senderId = m?.sender
    const { state, saveCreds } = await useMultiFileAuthState(sessionFolder)
    const { version } = await fetchLatestBaileysVersion()
    const logger = pino({ level: 'silent' })
    const socket = makeWASocket({
      logger,
      browser: ['Windows', 'Chrome'],
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger)
      },
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: false,
      syncFullHistory: false,
      getMessage: async key => recallMessage(key),
      msgRetryCounterCache: new NodeCache({ stdTTL: 0, checkperiod: 0 }),
      userDevicesCache: new NodeCache({ stdTTL: 0, checkperiod: 0 }),
      cachedGroupMetadata: async jid => peekGroupMetadata(jid),
      version,
      defaultQueryTimeoutMs: 30_000,
      keepAliveIntervalMs: 55_000,
      maxIdleTimeMs: 60_000
    })

    socket.isInit = false
    socket.ev.on('creds.update', saveCreds)
    setupGroupEvents(socket)

    let pairingCodeRequested = false
    socket.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
      if (connection === 'open') {
        socket.isInit = true
        socket.userId = cleanId(socket.user?.id) || id
        socket.uptime = Date.now()
        retryCounters.delete(id)

        const duplicate = globalThis.conns.find(candidate => candidate !== socket && candidate.userId === socket.userId)
        if (duplicate) return closeSocket(socket)
        globalThis.conns.push(socket)

        if (!globalThis.conn?.user) {
          updateHealth('whatsapp', { connected: true, status: 'subbot_connected', changedAt: new Date().toISOString() })
        }

        if (isCode && m?.chat && senderId?.endsWith('@s.whatsapp.net')) {
          const ownerName = state.creds.me?.name || '-'
          const channel = globalThis.info?.nna2 || ''
          await parentConnection?.sendMessage(m.chat, {
            text: `*Conectado exitosamente con WhatsApp*\n\n*Bot:* +${socket.userId}\n*Dueno:* ${ownerName}${channel ? `\n\n${channel}` : ''}`
          }, { quoted: m }).catch(() => {})
          delete commandFlags[senderId]
        }
        console.log(chalk.bold.cyanBright(`\nSUB-BOT CONECTADO: ${socket.userId}`))

        try {
          const pais = paisDesdeNumero(socket.userId)
          const ownerName = state.creds.me?.name || '-'
          const fecha = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
          const aviso = `◉ Nuevo SubBot conectado 🤖\n◉ Bot: wa.me/${socket.userId}\n◉ País: ${pais.nombre} ${pais.bandera}\n◉ Dueño: ${ownerName}\n◉ Fecha: ${fecha}`
          await (globalThis.conn || parentConnection)?.sendMessage(canalNotificaciones(), { text: aviso }).catch(() => {})
        } catch {}
      }

      if (connection === 'close') {
        globalThis.conns = globalThis.conns.filter(candidate => candidate !== socket)
        const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.reason || 0
        closeSocket(socket)

        if ([401, 403, DisconnectReason.loggedOut, DisconnectReason.connectionReplaced].includes(reason)) {
          retryCounters.delete(id)
          console.error(`[SUB-BOT ${id}] Sesion no autorizada o reemplazada (codigo ${reason}). Se conserva sin reintentar.`)
          return
        }

        const attempts = (retryCounters.get(id) || 0) + 1
        retryCounters.set(id, attempts)
        if (!transientReasons.has(reason) || attempts > 10) {
          console.error(`[SUB-BOT ${id}] Conexion cerrada (codigo ${reason}); reintentos agotados.`)
          return
        }

        const delay = Math.min(30_000, 2_000 * (2 ** Math.min(attempts - 1, 4)))
        console.log(`[SUB-BOT ${id}] Reconectando en ${delay / 1000}s (intento ${attempts}/10).`)
        managedTimeout(
          () => startSubBot(m, parentConnection, caption, isCode, id, chatId, {}),
          delay
        )
      }

      if (qr && !isCode && m && parentConnection && commandFlags[senderId]) {
        try {
          const qrBuffer = await qrcode.toBuffer(qr, { scale: 8 })
          const sent = await parentConnection.sendMessage(m.chat, { image: qrBuffer, caption }, { quoted: m })
          delete commandFlags[senderId]
          managedTimeout(() => parentConnection.sendMessage(m.chat, { delete: sent.key }).catch(() => {}), 60_000)
        } catch (error) {
          console.error('[subbot] No se pudo entregar el QR:', error)
        }
      }

      if (qr && isCode && phone && parentConnection && chatId && commandFlags[senderId] && !pairingCodeRequested) {
        pairingCodeRequested = true
        try {
          let code = await socket.requestPairingCode(id)
          code = code.match(/.{1,4}/g)?.join('-') || code
          const sent = await parentConnection.sendMessage(chatId, { text: `${caption}\n\n${code}`.trim() }, { quoted: m })
          delete commandFlags[senderId]
          managedTimeout(() => parentConnection.sendMessage(chatId, { delete: sent.key }).catch(() => {}), 60_000)
        } catch (error) {
          pairingCodeRequested = false
          console.error('[subbot] No se pudo generar el codigo:', error)
        }
      }
    })

    socket.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return
      for (const message of messages) {
        if (!message.message) continue
        const startedAt = Math.floor((socket.uptime || Date.now()) / 1000)
        const timestamp = Number(message.messageTimestamp || 0)
        if (timestamp < startedAt || Date.now() / 1000 - timestamp > 120) continue
        if (ignoredBotPrefixes.some(prefix => message.key.id?.startsWith(prefix))) continue
        try {
          await handler(socket, message)
        } catch (error) {
          console.error('[subbot] Error procesando mensaje:', error)
        }
      }
    })

    socket.ev.on('call', async calls => {
      for (const call of calls) {
        try {
          await callUpdate(socket, call)
        } catch (error) {
          console.error('[subbot] Error procesando llamada:', error)
        }
      }
    })

    return socket
  } finally {
    starting.delete(id)
  }
}

function setupGroupEvents(socket) {
  socket.ev.on('group-participants.update', async update => {
    invalidateGroupMetadata(update?.id)
    try {
      await participantsUpdate(socket, update)
    } catch (error) {
      console.error('[subbot] Error procesando participantes:', error)
    }
  })

  socket.ev.on('groups.update', async updates => {
    for (const update of updates) {
      invalidateGroupMetadata(update?.id)
      try {
        await groupsUpdate(socket, update)
      } catch (error) {
        console.error('[subbot] Error procesando grupo:', error)
      }
    }
  })
}
