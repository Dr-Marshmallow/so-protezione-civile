import { useEffect, useMemo, useRef, useState } from 'react'

const LEAFLET_CSS_ID = 'leaflet-css-cdn'
const LEAFLET_SCRIPT_ID = 'leaflet-js-cdn'
const DEFAULT_CENTER = [41.9028, 12.4964]
const DEFAULT_ZOOM = 6

function parseCoordinate(value) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null

  const parsed = Number(String(value).replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function getMarkerClass(stato) {
  return stato === 'in carico' ? 'status-marker status-marker--in-carico' : 'status-marker status-marker--in-attesa'
}

function loadLeaflet() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Leaflet disponibile solo nel browser'))
  }

  if (window.L) {
    return Promise.resolve(window.L)
  }

  const existingScript = document.getElementById(LEAFLET_SCRIPT_ID)
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', () => resolve(window.L), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Errore caricamento Leaflet')), {
        once: true
      })
    })
  }

  if (!document.getElementById(LEAFLET_CSS_ID)) {
    const css = document.createElement('link')
    css.id = LEAFLET_CSS_ID
    css.rel = 'stylesheet'
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    css.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
    css.crossOrigin = ''
    document.head.appendChild(css)
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = LEAFLET_SCRIPT_ID
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
    script.crossOrigin = ''
    script.async = true
    script.onload = () => resolve(window.L)
    script.onerror = () => reject(new Error('Errore caricamento Leaflet'))
    document.body.appendChild(script)
  })
}

export default function InterventiMap({ items }) {
  const mapElementRef = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)
  const [mapError, setMapError] = useState('')
  const [mapReady, setMapReady] = useState(false)

  const markers = useMemo(() => {
    return (items || [])
      .map((item) => {
        const lat = parseCoordinate(item.Y)
        const lon = parseCoordinate(item.X)
        if (lat === null || lon === null) return null
        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null
        return {
          id: item.id || `${item.NUMERO_CHIAMATA}-${item.DATA_CHIAMATA}-${item.ORA_CHIAMATA}`,
          lat,
          lon,
          stato: item.stato || 'in attesa',
          numero: item.NUMERO_CHIAMATA || '-',
          comune: item.COMUNE || '-',
          descrizione: item.DESCRIZIONE || '-',
          data: item.DATA_CHIAMATA || '-',
          ora: item.ORA_CHIAMATA || '-'
        }
      })
      .filter(Boolean)
  }, [items])

  useEffect(() => {
    let mounted = true

    loadLeaflet()
      .then((L) => {
        if (!mounted || !mapElementRef.current || mapRef.current) return

        const map = L.map(mapElementRef.current, {
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          zoomControl: true
        })

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map)

        mapRef.current = map
        setMapReady(true)
      })
      .catch((err) => {
        if (!mounted) return
        setMapError(err.message || 'Impossibile caricare la mappa')
      })

    return () => {
      mounted = false
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      layerRef.current = null
      setMapReady(false)
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !window.L || !mapReady) return

    if (layerRef.current) {
      layerRef.current.remove()
      layerRef.current = null
    }

    const layerGroup = window.L.layerGroup()

    markers.forEach((marker) => {
      const icon = window.L.divIcon({
        className: 'status-marker-wrapper',
        html: `<span class=\"${getMarkerClass(marker.stato)}\" aria-hidden=\"true\"></span>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      })

      window.L.marker([marker.lat, marker.lon], { icon })
        .bindPopup(
          `<strong>${marker.comune}</strong><br/>#${marker.numero} - ${marker.stato}<br/>${marker.descrizione}<br/>${marker.data} ${marker.ora}`
        )
        .addTo(layerGroup)
    })

    layerGroup.addTo(map)
    layerRef.current = layerGroup

    if (markers.length > 0) {
      const bounds = window.L.latLngBounds(markers.map((m) => [m.lat, m.lon]))
      map.fitBounds(bounds, { padding: [30, 30] })
    } else {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM)
    }
  }, [markers, mapReady])

  return (
    <div>
      <div className="map-legend" aria-label="Legenda stati mappa">
        <span className="legend-item">
          <span className="status-marker status-marker--in-attesa" aria-hidden="true" /> In attesa
        </span>
        <span className="legend-item">
          <span className="status-marker status-marker--in-carico" aria-hidden="true" /> In carico
        </span>
        <span className="legend-count">Interventi con coordinate: {markers.length}</span>
      </div>

      {mapError ? (
        <div className="error-banner">{mapError}</div>
      ) : (
        <div className="map-container" ref={mapElementRef} role="img" aria-label="Mappa interventi attivi" />
      )}

      {!mapError && markers.length === 0 && (
        <div className="empty">Nessun intervento attivo con coordinate valide</div>
      )}
    </div>
  )
}
