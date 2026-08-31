import { createHash } from 'node:crypto'

const operationPrefix = 'kantu-query-v1\0'

export function canonicalizeQuery(text) {
  if (typeof text !== 'string') throw new TypeError('La consulta debe ser texto.')
  let canonical = text.replaceAll('\r\n', '\n').trim()
  if (canonical.endsWith(';')) canonical = canonical.slice(0, -1).trimEnd()
  if (!canonical) throw new Error('La consulta esta vacia.')
  return canonical
}

export function queryOperationId(text) {
  const canonical = canonicalizeQuery(text)
  return createHash('sha256').update(operationPrefix).update(canonical).digest('hex')
}
