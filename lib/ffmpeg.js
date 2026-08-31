import { spawn } from 'node:child_process'

export const FFMPEG_PATH = process.env.FFMPEG_PATH?.trim() || 'ffmpeg'

export function runFfmpeg(args, { timeoutMs = 120_000 } = {}) {
  if (!Array.isArray(args) || args.some(value => typeof value !== 'string')) {
    throw new TypeError('Los argumentos de FFmpeg deben ser un arreglo de strings.')
  }

  return new Promise((resolve, reject) => {
    const child = spawn(FFMPEG_PATH, args, {
      windowsHide: true,
      shell: false,
      stdio: ['ignore', 'ignore', 'pipe']
    })
    let stderr = ''
    let settled = false

    const finish = (error, result) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (error) reject(error)
      else resolve(result)
    }

    child.stderr.on('data', chunk => {
      stderr = (stderr + chunk.toString()).slice(-64 * 1024)
    })

    child.once('error', error => {
      const wrapped = new Error(
        error.code === 'ENOENT'
          ? `FFmpeg no está instalado o FFMPEG_PATH no es válido (${FFMPEG_PATH}).`
          : `No se pudo ejecutar FFmpeg: ${error.message}`,
        { cause: error }
      )
      wrapped.code = error.code === 'ENOENT' ? 'FFMPEG_NOT_FOUND' : 'FFMPEG_START_FAILED'
      finish(wrapped)
    })

    child.once('close', code => {
      if (code === 0) return finish(null, { code, stderr })
      const error = new Error(`FFmpeg terminó con código ${code}: ${stderr.trim().slice(-2000)}`)
      error.code = 'FFMPEG_FAILED'
      finish(error)
    })

    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      const error = new Error(`FFmpeg excedió el límite de ${timeoutMs} ms.`)
      error.code = 'FFMPEG_TIMEOUT'
      finish(error)
    }, timeoutMs)
    timer.unref?.()
  })
}

export async function checkFfmpeg() {
  try {
    const { stderr } = await runFfmpeg(['-version'], { timeoutMs: 10_000 })
    return { available: true, path: FFMPEG_PATH, version: stderr.split(/\r?\n/, 1)[0] || 'ffmpeg' }
  } catch (error) {
    return { available: false, path: FFMPEG_PATH, error: error.message }
  }
}
