const timers = new Set()
const shutdownTasks = new Set()
let primarySocket = null
let shutdownPromise = null
let handlersRegistered = false

export const isShuttingDown = () => Boolean(shutdownPromise)

export function setPrimarySocket(socket) {
  primarySocket = socket || null
}

export function managedTimeout(callback, delay) {
  const timer = setTimeout(async () => {
    timers.delete(timer)
    if (isShuttingDown()) return
    try {
      await callback()
    } catch (error) {
      console.error('[lifecycle] Error en tarea diferida:', error)
    }
  }, delay)
  timers.add(timer)
  return timer
}

export function managedInterval(callback, delay) {
  let running = false
  const timer = setInterval(async () => {
    if (isShuttingDown() || running) return
    running = true
    try {
      await callback()
    } catch (error) {
      console.error('[lifecycle] Error en tarea periodica:', error)
    } finally {
      running = false
    }
  }, delay)
  timers.add(timer)
  return timer
}

export function registerShutdownTask(task) {
  if (typeof task !== 'function') throw new TypeError('La tarea de cierre debe ser una funcion.')
  shutdownTasks.add(task)
  return () => shutdownTasks.delete(task)
}

const closeSocket = async socket => {
  if (!socket) return
  try {
    socket.ev?.removeAllListeners?.()
    socket.end?.(new Error('Proceso detenido'))
    socket.ws?.close?.()
    socket.ws?.terminate?.()
  } catch (error) {
    console.error('[lifecycle] No se pudo cerrar un socket de WhatsApp:', error.message)
  }
}

export function shutdown(reason = 'shutdown', exitCode = 0, cause = null) {
  if (shutdownPromise) return shutdownPromise

  shutdownPromise = (async () => {
    const [{ closeDatabase }, { stopHealthServer, updateHealth }] = await Promise.all([
      import('./postgres.js'),
      import('./health.js')
    ])
    updateHealth('shuttingDown', true)
    if (cause) updateHealth('fatalError', cause?.message || String(cause))
    console.log(`[lifecycle] Cerrando proceso (${reason})...`)
    for (const timer of timers) {
      clearTimeout(timer)
      clearInterval(timer)
    }
    timers.clear()

    const sockets = new Set([primarySocket, ...(globalThis.conns || [])].filter(Boolean))
    await Promise.allSettled([...sockets].map(closeSocket))
    await Promise.allSettled([...shutdownTasks].map(task => task()))
    shutdownTasks.clear()
    await Promise.allSettled([closeDatabase(), stopHealthServer()])
    process.exitCode = exitCode
  })()

  return shutdownPromise
}

export async function shutdownAndExit(reason = 'shutdown', exitCode = 0, cause = null) {
  const deadline = setTimeout(() => process.exit(exitCode), 10_000)
  deadline.unref?.()
  try {
    await shutdown(reason, exitCode, cause)
  } catch (error) {
    console.error('[lifecycle] Fallo durante el cierre:', error)
  } finally {
    clearTimeout(deadline)
    process.exit(exitCode)
  }
}

export function registerProcessHandlers() {
  if (handlersRegistered) return
  handlersRegistered = true

  const stop = (signal, code, error) => {
    void shutdownAndExit(signal, code, error)
  }

  process.once('SIGINT', () => stop('SIGINT', 0))
  process.once('SIGTERM', () => stop('SIGTERM', 0))
  process.once('uncaughtException', error => {
    console.error('[fatal] Excepcion no controlada:', error)
    stop('uncaughtException', 1, error)
  })
  process.once('unhandledRejection', reason => {
    const error = reason instanceof Error ? reason : new Error(String(reason))
    console.error('[fatal] Promesa rechazada sin control:', error)
    stop('unhandledRejection', 1, error)
  })
}
