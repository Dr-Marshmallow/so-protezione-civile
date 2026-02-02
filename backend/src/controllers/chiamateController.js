const { fetchChiamate, fetchFilterOptions } = require('../services/chiamateService')
const { formatDateDMY, isValidDMY } = require('../utils/date')

function parseFilters(query) {
  const filters = {}

  if (query.startDate) {
    if (!isValidDMY(query.startDate)) {
      const err = new Error('Formato data inizio non valido. Usa dd/mm/yyyy.')
      err.status = 400
      err.expose = true
      throw err
    }
    filters.startDate = query.startDate
  }

  if (query.endDate) {
    if (!isValidDMY(query.endDate)) {
      const err = new Error('Formato data fine non valido. Usa dd/mm/yyyy.')
      err.status = 400
      err.expose = true
      throw err
    }
    filters.endDate = query.endDate
  }

  if (query.comune) filters.comune = String(query.comune).trim()
  if (query.descrizione) filters.descrizione = String(query.descrizione).trim()

  if (query.stato) {
    const stato = String(query.stato).toLowerCase()
    if (!['in_corso', 'da_fare', 'tutti'].includes(stato)) {
      const err = new Error('Stato non valido. Usa: tutti, in_corso, da_fare.')
      err.status = 400
      err.expose = true
      throw err
    }
    if (stato !== 'tutti') filters.stato = stato
  }

  return filters
}

function parseSort(query) {
  const sort = {}
  if (query.sortField) sort.field = String(query.sortField).toLowerCase()
  if (query.sortDir) sort.direction = String(query.sortDir).toLowerCase()
  return sort
}

function toResponseItem(row) {
  const stato = row.DATA_INTERVENTO ? 'in corso' : 'da fare'
  const numero = row.NUMERO_CHIAMATA || row.CHIAMATA

  return {
    DATA_CHIAMATA: formatDateDMY(row.DATA_CHIAMATA),
    ORA_CHIAMATA: row.ORA_CHIAMATA || null,
    NUMERO_CHIAMATA: numero,
    COMUNE: row.COMUNE || null,
    stato,
    DESCRIZIONE: row.DESCRIZIONE || null,
    NOTE_INTERVENTO: row.NOTE_INTERVENTO || null,
    DESC_LUOGO: row.DESC_LUOGO || null,
    X: row.X ?? null,
    Y: row.Y ?? null
  }
}

async function getChiamate(req, res, next) {
  try {
    const filters = parseFilters(req.query)
    const sort = parseSort(req.query)

    const rows = await fetchChiamate(filters, sort)
    const items = rows.map(toResponseItem)

    res.json({
      items,
      meta: {
        count: items.length,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getChiamate,
  getFilters: async (req, res, next) => {
    try {
      const data = await fetchFilterOptions()
      res.json({
        comuni: data.comuni,
        descrizioni: data.descrizioni
      })
    } catch (err) {
      next(err)
    }
  }
}
