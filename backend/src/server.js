const app = require('./app')
const config = require('./config')
const { closePool } = require('./db/oracle')
const { initMongo, closeMongo } = require('./db/mongo')
const { fetchChiamate } = require('./services/chiamateService')
const { syncChiamateToMongo } = require('./services/chiamateMongoService')

async function runBackgroundSync() {
  const rows = await fetchChiamate({}, {})
  const result = await syncChiamateToMongo(rows)

  // eslint-disable-next-line no-console
  console.log(
    `[SYNC] completata: lette ${rows.length} chiamate Oracle, inserite ${result.inserted} nuove in Mongo (${new Date().toISOString()})`
  )
}

async function start() {
  await initMongo()

  const server = app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend in ascolto su http://${config.host}:${config.port}`)
  })

  let syncTimer = null

  if (config.backgroundSync.enabled) {
    try {
      await runBackgroundSync()
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[SYNC] errore sync iniziale:', err.message)
    }

    syncTimer = setInterval(async () => {
      try {
        await runBackgroundSync()
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[SYNC] errore sync periodica:', err.message)
      }
    }, config.backgroundSync.intervalMs)

    if (typeof syncTimer.unref === 'function') {
      syncTimer.unref()
    }

    // eslint-disable-next-line no-console
    console.log(`[SYNC] scheduler attivo ogni ${config.backgroundSync.intervalMs} ms`)
  } else {
    // eslint-disable-next-line no-console
    console.log('[SYNC] scheduler disabilitato via BACKGROUND_SYNC_ENABLED=false')
  }

  async function shutdown() {
    if (syncTimer) {
      clearInterval(syncTimer)
    }
    await closePool()
    await closeMongo()
    server.close(() => process.exit(0))
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Errore avvio server:', err)
  process.exit(1)
})
