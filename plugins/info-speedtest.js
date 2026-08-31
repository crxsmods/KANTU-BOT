import os from 'node:os'
import { performance } from 'node:perf_hooks'

const formatBytes = bytes => `${(bytes / 1024 / 1024).toFixed(1)} MB`

const handler = async m => {
  const start = performance.now()
  await new Promise(resolve => setTimeout(resolve, 100))
  const eventLoopDelay = Math.max(0, performance.now() - start - 100)
  const memory = process.memoryUsage()
  const load = os.loadavg()

  await m.reply([
    '*Diagnostico del servidor*',
    `Event loop: ${eventLoopDelay.toFixed(1)} ms`,
    `RSS: ${formatBytes(memory.rss)}`,
    `Heap: ${formatBytes(memory.heapUsed)} / ${formatBytes(memory.heapTotal)}`,
    `Carga 1/5/15 min: ${load.map(value => value.toFixed(2)).join(' / ')}`,
    `Uptime: ${Math.floor(process.uptime())} s`
  ].join('\n'))
}

handler.help = ['speedtest']
handler.tags = ['main']
handler.command = /^(speedtest?|test?speed)$/i
handler.register = true

export default handler
