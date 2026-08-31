import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { runFfmpeg } from './ffmpeg.js'
import { runtimePaths } from './paths.js'

const safeExtension = value => String(value || 'bin').replace(/[^a-z0-9]/gi, '').slice(0, 10) || 'bin'

async function ffmpeg(buffer, args = [], ext = '', ext2 = '') {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw new TypeError('FFmpeg requiere un Buffer no vacío.')
  await fs.mkdir(runtimePaths.tmp, { recursive: true })

  const id = randomUUID()
  const tmpFile = join(runtimePaths.tmp, `${id}.${safeExtension(ext)}`)
  const outFile = join(runtimePaths.tmp, `${id}.${safeExtension(ext2)}`)

  try {
    await fs.writeFile(tmpFile, buffer, { flag: 'wx' })
    await runFfmpeg(['-nostdin', '-hide_banner', '-loglevel', 'error', '-y', '-i', tmpFile, ...args, outFile])
    const data = await fs.readFile(outFile)
    return { data, filename: outFile, delete: async () => {} }
  } finally {
    await Promise.all([
      fs.unlink(tmpFile).catch(() => {}),
      fs.unlink(outFile).catch(() => {})
    ])
  }
}

function toPTT(buffer, ext) {
  return ffmpeg(buffer, [
    '-vn',
    '-c:a', 'libopus',
    '-b:a', '128k',
    '-vbr', 'on',
  ], ext, 'ogg');
}

function toAudio(buffer, ext) {
  return ffmpeg(buffer, [
    '-vn',
    '-c:a', 'libopus',
    '-b:a', '128k',
    '-vbr', 'on',
    '-compression_level', '10',
  ], ext, 'opus');
}

function toVideo(buffer, ext) {
  return ffmpeg(buffer, [
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-ab', '128k',
    '-ar', '44100',
    '-crf', '32',
    '-preset', 'slow',
  ], ext, 'mp4');
}

export {
  ffmpeg,
  toPTT,
  toAudio,
  toVideo,
};
