const express = require('express')
const { getChiamate } = require('../controllers/chiamateController')
const rateLimitOnePerSecond = require('../middleware/rateLimit')

const router = express.Router()

router.get('/update_chiamate', rateLimitOnePerSecond, getChiamate)

module.exports = router
