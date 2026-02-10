const { fetchChiamate, fetchFilterOptions } = require('../services/chiamateService')
const {
  syncChiamateToMongo,
  getAttive,
  updateStato,
  getArchivio,
  STATI_ARCHIVIO
} = require('../services/chiamateMongoService')
const { formatDateDMY, isValidDMY, getDateRangeFromDMY } = require('../utils/date')
const { formatIndirizzo } = require('../utils/formatter')

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

  return filters
}

function parseSort(query) {
  const sort = {}
  if (query.sortField) sort.field = String(query.sortField).toLowerCase()
  if (query.sortDir) sort.direction = String(query.sortDir).toLowerCase()
  return sort
}

function toResponseItem(row) {
  const numero = row.NUMERO_CHIAMATA || row.CHIAMATA

  return {
    DATA_CHIAMATA: formatDateDMY(row.DATA_CHIAMATA),
    ORA_CHIAMATA: row.ORA_CHIAMATA || null,
    NUMERO_CHIAMATA: numero,
    COMUNE: row.COMUNE || null,
    RICHIEDENTE: row.RICHIEDENTE || null,
    TELE_NUMERO: row.TELE_NUMERO || null,
    DESCRIZIONE: row.DESCRIZIONE || null,
    NOTE_INTERVENTO: row.NOTE_INTERVENTO || null,
    DESC_LUOGO: formatIndirizzo(row.DESC_LUOGO),
    X: row.X ?? null,
    Y: row.Y ?? null
  }
}

async function getChiamate(req, res, next) {
  try {
    const filters = parseFilters(req.query)
    const sort = parseSort(req.query)

    const rows = await fetchChiamate(filters, sort)
    await syncChiamateToMongo(rows)

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

async function getChiamateAttive(req, res, next) {
  try {
    const items = await getAttive()
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

async function updateChiamataStato(req, res, next) {
  try {
    const { id, stato } = req.body || {}
    if (!id || !stato) {
      const err = new Error('Parametri mancanti: id e stato sono obbligatori.')
      err.status = 400
      err.expose = true
      throw err
    }

    const updated = await updateStato(String(id), String(stato))
    res.json({ item: updated })
  } catch (err) {
    next(err)
  }
}

function parseArchivioQuery(query) {
  const dateFrom = query.dateFrom
  const dateTo = query.dateTo
  const dateFieldMode = String(query.dateFieldMode || '')

  if (!dateFrom || !dateTo) {
    const err = new Error('dateFrom e dateTo sono obbligatori.')
    err.status = 400
    err.expose = true
    throw err
  }

  if (!isValidDMY(dateFrom) || !isValidDMY(dateTo)) {
    const err = new Error('Formato data non valido. Usa dd/mm/yyyy.')
    err.status = 400
    err.expose = true
    throw err
  }

  if (!['dataChiamata', 'dataStatoFinale'].includes(dateFieldMode)) {
    const err = new Error('dateFieldMode non valido. Usa: dataChiamata, dataStatoFinale.')
    err.status = 400
    err.expose = true
    throw err
  }

  const dateRange = getDateRangeFromDMY(dateFrom, dateTo)
  if (!dateRange) {
    const err = new Error('Intervallo date non valido.')
    err.status = 400
    err.expose = true
    throw err
  }

  let stati = []
  if (query.stati) {
    stati = String(query.stati)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }

  if (stati.length) {
    const invalid = stati.filter((s) => !STATI_ARCHIVIO.includes(s))
    if (invalid.length) {
      const err = new Error('Stati archivio non validi.')
      err.status = 400
      err.expose = true
      throw err
    }
  }

  return { dateRange, dateFieldMode, stati }
}

async function getChiamateArchivio(req, res, next) {
  try {
    const query = parseArchivioQuery(req.query)
    const items = await getArchivio(query)
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
  getChiamateAttive,
  updateChiamataStato,
  getChiamateArchivio,
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
