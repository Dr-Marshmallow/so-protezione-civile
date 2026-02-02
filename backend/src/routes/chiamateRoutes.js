const express = require('express')
const { getChiamate, getFilters } = require('../controllers/chiamateController')
const rateLimitOnePerSecond = require('../middleware/rateLimit')

const router = express.Router()

router.get('/update_chiamate', rateLimitOnePerSecond, getChiamate)
router.get('/filters', getFilters)

module.exports = router
