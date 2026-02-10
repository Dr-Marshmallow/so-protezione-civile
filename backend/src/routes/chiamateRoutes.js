const express = require('express')
const {
  getChiamate,
  getFilters,
  getChiamateAttive,
  updateChiamataStato,
  getChiamateArchivio
} = require('../controllers/chiamateController')
const rateLimitOnePerSecond = require('../middleware/rateLimit')

const router = express.Router()

router.get('/update_chiamate', rateLimitOnePerSecond, getChiamate)
router.get('/filters', getFilters)

router.get('/attive', getChiamateAttive)
router.get('/archivio', getChiamateArchivio)
router.patch('/chiamate/stato', updateChiamataStato)

module.exports = router
