const env = name => process.env[name]?.trim() || ''

export const integrationConfig = Object.freeze({
  groq: Object.freeze({ apiKey: env('GROQ_API_KEY') }),
  github: Object.freeze({
    token: env('GITHUB_TOKEN'),
    repository: env('GITHUB_REPOSITORY'),
    branch: env('GITHUB_BRANCH') || 'main'
  }),
  acrcloud: Object.freeze({
    host: env('ACRCLOUD_HOST') || 'identify-eu-west-1.acrcloud.com',
    accessKey: env('ACRCLOUD_ACCESS_KEY'),
    accessSecret: env('ACRCLOUD_ACCESS_SECRET')
  }),
  fgmods: Object.freeze({
    url: env('FGMODS_API_URL') || 'https://api.fgmods.xyz/api',
    apiKey: env('FGMODS_API_KEY')
  }),
  neoxr: Object.freeze({
    url: env('NEOXR_API_URL') || 'https://api.neoxr.eu/api',
    apiKey: env('NEOXR_API_KEY') || 'GataDios'
  }),
  alyachan: Object.freeze({
    url: env('ALYACHAN_API_URL') || 'https://api.alyachan.dev/api',
    apiKey: env('ALYACHAN_API_KEY')
  }),
  zenkey: Object.freeze({
    url: env('ZENKEY_API_URL') || 'https://api.zenkey.my.id/api',
    apiKey: env('ZENKEY_API_KEY') || 'zenkey'
  }),
  delirius: Object.freeze({
    url: env('DELIRIUS_API_URL') || 'https://api.delirius.store',
    apiKey: env('DELIRIUS_API_KEY')
  }),
  telegram: Object.freeze({ botToken: env('TELEGRAM_BOT_TOKEN') }),
  tenor: Object.freeze({ apiKey: env('TENOR_API_KEY') }),
  savetube: Object.freeze({ aesKey: env('SAVETUBE_AES_KEY') || 'C5D58EF67A7584E4A29F6C35BBC4EB12' })
})

const configured = Object.freeze({
  groq: () => Boolean(integrationConfig.groq.apiKey),
  github: () => Boolean(integrationConfig.github.token && integrationConfig.github.repository),
  acrcloud: () => Boolean(integrationConfig.acrcloud.accessKey && integrationConfig.acrcloud.accessSecret),
  fgmods: () => Boolean(integrationConfig.fgmods.apiKey),
  neoxr: () => Boolean(integrationConfig.neoxr.apiKey),
  alyachan: () => Boolean(integrationConfig.alyachan.apiKey),
  zenkey: () => Boolean(integrationConfig.zenkey.apiKey),
  delirius: () => Boolean(integrationConfig.delirius.apiKey),
  telegram: () => /^\d{6,}:[A-Za-z0-9_-]{20,}$/.test(integrationConfig.telegram.botToken),
  tenor: () => Boolean(integrationConfig.tenor.apiKey),
  savetube: () => /^[a-f\d]{32}$/i.test(integrationConfig.savetube.aesKey)
})

export function isIntegrationConfigured(name) {
  return configured[name]?.() ?? false
}

export function requireIntegration(name) {
  if (isIntegrationConfigured(name)) return
  const error = new Error(`La integración "${name}" no está configurada en el entorno.`)
  error.code = 'INTEGRATION_NOT_CONFIGURED'
  throw error
}

export function getIntegrationStatus() {
  return Object.fromEntries(Object.keys(configured).map(name => [name, isIntegrationConfigured(name)]))
}

export function getRequiredIntegrations() {
  return [...new Set((process.env.REQUIRED_INTEGRATIONS || '')
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean))]
}

export function validateRequiredIntegrations() {
  const known = new Set(Object.keys(configured))
  const required = getRequiredIntegrations()
  const unknown = required.filter(name => !known.has(name))
  const missing = required.filter(name => known.has(name) && !isIntegrationConfigured(name))
  return { required, missing, unknown }
}
