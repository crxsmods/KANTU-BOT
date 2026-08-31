import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { integrationConfig } from './lib/integrations.js'
import { withRootOwners } from './lib/root-identity.js'

// Antes esto era un fs.readFileSync suelto: si faltaba el archivo, el bot
// entero no arrancaba y el error no decía por qué.
const leerMedia = ruta => {
  try {
    return fs.readFileSync(ruta)
  } catch {
    console.log(chalk.yellowBright(`[config] No se encontró ${ruta}; se continúa sin esa imagen.`))
    return null
  }
}

//owner
const configuredOwners = (process.env.BOT_OWNERS || '')
  .split(',')
  .map(value => value.replace(/[^0-9]/g, ''))
  .filter(Boolean)
global.owner = withRootOwners(configuredOwners).map(number => [number])

const repositoryUrl = process.env.BOT_REPOSITORY_URL || 'https://github.com/crxsmods/KANTU-BOT'
const officialGroupUrl = process.env.BOT_OFFICIAL_GROUP_URL || 'https://chat.whatsapp.com/DS3SEC6yb5A2QK8NniGlDr'
const officialChannelUrl = process.env.BOT_OFFICIAL_CHANNEL_URL || 'https://whatsapp.com/channel/0029Vatpz6a0QeafN2T8K838'

//Información 
globalThis.info = {
wm: "Kantu Bot",
vs: "2.2.0",
packname: "Kantu Bot",
author: "Owner: @CrxsMods",
apis: integrationConfig.delirius.url,
apikey: integrationConfig.delirius.apiKey,
fgmods: { url: integrationConfig.fgmods.url, key: integrationConfig.fgmods.apiKey },
neoxr: { url: integrationConfig.neoxr.url, key: integrationConfig.neoxr.apiKey },
alyachan: { url: integrationConfig.alyachan.url, key: integrationConfig.alyachan.apiKey },
zenkey: { url: integrationConfig.zenkey.url, key: integrationConfig.zenkey.apiKey },
mitzuki: { url: integrationConfig.mitzuki.url, key: integrationConfig.mitzuki.apiKey },
img2: process.env.BOT_IMAGE_URL || '',
img4: leerMedia('./media/Menu2.jpg'),
yt: process.env.BOT_YOUTUBE_URL || repositoryUrl,
tiktok: process.env.BOT_TIKTOK_URL || repositoryUrl,
md: repositoryUrl,
fb: process.env.BOT_CONTACT_URL || repositoryUrl,
ig: process.env.BOT_INSTAGRAM_URL || repositoryUrl,
nn: officialGroupUrl,
nn2: officialGroupUrl,
nn3: officialGroupUrl,
nn4: officialGroupUrl,
nn5: officialChannelUrl,
nn6: officialGroupUrl,
nna: officialChannelUrl,
nna2: officialChannelUrl
}

// Compatibilidad con plugins antiguos. Solo contiene URLs y claves leídas del entorno.
globalThis.APIs = {
  fgmods: globalThis.info.fgmods,
  neoxr: globalThis.info.neoxr,
  alyachan: globalThis.info.alyachan,
  zenkey: globalThis.info.zenkey,
  delirius: { url: globalThis.info.apis, key: globalThis.info.apikey }
}

//----------------------------------------------------

if (process.env.PLUGIN_WATCH === 'true' || (process.env.NODE_ENV !== 'production' && process.env.PLUGIN_WATCH !== 'false')) {
  const file = fileURLToPath(import.meta.url)
  watchFile(file, () => {
    unwatchFile(file)
    console.log(chalk.redBright("Update 'config.js'"))
    import(`${file}?update=${Date.now()}`)
  })
}
