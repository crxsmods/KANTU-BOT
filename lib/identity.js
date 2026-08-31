// ════════════════════════════════════════════════════════════════════════
// lib/identity.js — Quién es quién
// ────────────────────────────────────────────────────────────────────────
// WhatsApp direcciona a los usuarios de dos formas a la vez: por número
// (@s.whatsapp.net) y por LID (@lid). El LID NO se deriva del número: es un
// identificador opaco, así que la única forma de relacionarlos es el par que
// WhatsApp manda en la key (participant / participantAlt) o el que ya
// tengamos guardado en la tabla `usuarios`.
//
// Todo el control de permisos del bot depende de resolver esto bien, por eso
// vive en un solo lugar en vez de repetirse en cada archivo.
// ════════════════════════════════════════════════════════════════════════

import { db } from './postgres.js'

export const cleanJid = (jid = '') => String(jid || '').replace(/:\d+/, '')
export const onlyDigits = (value = '') => String(value ?? '').split('@')[0].replace(/[^0-9]/g, '')

// Resuelve la identidad del remitente de un mensaje.
// Devuelve el JID de número, el LID, el JID canónico a usar como clave
// primaria en la base, y el número en crudo.
export function resolveSenderIdentity(m, conn) {
  const key = m?.key || {}
  const isGroup = typeof key.remoteJid === 'string' && key.remoteJid.endsWith('@g.us')

  if (key.fromMe) {
    const self = cleanJid(conn?.user?.id || '')
    return {
      phoneJid: self.endsWith('@s.whatsapp.net') ? self : '',
      lidJid: cleanJid(conn?.user?.lid || ''),
      resolvedJid: self,
      num: onlyDigits(self) || null
    }
  }

  // En un grupo, remoteJid es el grupo: solo participant* identifica a la
  // persona. En privado sí sirve remoteJid.
  const candidates = isGroup
    ? [key.participantAlt, key.participant, key.senderLid]
    : [key.participantAlt, key.participant, key.senderLid, key.remoteJidAlt, key.remoteJid]

  const clean = candidates
    .filter(value => typeof value === 'string' && value.includes('@'))
    .map(cleanJid)

  const phoneJid = clean.find(value => value.endsWith('@s.whatsapp.net')) || ''
  const lidJid = clean.find(value => value.endsWith('@lid')) || ''
  const resolvedJid = phoneJid || lidJid || cleanJid(key.remoteJid || '')

  return { phoneJid, lidJid, resolvedJid, num: onlyDigits(phoneJid || resolvedJid) || null }
}

// Todas las identidades conocidas del remitente, para comparar permisos sin
// que importe si WhatsApp lo direccionó por número o por LID.
export function senderIdentities(m) {
  const key = m?.key || {}
  const isGroup = typeof key.remoteJid === 'string' && key.remoteJid.endsWith('@g.us')

  const raw = [
    m?.sender,
    m?.lid,
    m?.user?.id,
    m?.user?.lid,
    key.participant,
    key.participantAlt,
    key.senderLid,
    ...(isGroup ? [] : [key.remoteJid, key.remoteJidAlt])
  ]

  return [...new Set(
    raw.filter(value => typeof value === 'string' && value.includes('@')).map(cleanJid)
  )]
}

// ── Owners ──────────────────────────────────────────────────────────────
// Única fuente de verdad: global.owner, definido en config.js.

export function ownerNumbers() {
  const raw = Array.isArray(globalThis.owner) ? globalThis.owner : []
  return [...new Set(raw.flat(Infinity).map(onlyDigits).filter(Boolean))]
}

export function ownerJids() {
  return ownerNumbers().map(number => `${number}@s.whatsapp.net`)
}

// Los LID de los owners no se pueden calcular, se consultan. Cacheados para
// no pegarle a la base en cada mensaje.
const OWNER_LID_TTL = 5 * 60 * 1000
let ownerLidCache = { at: 0, values: new Set() }

export function invalidateOwnerLids() {
  ownerLidCache = { at: 0, values: new Set() }
}

export async function ownerLids() {
  if (ownerLidCache.at && Date.now() - ownerLidCache.at < OWNER_LID_TTL) return ownerLidCache.values

  const numbers = ownerNumbers()
  if (!numbers.length) {
    ownerLidCache = { at: Date.now(), values: new Set() }
    return ownerLidCache.values
  }

  try {
    const { rows } = await db.query(
      'SELECT lid FROM usuarios WHERE num = ANY($1::text[]) AND lid IS NOT NULL',
      [numbers]
    )
    ownerLidCache = { at: Date.now(), values: new Set(rows.map(row => cleanJid(row.lid))) }
  } catch (error) {
    console.error('[identity] No se pudieron leer los LID de los owners:', error.message)
    // Conservamos lo último bueno en vez de quedarnos sin owners.
    ownerLidCache = { at: Date.now(), values: ownerLidCache.values }
  }

  return ownerLidCache.values
}

// ¿El remitente es uno de los owners de config.js?
// Reconoce tanto el número como el LID equivalente.
export async function isOwnerSender(m) {
  const identities = senderIdentities(m)
  if (!identities.length) return false

  const numbers = new Set(ownerNumbers())
  const byNumber = identities.some(
    id => id.endsWith('@s.whatsapp.net') && numbers.has(onlyDigits(id))
  )
  if (byNumber) return true

  const lids = identities.filter(id => id.endsWith('@lid'))
  if (!lids.length) return false

  const known = await ownerLids()
  return lids.some(id => known.has(id))
}
