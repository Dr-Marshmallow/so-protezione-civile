const app = require('./app')
const config = require('./config')
const { closePool } = require('./db/oracle')

const server = app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend in ascolto su http://localhost:${config.port}`)
})

async function shutdown() {
  await closePool()
  server.close(() => process.exit(0))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
