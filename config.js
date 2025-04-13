import { watchFile, unwatchFile } from 'fs' 
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import fs from 'fs'
import cheerio from 'cheerio'
import fetch from 'node-fetch'
import axios from 'axios'
import moment from 'moment-timezone' 

//---------[ Añada los numeros a ser Propietario/a ]---------

global.owner = [['5217121649714', 'ＰＲＯＰＩＥＴＡＲＩＯ', true], ['51979334798'], ['595986172767'], ['5215656088756'], ['5217121649714']]
global.mods = []
global.prems = []
//BETA: Si quiere evitar escribir el número que será bot en la consola, agregué desde aquí entonces:
global.botNumberCode = "" //Ejemplo: +5217121649714
global.confirmCode = "" 
global.gataJadibts = true //cambia a false Desactivar en "auto-reconexion" de sub-bots

//---------[ APIS GLOBAL ]---------

global.baileys = '@whiskeysockets/baileys'
global.apis = 'https://delirius-apiofc.vercel.app'

global.APIs = { lolhuman: { url: 'https://api.lolhuman.xyz/api/', key: 'GataDiosV3' },
skizo: { url: 'https://skizo.tech/api/', key: 'GataDios' },
alyachan: { url: 'https://api.alyachan.dev/api/', key: null }, 
neoxr: { url: 'https://api.neoxr.eu/api', key: 'GataDios' },
fgmods: { url: 'https://api.fgmods.xyz/api', key: 'elrebelde21' },
popcat: { url: 'https://api.popcat.xyz', key: null }}

global.cheerio = cheerio
global.fs = fs
global.fetch = fetch
global.axios = axios
global.moment = moment	

//------------------------[ Stickers ]-----------------------------

global.packname = 'KantuBot'
global.author = 'CrxsMods'

//------------[ Versión | Nombre | cuentas ]------------

global.wm = 'ᴋᴀɴᴛᴜ - ʙᴏᴛ' 
global.botname = '𝐊𝐚𝐧𝐭𝐮 - 𝐁𝐨𝐭'
global.vs = '1.9.5'
global.yt = 'https://www.youtube.com/@crxsmods'
global.tiktok = 'tiktok.com/@rawleys_ofc'
global.md = 'https://github.com/crxsmods'
global.fb = 'wa.me/5217121649714'
global.face = 'https://t.me/CrxsMods'

global.nna = 'https://chat.whatsapp.com/BO7qWoncCOgJfFNfUek89f' //Update
global.nna2 = 'https://chat.whatsapp.com/FAwooQ3yBlx0PSsUtXpQup' //KantuBot update
global.nnaa = 'https://whatsapp.com/channel/0029Vatpz6a0QeafN2T8K838' //KantuBot - Test
global.nn = 'https://chat.whatsapp.com/BO7qWoncCOgJfFNfUek89f' //Grupo 1
global.nnn = 'https://chat.whatsapp.com/CSRUKqOoTCNJkWnDt7QDHv' //Grupo 2
global.nnnt = 'https://chat.whatsapp.com/CSRUKqOoTCNJkWnDt7QDHv' //Grupo del Colaboracion
global.nnnt2 = 'https://chat.whatsapp.com/FAwooQ3yBlx0PSsUtXpQup' // Grupo COL 2
global.nnntt = 'https://chat.whatsapp.com/FAwooQ3yBlx0PSsUtXpQup' //Grupo COL 3
global.nnnttt = 'https://whatsapp.com/channel/0029VaaUgjW3mFY9DyxpWB0n' //enlace Kantubot
global.nnntttt = 'https://whatsapp.com/channel/0029Vatpz6a0QeafN2T8K838' //Grupo ayuda sobre el bot
global.bot = 'wa.me/5217121649714'
global.asistencia = `${fb}`
global.redes = [nna, nna2, yt, nn, nnn, nnnt, nnnttt, md, tiktok, fb, nnn, face]

//------------------------[ Info | Datos ]---------------------------

global.wait = 'Espera Un Momento\n\n> *❗Por favor no hacer spam👏❗*'
global.waitt = '*⌛ _Cargando..._ ▬▬▭▭▭*'
global.waittt = '*⌛ _Cargando..._ ▬▬▬▬▭▭*'
global.waitttt = '*⌛ _Cargando..._ ▬▬▬▬▬▬▭*'
global.waittttt = '*⌛ _Cargando..._ ▬▬▬▬▬▬▬*'
global.rg = '『✅ 𝙍𝙀𝙎𝙐𝙇𝙏𝘼𝘿𝙊𝙎 ✅』\n\n'
global.ag = '『⚠️ 𝘼𝘿𝙑𝙀𝙍𝙏𝙀𝙉𝘾𝙄𝘼 ⚠️』\n\n'
global.iig = '『❕ 𝙄𝙉𝙁𝙊𝙍𝙈𝘼𝘾𝙄𝙊𝙉 』\n\n'
global.fg = '『❌ 𝙀𝙍𝙍𝙊𝙍 ❌』\n\n'
global.mg = '『❗️ 𝙇𝙊 𝙐𝙎𝙊 𝙈𝘼𝙇❗』\n\n'
global.eeg = '『📩 𝙍𝙀𝙋𝙊𝙍𝙏𝙀 📩』\n\n'
global.eg = '『💚 𝙀𝙓𝙄𝙏𝙊 💚』\n\n'

//-------------------------[ IMAGEN ]------------------------------
//global.img = "https://qu.ax/Zgqq.jpg"
global.img1 = 'https://qu.ax/hNJk.jpg'
global.img2 = 'https://qu.ax/jzhN.jpg'

global.imagen = fs.readFileSync('./Menu2.jpg')
global.imagen1 = fs.readFileSync('./media/Menu1.jpg')
global.imagen2 = fs.readFileSync('./media/Menu2.jpg')
global.imagen3 = fs.readFileSync('./media/Menu3.jpg')
global.imagen4 = fs.readFileSync('./media/Menu4.jpg')
global.imagen5 = 'https://qu.ax/rULv.jpg'
global.imagen6 = 'https://qu.ax/CySs.jpg'
global.menu18 = 'https://qu.ax/MOgO.jpg'
global.vid1 = 'https://qu.ax/dcAc.mp4'
global.img = [imagen, imagen1, imagen2, imagen3, imagen4]
global.imageUrl = ["https://qu.ax/HJnWj.jpg", "https://qu.ax/ehPzQ.jpg", "https://qu.ax/ilfbC.jpg"]

//----------------------------[ NIVELES | RPG ]---------------------------------

global.multiplier = 850 // Cuanto más alto, más difícil subir de nivel
global.maxwarn = '4' // máxima advertencias

//---------------[ IDs de canales ]----------------

global.ch = {
ch1: '120363371008200788@newsletter', 
ch2: '120363178718483875@newsletter',
ch3: '120363178718483875@newsletter',
ch4: '120363371008200788@newsletter',
ch5: '120363178718483875@newsletter', 
ch6: '120363371008200788@newsletter',
}

//----------------------------------------------------

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("Update 'config.js'"))
  import(`${file}?update=${Date.now()}`)
})
