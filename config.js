import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import fs from 'fs'

//owner
global.owner = [
['5217121649714'],
['5217121649714'],
['5217121649714'],
['5217121649714'],
['5217121649714']
]

//Información 
globalThis.info = {
wm: "ᴋᴀɴᴛᴜ - ʙᴏᴛ",
vs: "3.1",
packname: "ᴋᴀɴᴛᴜ - ʙᴏᴛ\n\n\n\n\n",
author: "Owner: @CrxsMods",
apis: "https://api.delirius.store",
apikey: "GataDios",
fgmods: { url: 'https://api.fgmods.xyz/api', key: 'elrebelde21' },
neoxr: { url: 'https://api.neoxr.eu/api', key: 'russellxz' },
img2: "https://upload.hackstorex.com/uploads/378d0128dc220b4859ce4e09d5b90a2b.jpg",
img4: fs.readFileSync('./media/Menu2.jpg'),
yt: "https://www.youtube.com/@HackStoreX",
tiktok: "https://www.tiktok.com/@rawleys_ofc",
md: "https://github.com/crxsmods/KANTU-BOT",
fb: "https://wa.me/5217121649714",
ig: "https://www.instagram.com/crxs_ofc",
nn: "https://chat.whatsapp.com/BO7qWoncCOgJfFNfUek89f", //Grupo HackStoreX
nn2: "https://chat.whatsapp.com/DS3SEC6yb5A2QK8NniGlDr", //Grupo Kantu Bot 
nn3: "https://chat.whatsapp.com/DS3SEC6yb5A2QK8NniGlDr", //Grupo Kantu Bot 
nn4: "https://chat.whatsapp.com/Bzo7jcdivDGJc3thZrSyEC", //Grupo Swallox 
nn5: "https://whatsapp.com/channel/0029Va8x5C859PwOvKnIri3Z", //Canal HackStoreX 
nn6: "https://chat.whatsapp.com/Bzo7jcdivDGJc3thZrSyEC", //Hosting
nna: "https://whatsapp.com/channel/0029Vatpz6a0QeafN2T8K838", // canal Kantu 
nna2: "https://whatsapp.com/channel/0029Vb6I6zTEQIanas9U0N2I" // canal Swallox 
}

//----------------------------------------------------

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("Update 'config.js'"))
  import(`${file}?update=${Date.now()}`)
})
