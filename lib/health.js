import http from 'node:http'
import { getIntegrationStatus, validateRequiredIntegrations } from './integrations.js'

const startedAt = new Date()
const state = {
  database: { ready: false, error: null },
  plugins: { ready: false, loaded: 0, expected: 0, error: null },
  whatsapp: { connected: false, status: 'starting', changedAt: startedAt.toISOString() },
  ffmpeg: { required: process.env.REQUIRE_FFMPEG !== 'false', available: null, error: null },
  shuttingDown: false,
  fatalError: null
}

let server = null

export function updateHealth(section, update) {
  if (section === 'shuttingDown' || section === 'fatalError') {
    state[section] = update
    return
  }
  if (!state[section] || typeof update !== 'object') throw new Error(`Sección de salud inválida: ${section}`)
  state[section] = { ...state[section], ...update }
}

export function healthSnapshot() {
  const requiredIntegrations = validateRequiredIntegrations()
  const checks = {
    database: state.database.ready,
    plugins: state.plugins.ready,
    whatsapp: state.whatsapp.connected,
    ffmpeg: !state.ffmpeg.required || state.ffmpeg.available === true,
    integrations: requiredIntegrations.missing.length === 0 && requiredIntegrations.unknown.length === 0,
    shuttingDown: !state.shuttingDown,
    fatalError: !state.fatalError
  }
  return {
    status: Object.values(checks).every(Boolean) ? 'ready' : state.shuttingDown ? 'stopping' : 'not_ready',
    version: '2.2.0',
    startedAt: startedAt.toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    checks,
    database: state.database,
    plugins: state.plugins,
    whatsapp: state.whatsapp,
    ffmpeg: state.ffmpeg,
    integrations: getIntegrationStatus(),
    requiredIntegrations,
    fatalError: state.fatalError
  }
}

const json = (response, statusCode, body) => {
  const payload = Buffer.from(JSON.stringify(body))
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': payload.length,
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  })
  response.end(payload)
}

export async function startHealthServer() {
  if (server) return server
  const production = process.env.NODE_ENV === 'production'
  const enabled = process.env.HEALTH_ENABLED === 'true' || (production && process.env.HEALTH_ENABLED !== 'false')
  if (!enabled) return null

  const port = Number.parseInt(process.env.HEALTH_PORT || '3000', 10)
  const host = process.env.HEALTH_HOST?.trim() || '0.0.0.0'
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('HEALTH_PORT no es válido.')

  server = http.createServer((request, response) => {
    const pathname = new URL(request.url || '/', 'http://health.local').pathname
    if (request.method !== 'GET') return json(response, 405, { status: 'method_not_allowed' })
    if (pathname === '/health/live') {
      return json(response, state.shuttingDown || state.fatalError ? 503 : 200, {
        status: state.shuttingDown ? 'stopping' : state.fatalError ? 'failed' : 'alive',
        uptimeSeconds: Math.floor(process.uptime())
      })
    }
    if (pathname === '/health/ready' || pathname === '/health') {
      const snapshot = healthSnapshot()
      return json(response, snapshot.status === 'ready' ? 200 : 503, snapshot)
    }
    return json(response, 404, { status: 'not_found' })
  })
  server.requestTimeout = 5_000
  server.headersTimeout = 6_000
  server.keepAliveTimeout = 2_000

  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, host, () => {
      server.off('error', reject)
      resolve()
    })
  })
  const address = server.address()
  console.log(`[health] Escuchando en ${typeof address === 'object' ? `${address.address}:${address.port}` : address}.`)
  return server
}

export async function stopHealthServer() {
  if (!server) return
  const current = server
  server = null
  await new Promise(resolve => current.close(() => resolve()))
}
