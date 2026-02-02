const oracledb = require('oracledb')
const config = require('../config')

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT

let pool
let clientInitialized = false

async function initPool() {
  if (pool) return pool
  if (!clientInitialized && config.db.libDir) {
    oracledb.initOracleClient({ libDir: config.db.libDir })
    clientInitialized = true
  }
  pool = await oracledb.createPool({
    user: config.db.user,
    password: config.db.password,
    connectString: config.db.connectString,
    poolMin: config.db.poolMin,
    poolMax: config.db.poolMax,
    poolIncrement: config.db.poolIncrement,
    poolTimeout: config.db.poolTimeout
  })
  return pool
}

async function getConnection() {
  const p = await initPool()
  return p.getConnection()
}

async function closePool() {
  if (pool) {
    await pool.close(5)
    pool = null
  }
}

module.exports = {
  getConnection,
  closePool
}
