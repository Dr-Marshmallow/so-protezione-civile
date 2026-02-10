const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'

async function parseResponse(res, fallbackMessage) {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const message = data.error || fallbackMessage
    const error = new Error(message)
    error.status = res.status
    throw error
  }
  return res.json()
}

export async function fetchChiamate(params) {
  const query = new URLSearchParams(params)
  const res = await fetch(`${BASE_URL}/api/update_chiamate?${query.toString()}`)
  return parseResponse(res, 'Errore durante il caricamento')
}

export async function fetchAttive() {
  const res = await fetch(`${BASE_URL}/api/attive`)
  return parseResponse(res, 'Errore durante il caricamento delle attive')
}

export async function fetchArchivio(params) {
  const query = new URLSearchParams(params)
  const res = await fetch(`${BASE_URL}/api/archivio?${query.toString()}`)
  return parseResponse(res, 'Errore durante la ricerca archivio')
}

export async function updateStato(id, stato) {
  const res = await fetch(`${BASE_URL}/api/chiamate/stato`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, stato })
  })
  return parseResponse(res, 'Errore durante l\'aggiornamento stato')
}
