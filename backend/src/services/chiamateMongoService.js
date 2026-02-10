const { ObjectId } = require('mongodb')
const { getCollection } = require('../db/mongo')
const { formatDateDMY, formatDateTimeDMY } = require('../utils/date')

const STATI = ['in attesa', 'in carico', 'concluso', 'non più necessario']
const STATI_ATTIVE = ['in attesa', 'in carico']
const STATI_ARCHIVIO = ['concluso', 'non più necessario']

function buildUniqueKey(row) {
  const numero = row.NUMERO_CHIAMATA || row.CHIAMATA || ''
  const data = formatDateDMY(row.DATA_CHIAMATA) || ''
  const ora = row.ORA_CHIAMATA || ''
  const comune = row.COMUNE || ''
  return [numero, data, ora, comune].join('-')
}

function mapOracleRow(row) {
  const uniqueKey = buildUniqueKey(row)
  return {
    _id: uniqueKey,
    uniqueKey,
    DATA_CHIAMATA: formatDateDMY(row.DATA_CHIAMATA),
    ORA_CHIAMATA: row.ORA_CHIAMATA || null,
    NUMERO_CHIAMATA: row.NUMERO_CHIAMATA || row.CHIAMATA || null,
    COMUNE: row.COMUNE || null,
    RICHIEDENTE: row.RICHIEDENTE || null,
    TELE_NUMERO: row.TELE_NUMERO || null,
    DESCRIZIONE: row.DESCRIZIONE || null,
    NOTE_INTERVENTO: row.NOTE_INTERVENTO || null,
    DESC_LUOGO: row.DESC_LUOGO || null,
    X: row.X ?? null,
    Y: row.Y ?? null,
    dataChiamata: row.DATA_CHIAMATA ? new Date(row.DATA_CHIAMATA) : null,
    stato: 'in attesa',
    presaInCaricoAt: null,
    conclusaAt: null,
    nonPiuNecessarioAt: null
  }
}

async function syncChiamateToMongo(rows) {
  if (!rows || rows.length === 0) return { inserted: 0 }

  const collection = getCollection()
  const ops = rows.map((row) => {
    const doc = mapOracleRow(row)
    return {
      updateOne: {
        filter: { uniqueKey: doc.uniqueKey },
        update: { $setOnInsert: doc },
        upsert: true
      }
    }
  })

  const result = await collection.bulkWrite(ops, { ordered: false })
  return { inserted: result.upsertedCount || 0 }
}

function mapMongoDoc(doc) {
  if (!doc) return null
  return {
    id: doc.uniqueKey || (doc._id ? String(doc._id) : null),
    DATA_CHIAMATA: doc.DATA_CHIAMATA || formatDateDMY(doc.dataChiamata),
    ORA_CHIAMATA: doc.ORA_CHIAMATA || null,
    NUMERO_CHIAMATA: doc.NUMERO_CHIAMATA || null,
    COMUNE: doc.COMUNE || null,
    RICHIEDENTE: doc.RICHIEDENTE || null,
    TELE_NUMERO: doc.TELE_NUMERO || null,
    DESCRIZIONE: doc.DESCRIZIONE || null,
    NOTE_INTERVENTO: doc.NOTE_INTERVENTO || null,
    DESC_LUOGO: doc.DESC_LUOGO || null,
    X: doc.X ?? null,
    Y: doc.Y ?? null,
    stato: doc.stato,
    presaInCaricoAt: formatDateTimeDMY(doc.presaInCaricoAt),
    conclusaAt: formatDateTimeDMY(doc.conclusaAt),
    nonPiuNecessarioAt: formatDateTimeDMY(doc.nonPiuNecessarioAt)
  }
}

async function getAttive() {
  const collection = getCollection()
  const docs = await collection
    .find({ stato: { $in: STATI_ATTIVE } })
    .sort({ dataChiamata: -1, ORA_CHIAMATA: -1 })
    .toArray()
  return docs.map(mapMongoDoc)
}

function buildStatusUpdate(stato) {
  const now = new Date()
  const update = {
    $set: { stato },
    $unset: {}
  }

  if (stato === 'in attesa') {
    update.$unset.presaInCaricoAt = ''
    update.$unset.conclusaAt = ''
    update.$unset.nonPiuNecessarioAt = ''
  }

  if (stato === 'in carico') {
    update.$set.presaInCaricoAt = now
    update.$unset.conclusaAt = ''
    update.$unset.nonPiuNecessarioAt = ''
  }

  if (stato === 'concluso') {
    update.$set.conclusaAt = now
    update.$unset.nonPiuNecessarioAt = ''
  }

  if (stato === 'non più necessario') {
    update.$set.nonPiuNecessarioAt = now
    update.$unset.conclusaAt = ''
  }

  if (Object.keys(update.$unset).length === 0) {
    delete update.$unset
  }

  return update
}

function buildUpdateFilter(id) {
  const value = String(id)
  const conditions = [{ uniqueKey: value }, { _id: value }]

  if (ObjectId.isValid(value)) {
    conditions.push({ _id: new ObjectId(value) })
  }

  return { $or: conditions }
}

async function updateStato(uniqueKey, stato) {
  if (!STATI.includes(stato)) {
    const err = new Error('Stato non valido')
    err.status = 400
    err.expose = true
    throw err
  }

  const collection = getCollection()
  const update = buildStatusUpdate(stato)
  const result = await collection.findOneAndUpdate(buildUpdateFilter(uniqueKey), update, {
    returnDocument: 'after'
  })

  const doc = result && result.value ? result.value : result
  if (!doc) {
    const err = new Error('Chiamata non trovata')
    err.status = 404
    err.expose = true
    throw err
  }

  return mapMongoDoc(doc)
}

function buildArchivioQuery(dateRange, dateFieldMode, stati) {
  const query = {}

  const statiFiltrati = stati && stati.length ? stati : STATI_ARCHIVIO
  query.stato = { $in: statiFiltrati }

  if (dateFieldMode === 'dataChiamata') {
    query.dataChiamata = { $gte: dateRange.start, $lte: dateRange.end }
    return query
  }

  const orConditions = []
  if (statiFiltrati.includes('concluso')) {
    orConditions.push({ conclusaAt: { $gte: dateRange.start, $lte: dateRange.end } })
  }
  if (statiFiltrati.includes('non più necessario')) {
    orConditions.push({ nonPiuNecessarioAt: { $gte: dateRange.start, $lte: dateRange.end } })
  }

  query.$or = orConditions
  return query
}

async function getArchivio({ dateRange, dateFieldMode, stati }) {
  const collection = getCollection()
  const query = buildArchivioQuery(dateRange, dateFieldMode, stati)
  const docs = await collection
    .find(query)
    .sort({ dataChiamata: -1, ORA_CHIAMATA: -1 })
    .toArray()
  return docs.map(mapMongoDoc)
}

module.exports = {
  STATI,
  STATI_ATTIVE,
  STATI_ARCHIVIO,
  syncChiamateToMongo,
  getAttive,
  updateStato,
  getArchivio
}
