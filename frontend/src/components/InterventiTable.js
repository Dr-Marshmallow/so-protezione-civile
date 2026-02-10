import { Fragment, useMemo, useState } from 'react'

const BASE_HEADERS = [
  { key: 'data_ora', label: 'Data e ora' },
  { key: 'numero_chiamata', label: 'Numero chiamata' },
  { key: 'comune', label: 'Comune' },
  { key: 'descrizione', label: 'Tipologia intervento' }
]

function buildRowKey(item) {
  return item.id || `${item.NUMERO_CHIAMATA}-${item.DATA_CHIAMATA}-${item.ORA_CHIAMATA}`
}

function statoClass(stato) {
  return (stato || '').toLowerCase().replace(/\s+/g, '-')
}

export default function InterventiTable({
  items,
  sortField,
  sortDir,
  onSort,
  showStato = false,
  onChangeStato
}) {
  const [expanded, setExpanded] = useState(new Set())

  const headers = useMemo(() => {
    const base = [...BASE_HEADERS]
    if (showStato) base.push({ key: 'stato', label: 'Stato' })
    return base
  }, [showStato])

  const toggleRow = (key) => {
    const next = new Set(expanded)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setExpanded(next)
  }

  const renderSort = (key) => {
    if (sortField !== key) return '-'
    return sortDir === 'asc' ? '^' : 'v'
  }

  const colSpan = BASE_HEADERS.length + (showStato ? 1 : 0) + (onChangeStato ? 1 : 0) + 1

  return (
    <div className="table-wrapper" role="region" aria-label="Interventi">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header.key}>
                <button
                  type="button"
                  className="sort-button"
                  onClick={() => onSort(header.key)}
                  aria-label={`Ordina per ${header.label}`}
                >
                  <span>{header.label}</span>
                  <span className="sort-indicator">{renderSort(header.key)}</span>
                </button>
              </th>
            ))}
            {onChangeStato && <th className="action-header">Azioni</th>}
            <th className="expand-header" aria-hidden="true" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const key = buildRowKey(item)
            const isExpanded = expanded.has(key)
            const mapLink =
              item.X !== null && item.Y !== null
                ? `https://www.google.com/maps?q=${item.Y},${item.X}`
                : null

            return (
              <Fragment key={key}>
                <tr className="main-row">
                  <td>
                    <span className="data-ora">
                      {item.DATA_CHIAMATA} {item.ORA_CHIAMATA || ''}
                    </span>
                  </td>
                  <td>{item.NUMERO_CHIAMATA}</td>
                  <td>{item.COMUNE}</td>
                  <td>{item.DESCRIZIONE}</td>
                  {showStato && (
                    <td>
                      <span className={`stato-pill stato-${statoClass(item.stato)}`}>
                        {item.stato}
                      </span>
                    </td>
                  )}
                  {onChangeStato && (
                    <td>
                      <button
                        type="button"
                        className="secondary small"
                        onClick={() => onChangeStato(item)}
                      >
                        Cambia stato
                      </button>
                    </td>
                  )}
                  <td className="expand-cell">
                    <button
                      type="button"
                      className={`expand-button ${isExpanded ? 'expanded' : ''}`}
                      onClick={() => toggleRow(key)}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? 'Chiudi dettagli' : 'Apri dettagli'}
                    >
                      <span className="chevron">▼</span>
                    </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="expanded-row">
                    <td colSpan={colSpan}>
                      <div className="expanded-content">
                        <div>
                          <strong>Note:</strong> {item.NOTE_INTERVENTO || '-'}
                        </div>
                        <div>
                          <strong>Indirizzo:</strong> {item.DESC_LUOGO || '-'}
                        </div>
                        <div>
                          <strong>Coordinate:</strong>{' '}
                          {mapLink ? (
                            <a href={mapLink} target="_blank" rel="noreferrer">
                              {item.Y}, {item.X}
                            </a>
                          ) : (
                            '-'
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
