import { existsSync, readFileSync } from 'node:fs'

export const stripWrappingQuotes = value => {
  const text = String(value || '').trim()
  const first = text[0]
  const last = text.at(-1)
  return text.length >= 2 && first === last && ['"', "'", '`'].includes(first)
    ? text.slice(1, -1)
    : text
}

export const readRawEnvValue = (name, filename = '.env') => {
  if (!existsSync(filename)) return ''
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const matcher = new RegExp(`^\\s*${escaped}\\s*=`)
  const line = readFileSync(filename, 'utf8').split(/\r?\n/).find(entry => matcher.test(entry))
  return line ? stripWrappingQuotes(line.replace(matcher, '')) : ''
}

export const hasCompleteDatabaseAuthority = value => {
  try {
    const parsed = new URL(value)
    return /^postgres(?:ql)?:$/.test(parsed.protocol) && Boolean(parsed.hostname && parsed.username && parsed.password)
  } catch {
    return false
  }
}

const encodePart = value => {
  try {
    return encodeURIComponent(decodeURIComponent(value))
  } catch {
    return encodeURIComponent(value)
  }
}

export const normalizeDatabaseConnectionString = value => {
  const raw = stripWrappingQuotes(value)
  if (hasCompleteDatabaseAuthority(raw)) return raw

  const parts = raw.match(/^(postgres(?:ql)?:\/\/)([^:]+):(.+)@(\[[^\]]+\]|[^/:?#]+)(?::(\d+))?\/([^?]+)(\?.*)?$/i)
  if (!parts) return raw
  const [, protocol, username, password, hostname, port, database, query = ''] = parts
  return `${protocol}${encodePart(username)}:${encodePart(password)}@${hostname}${port ? `:${port}` : ''}/${database}${query}`
}

export function resolveDatabaseUrl() {
  const parsed = process.env.DATABASE_URL?.trim() || ''
  const candidate = hasCompleteDatabaseAuthority(parsed) ? parsed : readRawEnvValue('DATABASE_URL') || parsed
  return normalizeDatabaseConnectionString(candidate)
}
