const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const chiamateRoutes = require('./routes/chiamateRoutes')
const errorHandler = require('./middleware/errorHandler')
const config = require('./config')

const app = express()

app.use(cors({ origin: config.corsOrigin }))
app.use(express.json())
app.use(morgan('tiny'))

app.use('/api', chiamateRoutes)

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.use(errorHandler)

module.exports = app
