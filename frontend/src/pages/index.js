import { useCallback, useEffect, useMemo, useState } from 'react'
import InterventiTable from '../components/InterventiTable'
import { fetchChiamate, fetchAttive, fetchArchivio, updateStato } from '../lib/api'

const REFRESH_MS = Number(process.env.NEXT_PUBLIC_REFRESH_MS || 180000)
const REFRESH_INTERVAL_MS = Number.isFinite(REFRESH_MS) && REFRESH_MS > 0 ? REFRESH_MS : 180000

const STATI_ATTIVE = ['in attesa', 'in carico']
const STATI_ARCHIVIO = ['concluso', 'non più necessario']

function toDMYFromInput(value) {
  if (!value) return ''
  const [yyyy, mm, dd] = value.split('-')
  if (!yyyy || !mm || !dd) return ''
  return `${dd}/${mm}/${yyyy}`
}

function dmyToIso(value) {
  if (!value) return ''
  const [dd, mm, yyyy] = value.split('/')
  if (!dd || !mm || !yyyy) return ''
  return `${yyyy}-${mm}-${dd}`
}

function toTimestamp(dateDmy, timeValue) {
  const isoDate = dmyToIso(dateDmy)
  if (!isoDate) return 0
  const hhmm = timeValue && /^\d{2}:\d{2}$/.test(timeValue) ? timeValue : '00:00'
  return new Date(`${isoDate}T${hhmm}:00`).getTime()
}

function sortItems(items, sortField, sortDir) {
  const sorted = [...items].sort((a, b) => {
    let result = 0

    if (sortField === 'data_ora') {
      result = toTimestamp(a.DATA_CHIAMATA, a.ORA_CHIAMATA) - toTimestamp(b.DATA_CHIAMATA, b.ORA_CHIAMATA)
    } else if (sortField === 'numero_chiamata') {
      result = Number(a.NUMERO_CHIAMATA || 0) - Number(b.NUMERO_CHIAMATA || 0)
    } else if (sortField === 'comune') {
      result = (a.COMUNE || '').localeCompare(b.COMUNE || '', 'it', { sensitivity: 'base' })
    } else if (sortField === 'descrizione') {
      result = (a.DESCRIZIONE || '').localeCompare(b.DESCRIZIONE || '', 'it', {
        sensitivity: 'base'
      })
    } else if (sortField === 'stato') {
      result = (a.stato || '').localeCompare(b.stato || '', 'it', { sensitivity: 'base' })
    }

    return sortDir === 'asc' ? result : -result
  })

  return sorted
}

export default function Home() {
  const [tab, setTab] = useState('attive')

  const [sortField, setSortField] = useState('data_ora')
  const [sortDir, setSortDir] = useState('desc')

  const [attiveItems, setAttiveItems] = useState([])
  const [archivioItems, setArchivioItems] = useState([])

  const [comune, setComune] = useState('')
  const [descrizione, setDescrizione] = useState('')
  const [statoFiltro, setStatoFiltro] = useState('tutti')

  const [archivioFrom, setArchivioFrom] = useState('')
  const [archivioTo, setArchivioTo] = useState('')
  const [archivioMode, setArchivioMode] = useState('dataChiamata')
  const [archivioStati, setArchivioStati] = useState(['concluso', 'non più necessario'])
  const [archivioFiltroStato, setArchivioFiltroStato] = useState('tutti')
  const [archivioSearched, setArchivioSearched] = useState(false)

  const [loading, setLoading] = useState(false)
  const [archivioLoading, setArchivioLoading] = useState(false)
  const [error, setError] = useState('')
  const [archivioError, setArchivioError] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')
  const [nextRefreshMs, setNextRefreshMs] = useState(REFRESH_INTERVAL_MS)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalItem, setModalItem] = useState(null)
  const [modalStato, setModalStato] = useState('in attesa')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      await fetchChiamate({})
      const attive = await fetchAttive()
      setAttiveItems(attive.items || [])
      setLastUpdated(new Date().toLocaleString('it-IT'))
    } catch (err) {
      setError(err.message || 'Errore durante il caricamento')
    } finally {
      setLoading(false)
      setNextRefreshMs(REFRESH_INTERVAL_MS)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const interval = setInterval(() => {
      loadData()
    }, REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [loadData])

  useEffect(() => {
    const tick = setInterval(() => {
      setNextRefreshMs((prev) => Math.max(0, prev - 1000))
    }, 1000)
    return () => clearInterval(tick)
  }, [])

  const comuniOptions = useMemo(() => {
    return [...new Set(attiveItems.map((item) => item.COMUNE).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'it', { sensitivity: 'base' })
    )
  }, [attiveItems])

  const descrizioniOptions = useMemo(() => {
    return [...new Set(attiveItems.map((item) => item.DESCRIZIONE).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'it', { sensitivity: 'base' })
    )
  }, [attiveItems])

  const visibleAttive = useMemo(() => {
    const filtered = attiveItems.filter((item) => {
      if (comune && item.COMUNE !== comune) return false
      if (descrizione && item.DESCRIZIONE !== descrizione) return false
      if (statoFiltro !== 'tutti' && item.stato !== statoFiltro) return false
      return STATI_ATTIVE.includes(item.stato)
    })
    return sortItems(filtered, sortField, sortDir)
  }, [attiveItems, comune, descrizione, statoFiltro, sortField, sortDir])

  const visibleArchivio = useMemo(() => {
    const filtered = archivioItems.filter((item) => {
      if (archivioFiltroStato !== 'tutti' && item.stato !== archivioFiltroStato) return false
      return STATI_ARCHIVIO.includes(item.stato)
    })
    return sortItems(filtered, sortField, sortDir)
  }, [archivioItems, archivioFiltroStato, sortField, sortDir])

  const handleFilterReset = () => {
    setComune('')
    setDescrizione('')
    setStatoFiltro('tutti')
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortField(field)
    setSortDir('asc')
  }

  const openModal = (item) => {
    setModalItem(item)
    setModalStato(item.stato || 'in attesa')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setModalItem(null)
  }

  const handleSaveStato = async () => {
    if (!modalItem) return
    try {
      const res = await updateStato(modalItem.id, modalStato)
      const updated = res.item

      const upsert = (list) => {
        const idx = list.findIndex((item) => item.id === updated.id)
        if (idx === -1) return [...list, updated]
        const next = [...list]
        next[idx] = updated
        return next
      }

      setAttiveItems((prev) =>
        STATI_ATTIVE.includes(updated.stato) ? upsert(prev) : prev.filter((item) => item.id !== updated.id)
      )
      setArchivioItems((prev) =>
        STATI_ARCHIVIO.includes(updated.stato) ? upsert(prev) : prev.filter((item) => item.id !== updated.id)
      )

      closeModal()
    } catch (err) {
      setError(err.message || "Errore durante aggiornamento stato")
    }
  }

  const toggleArchivioStato = (value) => {
    setArchivioStati((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    )
  }

  const handleArchivioSearch = async () => {
    if (!archivioFrom || !archivioTo) {
      setArchivioError('Inserire intervallo date completo.')
      return
    }
    setArchivioLoading(true)
    setArchivioError('')

    try {
      const params = {
        dateFrom: toDMYFromInput(archivioFrom),
        dateTo: toDMYFromInput(archivioTo),
        dateFieldMode: archivioMode,
        stati: archivioStati.join(',')
      }
      const data = await fetchArchivio(params)
      setArchivioItems(data.items || [])
      setArchivioSearched(true)
      setArchivioFiltroStato('tutti')
    } catch (err) {
      setArchivioError(err.message || 'Errore durante la ricerca')
    } finally {
      setArchivioLoading(false)
    }
  }

  const progress = Math.min(
    100,
    Math.max(0, ((REFRESH_INTERVAL_MS - nextRefreshMs) / REFRESH_INTERVAL_MS) * 100)
  )
  const nextSeconds = Math.ceil(nextRefreshMs / 1000)

  return (
    <div className="page">
      <header className="hero">
        <div>
          <h1>SO Protezione Civile</h1>
        </div>
      </header>

      <div className="top-action">
        <div className="last-updated">Ultimo aggiornamento: {lastUpdated || '-'}</div>
        <div className="progress" aria-hidden="true">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-label">Prossimo aggiornamento tra {nextSeconds}s</div>
        <button className="primary" onClick={loadData} disabled={loading}>
          Aggiorna ora
        </button>
      </div>

      <div className="tabs">
        <button
          type="button"
          className={`tab-button ${tab === 'attive' ? 'active' : ''}`}
          onClick={() => setTab('attive')}
        >
          Attive
        </button>
        <button
          type="button"
          className={`tab-button ${tab === 'archivio' ? 'active' : ''}`}
          onClick={() => setTab('archivio')}
        >
          Archivio
        </button>
      </div>

      {tab === 'attive' && (
        <>
          <section className="panel">
            <div className="filters">
              <div className="field">
                <label htmlFor="comune">Comune</label>
                <select id="comune" value={comune} onChange={(e) => setComune(e.target.value)}>
                  <option value="">Tutti</option>
                  {comuniOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="descrizione">Tipologia intervento</label>
                <select
                  id="descrizione"
                  value={descrizione}
                  onChange={(e) => setDescrizione(e.target.value)}
                >
                  <option value="">Tutte</option>
                  {descrizioniOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="stato">Stato</label>
                <select id="stato" value={statoFiltro} onChange={(e) => setStatoFiltro(e.target.value)}>
                  <option value="tutti">Tutti</option>
                  <option value="in attesa">In attesa</option>
                  <option value="in carico">In carico</option>
                </select>
              </div>
              <div className="field actions">
                <label className="sr-only" htmlFor="reset-filters">Azioni</label>
                <button id="reset-filters" type="button" className="secondary" onClick={handleFilterReset}>
                  Svuota filtri
                </button>
              </div>
            </div>
          </section>

          {error && <div className="error-banner">{error}</div>}

          <section className="panel">
            {loading ? (
              <div className="loading">Caricamento in corso...</div>
            ) : visibleAttive.length === 0 ? (
              <div className="empty">Nessun intervento trovato</div>
            ) : (
              <InterventiTable
                items={visibleAttive}
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                showStato
                onChangeStato={openModal}
              />
            )}
          </section>
        </>
      )}

      {tab === 'archivio' && (
        <>
          <section className="panel">
            <div className="archive-filters">
              <div className="field">
                <label htmlFor="archivioFrom">Data inizio</label>
                <input
                  id="archivioFrom"
                  type="date"
                  value={archivioFrom}
                  onChange={(e) => setArchivioFrom(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="archivioTo">Data fine</label>
                <input
                  id="archivioTo"
                  type="date"
                  value={archivioTo}
                  onChange={(e) => setArchivioTo(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="archivioMode">Criterio data</label>
                <select
                  id="archivioMode"
                  value={archivioMode}
                  onChange={(e) => setArchivioMode(e.target.value)}
                >
                  <option value="dataChiamata">Data chiamata</option>
                  <option value="dataStatoFinale">Data stato finale</option>
                </select>
              </div>
            </div>

            <div className="status-checkboxes">
              <label>
                <input
                  type="checkbox"
                  checked={archivioStati.includes('concluso')}
                  onChange={() => toggleArchivioStato('concluso')}
                />
                Concluso
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={archivioStati.includes('non più necessario')}
                  onChange={() => toggleArchivioStato('non più necessario')}
                />
                Non più necessario
              </label>
            </div>

            <div className="archive-actions">
              <button className="primary" onClick={handleArchivioSearch} disabled={archivioLoading}>
                Cerca archivio
              </button>
              <span className="helper-text">Intervallo date obbligatorio</span>
            </div>

            {archivioError && <div className="error-banner">{archivioError}</div>}
          </section>

          {archivioSearched && (
            <section className="panel">
              <div className="filters">
                <div className="field">
                  <label htmlFor="archivioFiltro">Filtra per stato</label>
                  <select
                    id="archivioFiltro"
                    value={archivioFiltroStato}
                    onChange={(e) => setArchivioFiltroStato(e.target.value)}
                  >
                    <option value="tutti">Tutti</option>
                    <option value="concluso">Concluso</option>
                    <option value="non più necessario">Non più necessario</option>
                  </select>
                </div>
              </div>
            </section>
          )}

          <section className="panel">
            {archivioLoading ? (
              <div className="loading">Caricamento in corso...</div>
            ) : visibleArchivio.length === 0 ? (
              <div className="empty">Nessun intervento trovato</div>
            ) : (
              <InterventiTable
                items={visibleArchivio}
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                showStato
                onChangeStato={openModal}
              />
            )}
          </section>
        </>
      )}

      {modalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>Cambia stato</h3>
            <div className="field">
              <label htmlFor="modal-stato">Nuovo stato</label>
              <select
                id="modal-stato"
                value={modalStato}
                onChange={(e) => setModalStato(e.target.value)}
              >
                <option value="in attesa">In attesa</option>
                <option value="in carico">In carico</option>
                <option value="concluso">Concluso</option>
                <option value="non più necessario">Non più necessario</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="secondary" type="button" onClick={closeModal}>
                Annulla
              </button>
              <button className="primary" type="button" onClick={handleSaveStato}>
                Salva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
