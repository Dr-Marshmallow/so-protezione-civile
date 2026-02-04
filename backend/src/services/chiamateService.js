const { getConnection } = require('../db/oracle')
const config = require('../config')
const { criterio_inoltro_protezione_civile } = require('../utils/criterioInoltroProtezioneCivile')

const SORT_MAP = {
  data_ora: 'DATA_CHIAMATA',
  numero_chiamata: 'NUMERO_CHIAMATA',
  comune: 'COMUNE',
  descrizione: 'DESCRIZIONE'
}

function buildQuery(filters, sort) {
  const where = []
  const binds = {}

  // Default condition for protezione civile (sincronizzare con criterioInoltroProtezioneCivile.js)
  where.push('PRIORITA = :priorityDefault')
  binds.priorityDefault = config.prioritaDefault

  if (filters.startDate) {
    where.push("DATA_CHIAMATA >= TO_DATE(:startDate, 'DD/MM/YYYY')")
    binds.startDate = filters.startDate
  }

  if (filters.endDate) {
    where.push("DATA_CHIAMATA <= TO_DATE(:endDate, 'DD/MM/YYYY')")
    binds.endDate = filters.endDate
  }

  if (filters.comune) {
    where.push('UPPER(COMUNE) LIKE :comune')
    binds.comune = `%${filters.comune.toUpperCase()}%`
  }

  if (filters.descrizione) {
    where.push('UPPER(DESCRIZIONE) LIKE :descrizione')
    binds.descrizione = `%${filters.descrizione.toUpperCase()}%`
  }

  let orderBy = 'DATA_CHIAMATA DESC, ORA_CHIAMATA DESC'
  if (sort.field && SORT_MAP[sort.field]) {
    const dir = sort.direction === 'asc' ? 'ASC' : 'DESC'
    if (sort.field === 'data_ora') {
      orderBy = `DATA_CHIAMATA ${dir}, ORA_CHIAMATA ${dir}`
    } else {
      orderBy = `${SORT_MAP[sort.field]} ${dir}`
    }
  }

  const sql = `
    SELECT
      TIPO,
      CHIAMATA,
      DATA_CHIAMATA,
      ORA_CHIAMATA,
      DATA_INTERVENTO,
      X,
      Y,
      RICHIEDENTE,
      DESCRIZIONE,
      DESC_LUOGO,
      COMUNE,
      MEZZI,
      TELE_NUMERO,
      PRIORITA,
      PRIMA_COMP,
      SECONDA_COMP,
      TERZA_COMP,
      OPERATORE_CHIAMATA,
      OPERATORE_INTERVENTO,
      COD_TIPOLOGIA,
      DETTAGLIO_TIPOLOGIA,
      NOTE_INTERVENTO,
      NUMERO_CHIAMATA,
      ZONA_EMERGENZA
    FROM CHIAMATE_INTERVENTI
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY ${orderBy}
  `

  return { sql, binds }
}

async function fetchChiamate(filters, sort) {
  const connection = await getConnection()
  try {
    const { sql, binds } = buildQuery(filters, sort)
    const result = await connection.execute(sql, binds, {
      outFormat: undefined,
      statementTimeout: config.db.statementTimeoutMs
    })

    const rows = result.rows || []
    return rows.filter((row) =>
      criterio_inoltro_protezione_civile(row, { prioritaDefault: config.prioritaDefault })
    )
  } finally {
    await connection.close()
  }
}

async function fetchFilterOptions() {
  const connection = await getConnection()
  try {
    const binds = { priorityDefault: config.prioritaDefault }
    const comuniResult = await connection.execute(
      `
        SELECT DISTINCT COMUNE
        FROM CHIAMATE_INTERVENTI
        WHERE PRIORITA = :priorityDefault
          AND COMUNE IS NOT NULL
        ORDER BY COMUNE
      `,
      binds,
      { outFormat: undefined, statementTimeout: config.db.statementTimeoutMs }
    )

    const descrizioniResult = await connection.execute(
      `
        SELECT DISTINCT DESCRIZIONE
        FROM CHIAMATE_INTERVENTI
        WHERE PRIORITA = :priorityDefault
          AND DESCRIZIONE IS NOT NULL
        ORDER BY DESCRIZIONE
      `,
      binds,
      { outFormat: undefined, statementTimeout: config.db.statementTimeoutMs }
    )

    const comuni = (comuniResult.rows || []).map((row) => row.COMUNE).filter(Boolean)
    const descrizioni = (descrizioniResult.rows || []).map((row) => row.DESCRIZIONE).filter(Boolean)

    return { comuni, descrizioni }
  } finally {
    await connection.close()
  }
}

module.exports = {
  fetchChiamate,
  fetchFilterOptions
}
