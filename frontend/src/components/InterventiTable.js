import { Fragment, useState } from 'react'

const HEADERS = [
  { key: 'data_ora', label: 'Data e ora' },
  { key: 'numero_chiamata', label: 'Numero chiamata' },
  { key: 'comune', label: 'Comune' },
  { key: 'descrizione', label: 'Tipologia intervento' }
]

function buildRowKey(item) {
  return `${item.NUMERO_CHIAMATA}-${item.DATA_CHIAMATA}-${item.ORA_CHIAMATA}`
}

export default function InterventiTable({ items, sortField, sortDir, onSort }) {
  const [expanded, setExpanded] = useState(new Set())

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

  return (
    <div className="table-wrapper" role="region" aria-label="Interventi">
      <table>
        <thead>
          <tr>
            {HEADERS.map((header) => (
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
                      {item.DATA_CHIAMATA} - {item.ORA_CHIAMATA || ''}
                    </span>
                  </td>
                  <td>{item.NUMERO_CHIAMATA}</td>
                  <td>{item.COMUNE}</td>
                  <td>{item.DESCRIZIONE}</td>
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
                    <td colSpan={5}>
                      <div className="expanded-content">
                        <div>
                          <strong>Richiedente:</strong> {item.RICHIEDENTE || '-'}
                        </div>
                        <div>
                          <strong>Telefono:</strong> {item.TELE_NUMERO || '-'}
                        </div>
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
