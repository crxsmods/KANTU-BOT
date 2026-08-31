import { execFile, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { shutdown } from '../lib/lifecycle.js'

const REPO_URL = (process.env.UPDATE_REPO_URL || 'https://github.com/crxsmods/KANTU-BOT').trim()
const BRANCH = (process.env.UPDATE_BRANCH || 'main').trim()
const ROOT = process.cwd()

const run = (cmd, args) => new Promise(resolve => {
  execFile(cmd, args, { cwd: ROOT, timeout: 180_000, windowsHide: true, maxBuffer: 16 * 1024 * 1024 }, (error, stdout, stderr) => {
    resolve({
      ok: !error,
      out: String(stdout || '').trim(),
      err: String(stderr || '').trim(),
      missing: error?.code === 'ENOENT'
    })
  })
})

const short = hash => String(hash || '').slice(0, 7)

const reiniciar = async () => {
  await shutdown('owner-update', 0)
  try {
    spawn(process.execPath, [...process.execArgv, process.argv[1], ...process.argv.slice(2)], {
      cwd: ROOT,
      detached: true,
      stdio: 'inherit'
    }).unref()
  } catch (error) {
    console.error('[update] No se pudo relanzar el proceso:', error.message)
  }
  process.exit(0)
}

const handler = async (m, { conn, args }) => {
  const forzar = /^(force|forzar|-f)$/i.test(args[0] || '')

  if (!existsSync(path.join(ROOT, '.git'))) {
    return m.reply([
      '⚠️ Esta copia no se instalo con git, no puede autoactualizarse.',
      '',
      'Instala asi para poder usar *.update*:',
      `git clone ${REPO_URL}`
    ].join('\n'))
  }

  if ((await run('git', ['--version'])).missing) {
    return m.reply('⚠️ git no esta instalado en este entorno.')
  }

  await m.react('⏳')

  const fetch = await run('git', ['fetch', REPO_URL, BRANCH])
  if (!fetch.ok) {
    await m.react('✖️')
    return m.reply(`❌ No se pudo contactar el repositorio.\n\n${(fetch.err || fetch.out).slice(0, 400)}`)
  }

  const local = (await run('git', ['rev-parse', 'HEAD'])).out
  const remote = (await run('git', ['rev-parse', 'FETCH_HEAD'])).out

  if (local === remote) {
    await m.react('✅')
    return m.reply('✅ El bot ya esta actualizado. No hay cambios nuevos.')
  }

  const puedeFF = (await run('git', ['merge-base', '--is-ancestor', 'HEAD', 'FETCH_HEAD'])).ok
  if (!puedeFF && !forzar) {
    await m.react('✖️')
    return m.reply([
      '⚠️ Hay cambios locales que chocan con la actualizacion.',
      '',
      'Usa *.update force* para sobrescribirlos con la version del repo.',
      '(No afecta a tu sesion, base de datos ni .env)'
    ].join('\n'))
  }

  const diffStat = await run('git', ['diff', '--stat', `${local}..${remote}`])
  const diffNames = await run('git', ['diff', '--name-only', `${local}..${remote}`])
  const cambiaDeps = /(^|\n)package(-lock)?\.json/.test('\n' + diffNames.out)

  const aplicar = forzar
    ? await run('git', ['reset', '--hard', 'FETCH_HEAD'])
    : await run('git', ['merge', '--ff-only', 'FETCH_HEAD'])

  if (!aplicar.ok) {
    await m.react('✖️')
    return m.reply(`❌ No se pudo aplicar la actualizacion.\n\n${(aplicar.err || aplicar.out).slice(0, 400)}`)
  }

  await conn.reply(m.chat, [
    '✅ Actualización completada',
    '',
    'Cambios:',
    `Updating ${short(local)}..${short(remote)}`,
    forzar ? 'Forced update' : 'Fast-forward',
    diffStat.out || ' (sin resumen)',
    '',
    'Detalles:',
    `${short(local)}..${short(remote)}  ${BRANCH}       -> repo`,
    '',
    '🔄 Reiniciando...'
  ].join('\n'), m)

  if (cambiaDeps) {
    await conn.reply(m.chat, '📦 Instalando dependencias nuevas...', m).catch(() => {})
    await run('npm', ['install', '--no-audit', '--no-fund'])
  }

  await reiniciar()
}

handler.help = ['update']
handler.tags = ['owner']
handler.command = /^(update|actualizar|gitpull)$/i
handler.owner = true

export default handler
