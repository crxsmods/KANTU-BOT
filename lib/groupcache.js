// ════════════════════════════════════════════════════════════════════════
// lib/groupcache.js — Caché compartida de metadata de grupos
// ────────────────────────────────────────────────────────────────────────
// Antes había tres cachés distintas y ninguna servía:
//   - main.js creaba un NodeCache y lo pasaba como `cachedGroupMetadata`,
//     pero nunca se le hacía .set(), así que siempre devolvía undefined.
//   - handler.js tenía su propio Map, con TTL solo en una de las tres
//     rutas que lo escribían (las otras dos nunca caducaban).
//   - lib/simple.js llamaba a conn.groupMetadata() sin caché en CADA
//     mensaje de grupo.
// Ahora hay una sola, con TTL real y deduplicación de peticiones en vuelo.
// ════════════════════════════════════════════════════════════════════════

import NodeCache from 'node-cache'

const TTL_SECONDS = 300
const cache = new NodeCache({ stdTTL: TTL_SECONDS, checkperiod: 60, useClones: false })

// Peticiones en curso, para que N mensajes simultáneos del mismo grupo
// disparen UNA sola consulta en vez de N.
const inflight = new Map()

const isGroupJid = jid => typeof jid === 'string' && jid.endsWith('@g.us')

// Lectura sincrónica sin ir a la red. Es lo que Baileys necesita para su
// opción `cachedGroupMetadata`.
export function peekGroupMetadata(jid) {
  return isGroupJid(jid) ? cache.get(jid) : undefined
}

export function setGroupMetadata(jid, metadata) {
  if (isGroupJid(jid) && metadata) cache.set(jid, metadata)
  return metadata
}

export function invalidateGroupMetadata(jid) {
  if (isGroupJid(jid)) cache.del(jid)
  else if (!jid) cache.flushAll()
}

// Lectura con caché. Devuelve null si el grupo no se puede consultar
// (el bot ya no está dentro, sin permisos, error de red...).
export async function getGroupMetadata(conn, jid) {
  if (!isGroupJid(jid) || typeof conn?.groupMetadata !== 'function') return null

  const cached = cache.get(jid)
  if (cached) return cached

  const pending = inflight.get(jid)
  if (pending) return pending

  const request = (async () => {
    try {
      return setGroupMetadata(jid, await conn.groupMetadata(jid))
    } catch {
      return null
    } finally {
      inflight.delete(jid)
    }
  })()

  inflight.set(jid, request)
  return request
}

export function groupCacheStats() {
  return { entradas: cache.keys().length, enVuelo: inflight.size, ttlSegundos: TTL_SECONDS }
}
