const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'

export async function fetchChiamate(params) {
  const query = new URLSearchParams(params)
  const res = await fetch(`${BASE_URL}/api/update_chiamate?${query.toString()}`)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const message = data.error || 'Errore durante il caricamento'
    const error = new Error(message)
    error.status = res.status
    throw error
  }
  return res.json()
}

export async function fetchFilters() {
  const res = await fetch(`${BASE_URL}/api/filters`)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const message = data.error || 'Errore durante il caricamento dei filtri'
    const error = new Error(message)
    error.status = res.status
    throw error
  }
  return res.json()
}
