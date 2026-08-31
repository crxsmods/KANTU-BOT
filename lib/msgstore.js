// ════════════════════════════════════════════════════════════════════════
// lib/msgstore.js — Memoria corta de mensajes enviados
// ────────────────────────────────────────────────────────────────────────
// Baileys llama a `getMessage(key)` cuando a un destinatario le falló el
// descifrado y pide que le reenviemos el mensaje original. main.js devolvía
// una cadena vacía (`return ""`), lo que deja el reenvío roto: ese es uno de
// los motivos por los que a otras personas les queda "Esperando este
// mensaje. Puede tardar un poco."
//
// Guardamos los últimos N mensajes que enviamos para poder responder ese
// reintento de verdad. Es un buffer acotado en memoria, no persistente:
// suficiente, porque los reintentos llegan en segundos.
// ════════════════════════════════════════════════════════════════════════

const MAX_MESSAGES = 1000
const store = new Map()

export function rememberMessage(sent) {
  const id = sent?.key?.id
  if (!id || !sent?.message) return sent

  // Map conserva el orden de inserción: la primera clave es la más vieja.
  if (store.size >= MAX_MESSAGES) {
    const oldest = store.keys().next().value
    if (oldest !== undefined) store.delete(oldest)
  }

  store.set(id, sent.message)
  return sent
}

export function recallMessage(key) {
  const id = typeof key === 'string' ? key : key?.id
  return id ? store.get(id) : undefined
}

export function msgStoreStats() {
  return { guardados: store.size, maximo: MAX_MESSAGES }
}
