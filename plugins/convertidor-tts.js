import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { spawn } from "child_process"
import gTTS from "node-gtts"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const TMP_DIR = path.join(__dirname, "../tmp")
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true })

const handler = async (m, { conn, args, usedPrefix, command }) => {
    // Mensaje de uso profesional y organizado
    const usage = `「 🎙️ *SÍNTESIS DE VOZ* 」\n\n` +
        `> _Convierte texto en audio con diferentes efectos o idiomas._\n\n` +
        `🔹 *MODOS DISPONIBLES:* \n` +
        `↳ _anonymous, robot, grave, aguda, niño, demonio_\n\n` +
        `🌐 *IDIOMAS:* \n` +
        `↳ _es (Español), en (Inglés), pt (Portugués), fr (Francés), etc._\n\n` +
        `📌 *USO:* \n` +
        `↳ ${usedPrefix + command} <modo|idioma> <texto>\n\n` +
        `💡 *EJEMPLO:* \n` +
        `↳ ${usedPrefix + command} robot Hola, soy un bot.`

    if (!args.length && !m.quoted?.text) return m.reply(usage)

    m.react("🎙️")
    conn.sendPresenceUpdate('recording', m.chat)   

    const first = args[0].toLowerCase()
    const voces = ["anonymous", "robot", "grave", "aguda", "niño", "demonio"]
    let effect = null, lang = "es", text = ""

    // Lógica de detección de parámetros
    if (voces.includes(first)) {
        effect = first
        text = args.slice(1).join(" ")
    } else if (/^[a-z]{2}$/.test(first)) {
        lang = first
        text = args.slice(1).join(" ")
    } else {
        text = args.join(" ")
    }

    if (!text) return m.reply("「⚠️」 *Por favor, ingresa el texto que deseas convertir.*")

    try {
        const wav = await synthTTS(text, lang)
        const ogg = await applyEffect(wav, effect)
        const buffer = fs.readFileSync(ogg)

        await conn.sendMessage(m.chat, { 
            audio: buffer, 
            mimetype: "audio/ogg; codecs=opus", 
            ptt: true 
        }, { quoted: m })

        // Limpieza de archivos temporales
        fs.unlinkSync(wav)
        fs.unlinkSync(ogg)
        
    } catch (e) {
        console.error(e)
        m.reply("「❌」 *Error:* No se pudo procesar la síntesis de voz.")
    }
}

handler.help = ["tts <modo> <texto>"]
handler.tags = ["convertidor"]
handler.command = /^g?tts$/i
handler.register = true

export default handler

// --- FUNCIONES AUXILIARES ---

function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", args)
    let stderr = ""
    ff.stderr.on("data", (d) => (stderr += d.toString()))
    ff.on("close", (code) => {
      if (code === 0) resolve(true)
      else reject(new Error("FFmpeg error: " + stderr))
    })
  })
}

async function synthTTS(text, lang = "es") {
  const outPath = path.join(TMP_DIR, `${Date.now()}-raw.wav`)
  const tts = gTTS(lang)
  await new Promise((res, rej) => {
    tts.save(outPath, text, (err) => (err ? rej(err) : res()))
  })
  return outPath
}

async function applyEffect(inputWav, style = null) {
  const outPath = path.join(TMP_DIR, `${Date.now()}-out.ogg`)
  const styleFilters = {
    anonymous: "asetrate=44100*0.75,lowpass=f=1400,highpass=f=180",
    robot: "chorus=0.6:0.9:55:0.4:0.25:2",
    grave: "asetrate=44100*0.80",
    aguda: "asetrate=44100*1.20",
    niño: "asetrate=44100*1.25,treble=g=5",
    demonio: "asetrate=44100*0.65,areverb=70:70:100",
  }
  const af = style && styleFilters[style] ? styleFilters[style] : "anull"
  const args = [
    "-y", "-i", inputWav,
    "-af", af,
    "-ac", "1", "-ar", "48000",
    "-c:a", "libopus", "-b:a", "48k",
    outPath,
  ]
  await runFFmpeg(args)
  return outPath
}
