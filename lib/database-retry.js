const retryableCodes = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'EHOSTUNREACH',
  'ENETUNREACH',
  '57P01',
  '57P02',
  '57P03'
])

const retryableMessage = /connection (?:terminated unexpectedly|closed)|connection timeout|timeout expired|server closed the connection/i

export function isRetryableDatabaseError(error) {
  if (!error) return false
  if (retryableCodes.has(error.code) || retryableMessage.test(error.message || '')) return true
  if (Array.isArray(error.errors)) return error.errors.some(isRetryableDatabaseError)
  return error.cause && error.cause !== error ? isRetryableDatabaseError(error.cause) : false
}

export async function connectWithRetry(connect, options = {}) {
  const attempts = Math.max(1, Math.floor(options.attempts || 5))
  const baseDelayMs = Math.max(0, Math.floor(options.baseDelayMs ?? 1_000))
  const maxDelayMs = Math.max(baseDelayMs, Math.floor(options.maxDelayMs ?? 30_000))
  const sleep = options.sleep || (delayMs => new Promise(resolve => setTimeout(resolve, delayMs)))

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await connect()
    } catch (error) {
      if (attempt === attempts || !isRetryableDatabaseError(error)) throw error
      const delayMs = Math.min(baseDelayMs * (2 ** (attempt - 1)), maxDelayMs)
      options.onRetry?.({ attempt, attempts, delayMs, error })
      await sleep(delayMs)
    }
  }

  throw new Error('No fue posible conectar con PostgreSQL.')
}
