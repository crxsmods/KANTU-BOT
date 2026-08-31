import dns from 'node:dns/promises'
import http from 'node:http'
import https from 'node:https'
import net from 'node:net'
import fetch from 'node-fetch'

const MAX_REDIRECTS = 3

function isPrivateIpv4(address) {
  const parts = address.split('.').map(Number)
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) return true
  const [a, b] = parts
  return a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
}

function isPrivateIpv6(address) {
  const normalized = address.toLowerCase().split('%')[0]
  if (normalized === '::' || normalized === '::1') return true
  if (normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe8') ||
      normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) return true
  if (normalized.startsWith('ff') || normalized.startsWith('2001:db8') ||
      normalized.startsWith('2001:0:') || normalized.startsWith('2001:0000:') ||
      normalized.startsWith('2001:2:') || normalized.startsWith('2002:') ||
      normalized.startsWith('100:')) return true
  const mapped = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  return mapped ? isPrivateIpv4(mapped[1]) : false
}

export function isPublicIp(address) {
  const family = net.isIP(address)
  if (family === 4) return !isPrivateIpv4(address)
  if (family === 6) return !isPrivateIpv6(address)
  return false
}

export async function validatePublicUrl(input, { allowHttp = false } = {}) {
  let url
  try {
    url = new URL(input)
  } catch {
    throw new Error('La URL no es válida.')
  }

  const protocols = allowHttp ? new Set(['https:', 'http:']) : new Set(['https:'])
  if (!protocols.has(url.protocol)) throw new Error('Solo se permiten URLs HTTPS.')
  if (url.username || url.password) throw new Error('No se permiten credenciales dentro de la URL.')
  if (!url.hostname || url.hostname === 'localhost' || url.hostname.endsWith('.local')) {
    throw new Error('El host de la URL no está permitido.')
  }

  const literalFamily = net.isIP(url.hostname)
  const addresses = literalFamily
    ? [{ address: url.hostname, family: literalFamily }]
    : await dns.lookup(url.hostname, { all: true, verbatim: true })
  const publicAddresses = addresses.filter(entry => isPublicIp(entry.address))
  if (!publicAddresses.length || publicAddresses.length !== addresses.length) {
    throw new Error('La URL resuelve a una red privada o reservada.')
  }

  return { url, address: publicAddresses[0] }
}

function pinnedAgent(url, address) {
  const Agent = url.protocol === 'https:' ? https.Agent : http.Agent
  return new Agent({
    keepAlive: false,
    // Node >= 20 activa autoSelectFamily y llama al lookup con `all: true`,
    // esperando un arreglo de entradas. Responder con el par (address, family)
    // en ese caso hace que net lea `addresses[0].address` como undefined y
    // falle con ERR_INVALID_IP_ADDRESS antes de abrir el socket.
    lookup: (_hostname, options, callback) => {
      if (options?.all) return callback(null, [{ address: address.address, family: address.family }])
      return callback(null, address.address, address.family)
    }
  })
}

export async function safeFetch(input, options = {}) {
  const {
    timeoutMs = 20_000,
    maxRedirects = MAX_REDIRECTS,
    allowHttp = false,
    ...fetchOptions
  } = options
  let current = String(input)
  let previousOrigin = null

  for (let redirects = 0; redirects <= maxRedirects; redirects++) {
    const { url, address } = await validatePublicUrl(current, { allowHttp })
    const headers = new Headers(fetchOptions.headers || {})
    if (previousOrigin && previousOrigin !== url.origin) {
      headers.delete('authorization')
      headers.delete('cookie')
      headers.delete('proxy-authorization')
    }
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
      agent: pinnedAgent(url, address)
    })

    if (![301, 302, 303, 307, 308].includes(response.status)) return response
    const location = response.headers.get('location')
    response.body?.destroy()
    if (!location) throw new Error('La redirección no incluye una ubicación válida.')
    if (redirects === maxRedirects) throw new Error('La URL excedió el máximo de redirecciones.')
    previousOrigin = url.origin
    current = new URL(location, url).toString()
  }

  throw new Error('No se pudo completar la solicitud.')
}

export async function safeFetchBuffer(input, { maxBytes = 25 * 1024 * 1024, ...options } = {}) {
  const response = await safeFetch(input, options)
  if (!response.ok) throw new Error(`La descarga respondió HTTP ${response.status}.`)

  const declaredLength = Number(response.headers.get('content-length') || 0)
  if (declaredLength > maxBytes) {
    response.body?.destroy()
    throw new Error(`El archivo supera el límite de ${maxBytes} bytes.`)
  }

  const chunks = []
  let total = 0
  for await (const chunk of response.body) {
    total += chunk.length
    if (total > maxBytes) {
      response.body.destroy()
      throw new Error(`El archivo supera el límite de ${maxBytes} bytes.`)
    }
    chunks.push(chunk)
  }
  return Buffer.concat(chunks, total)
}
