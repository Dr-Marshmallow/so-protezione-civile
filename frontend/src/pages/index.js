import { useCallback, useEffect, useMemo, useState } from 'react'
import Filters from '../components/Filters'
import InterventiTable from '../components/InterventiTable'
import { fetchChiamate, fetchFilters } from '../lib/api'

const REFRESH_MS = 180000

export default function Home() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [comune, setComune] = useState('')
  const [descrizione, setDescrizione] = useState('')

  const [sortField, setSortField] = useState('data_ora')
  const [sortDir, setSortDir] = useState('desc')

  const [items, setItems] = useState([])
  const [comuniOptions, setComuniOptions] = useState([])
  const [descrizioniOptions, setDescrizioniOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')
  const [nextRefreshMs, setNextRefreshMs] = useState(REFRESH_MS)

  const toDMY = (value) => {
    if (!value) return ''
    const [yyyy, mm, dd] = value.split('-')
    if (!yyyy || !mm || !dd) return ''
    return `${dd}/${mm}/${yyyy}`
  }

  const requestParams = useMemo(() => {
    const params = {}
    const startDMY = toDMY(startDate)
    const endDMY = toDMY(endDate)
    if (startDMY) params.startDate = startDMY
    if (endDMY) params.endDate = endDMY
    if (comune) params.comune = comune
    if (descrizione) params.descrizione = descrizione
    if (sortField) params.sortField = sortField
    if (sortDir) params.sortDir = sortDir
    return params
  }, [startDate, endDate, comune, descrizione, sortField, sortDir])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchChiamate(requestParams)
      setItems(data.items || [])
      setLastUpdated(new Date().toLocaleString('it-IT'))
    } catch (err) {
      setError(err.message || 'Errore durante il caricamento')
    } finally {
      setLoading(false)
      setNextRefreshMs(REFRESH_MS)
    }
  }, [requestParams])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    let active = true
    fetchFilters()
      .then((data) => {
        if (!active) return
        setComuniOptions(data.comuni || [])
        setDescrizioniOptions(data.descrizioni || [])
      })
      .catch((err) => {
        if (!active) return
        setError(err.message || 'Errore durante il caricamento dei filtri')
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      loadData()
    }, REFRESH_MS)
    return () => clearInterval(interval)
  }, [loadData])

  useEffect(() => {
    const tick = setInterval(() => {
      setNextRefreshMs((prev) => Math.max(0, prev - 1000))
    }, 1000)
    return () => clearInterval(tick)
  }, [])

  const handleFilterChange = (field, value) => {
    if (field === 'startDate') setStartDate(value)
    if (field === 'endDate') setEndDate(value)
    if (field === 'comune') setComune(value)
    if (field === 'descrizione') setDescrizione(value)
  }

  const handleResetFilters = () => {
    setStartDate('')
    setEndDate('')
    setComune('')
    setDescrizione('')
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortField(field)
    setSortDir('asc')
  }

  const progress = Math.min(100, Math.max(0, ((REFRESH_MS - nextRefreshMs) / REFRESH_MS) * 100))
  const nextSeconds = Math.ceil(nextRefreshMs / 1000)

  return (
    <div className="page">
      <header className="hero">
        <div>
          <h1>SO Protezione Civile</h1>
        </div>
      </header>

      <div className="top-action">
        <div className="last-updated">
          Ultimo aggiornamento: {lastUpdated || '-'}
        </div>
        <div className="progress" aria-hidden="true">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-label">Prossimo aggiornamento tra {nextSeconds}s</div>
        <button className="primary" onClick={loadData} disabled={loading}>
          Aggiorna ora
        </button>
      </div>

      <section className="panel">
        <Filters
          startDate={startDate}
          endDate={endDate}
          comune={comune}
          descrizione={descrizione}
          comuniOptions={comuniOptions}
          descrizioniOptions={descrizioniOptions}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
        />
      </section>

      {error && <div className="error-banner">{error}</div>}

      <section className="panel">
        {loading ? (
          <div className="loading">Caricamento in corso...</div>
        ) : items.length === 0 ? (
          <div className="empty">Nessun intervento trovato</div>
        ) : (
          <InterventiTable
            items={items}
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
          />
        )}
      </section>
    </div>
  )
}
