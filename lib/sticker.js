import crypto from 'node:crypto'
import { fileTypeFromBuffer } from 'file-type'
import webp from 'node-webpmux'
import { ffmpeg } from './converter.js'
import { safeFetchBuffer } from './safe-fetch.js'

async function resolveInput(img, url) {
  if (Buffer.isBuffer(img) && img.length) return img
  if (url) return safeFetchBuffer(url, { maxBytes: 30 * 1024 * 1024, allowHttp: false })
  throw new Error('No se recibió contenido para generar el sticker.')
}

async function convertToWebp(img, url, { maxSeconds = 6, size = 512, fps = 15 } = {}) {
  const input = await resolveInput(img, url)
  const type = await fileTypeFromBuffer(input)
  const extension = type?.ext || 'bin'
  const filter = [
    `scale=${size}:${size}:flags=lanczos:force_original_aspect_ratio=decrease`,
    `fps=${fps}`,
    `pad=${size}:${size}:(ow-iw)/2:(oh-ih)/2:color=0x00000000`,
    'format=rgba',
    'setsar=1'
  ].join(',')

  const result = await ffmpeg(input, [
    '-t', String(maxSeconds),
    '-vf', filter,
    '-an',
    '-c:v', 'libwebp',
    '-quality', '75',
    '-compression_level', '6',
    '-loop', '0',
    '-vsync', '0'
  ], extension, 'webp')

  if (!Buffer.isBuffer(result.data) || result.data.length < 100) {
    throw new Error('FFmpeg no produjo un WebP válido.')
  }
  return result.data
}

const sticker2 = (img, url) => convertToWebp(img, url, { maxSeconds: 6, size: 512, fps: 15 })
const sticker4 = (img, url) => convertToWebp(img, url, { maxSeconds: 6, size: 512, fps: 15 })
const sticker5 = (img, url) => convertToWebp(img, url, { maxSeconds: 6, size: 512, fps: 15 })
const sticker6 = (img, url) => convertToWebp(img, url, { maxSeconds: 6, size: 512, fps: 15 })
const sticker7 = (img, url) => convertToWebp(img, url, { maxSeconds: 5, size: 320, fps: 10 })

const sticker3 = (img, url) => convertToWebp(img, url, { maxSeconds: 6, size: 512, fps: 15 })

async function addExif(webpSticker, packname, author, categories = [''], extra = {}) {
  const img = new webp.Image()
  const stickerPackId = crypto.randomBytes(32).toString('hex')
  const json = {
    'sticker-pack-id': stickerPackId,
    'sticker-pack-name': packname,
    'sticker-pack-publisher': author,
    emojis: categories,
    ...extra
  }
  const exifAttr = Buffer.from([
    0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41,
    0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00
  ])
  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8')
  const exif = Buffer.concat([exifAttr, jsonBuffer])
  exif.writeUIntLE(jsonBuffer.length, 14, 4)
  await img.load(webpSticker)
  img.exif = exif
  return img.save(null)
}

async function sticker(img, url, packname, author) {
  const input = await resolveInput(img, url)
  const errors = []

  for (const converter of [sticker6, sticker7]) {
    try {
      const converted = await converter(input, false)
      try {
        return await addExif(converted, packname, author)
      } catch {
        return converted
      }
    } catch (error) {
      errors.push(error)
    }
  }

  throw new AggregateError(errors, 'No se pudo generar el sticker con ningún conversor seguro.')
}

export {
  sticker,
  sticker2,
  sticker3,
  sticker4,
  sticker5,
  sticker6,
  sticker7,
  addExif
}
