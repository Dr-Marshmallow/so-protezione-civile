const dotenv = require('dotenv')

dotenv.config()

const required = ['DB_USER', 'DB_PASSWORD', 'DB_CONNECT_STRING']
const missing = required.filter((key) => !process.env[key])

if (missing.length) {
  throw new Error(`Missing required env vars: ${missing.join(', ')}`)
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  db: {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECT_STRING,
    libDir: process.env.DB_LIB_DIR || '',
    poolMin: Number(process.env.DB_POOL_MIN || 1),
    poolMax: Number(process.env.DB_POOL_MAX || 4),
    poolIncrement: Number(process.env.DB_POOL_INCREMENT || 1),
    poolTimeout: Number(process.env.DB_POOL_TIMEOUT || 60),
    statementTimeoutMs: Number(process.env.DB_STATEMENT_TIMEOUT_MS || 8000)
  },
  prioritaDefault: Number(process.env.PRIORITA_DEFAULT || 2)
}

module.exports = config
