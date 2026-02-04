import { useCallback, useEffect, useMemo, useState } from 'react'
import Filters from '../components/Filters'
import InterventiTable from '../components/InterventiTable'
import { fetchChiamate } from '../lib/api'

const REFRESH_MS = 180000

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

export default function Home() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [comune, setComune] = useState('')
  const [descrizione, setDescrizione] = useState('')

  const [sortField, setSortField] = useState('data_ora')
  const [sortDir, setSortDir] = useState('desc')

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')
  const [nextRefreshMs, setNextRefreshMs] = useState(REFRESH_MS)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchChiamate({})
      setItems(data.items || [])
      setLastUpdated(new Date().toLocaleString('it-IT'))
    } catch (err) {
      setError(err.message || 'Errore durante il caricamento')
    } finally {
      setLoading(false)
      setNextRefreshMs(REFRESH_MS)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

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

  const comuniOptions = useMemo(() => {
    return [...new Set(items.map((item) => item.COMUNE).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'it', { sensitivity: 'base' })
    )
  }, [items])

  const descrizioniOptions = useMemo(() => {
    return [...new Set(items.map((item) => item.DESCRIZIONE).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'it', { sensitivity: 'base' })
    )
  }, [items])

  const visibleItems = useMemo(() => {
    const filtered = items.filter((item) => {
      const itemDateIso = dmyToIso(item.DATA_CHIAMATA)

      if (startDate && itemDateIso && itemDateIso < startDate) return false
      if (endDate && itemDateIso && itemDateIso > endDate) return false
      if (comune && item.COMUNE !== comune) return false
      if (descrizione && item.DESCRIZIONE !== descrizione) return false

      return true
    })

    const sorted = [...filtered].sort((a, b) => {
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
      }

      return sortDir === 'asc' ? result : -result
    })

    return sorted
  }, [items, startDate, endDate, comune, descrizione, sortField, sortDir])

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
        <div className="last-updated">Ultimo aggiornamento: {lastUpdated || '-'}</div>
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
        ) : visibleItems.length === 0 ? (
          <div className="empty">Nessun intervento trovato</div>
        ) : (
          <InterventiTable
            items={visibleItems}
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
          />
        )}
      </section>
    </div>
  )
}
