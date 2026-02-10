const app = require('./app')
const config = require('./config')
const { closePool } = require('./db/oracle')
const { initMongo, closeMongo } = require('./db/mongo')

async function start() {
  await initMongo()
  const server = app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend in ascolto su http://localhost:${config.port}`)
  })

  async function shutdown() {
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
