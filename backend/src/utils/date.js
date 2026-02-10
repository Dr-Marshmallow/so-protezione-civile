function formatDateDMY(date) {
  if (!date) return null
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return null
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function isValidDMY(value) {
  if (!value || typeof value !== 'string') return false
  const match = value.match(/^([0-2]\d|3[0-1])\/(0\d|1[0-2])\/(\d{4})$/)
  if (!match) return false
  const [_, dd, mm, yyyy] = match
  const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`)
  return (
    d.getUTCFullYear() === Number(yyyy) &&
    d.getUTCMonth() + 1 === Number(mm) &&
    d.getUTCDate() === Number(dd)
  )
}

function parseDMYToDate(value) {
  if (!isValidDMY(value)) return null
  const [dd, mm, yyyy] = value.split('/')
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd), 0, 0, 0, 0)
}

function getDateRangeFromDMY(dateFrom, dateTo) {
  const start = parseDMYToDate(dateFrom)
  const end = parseDMYToDate(dateTo)
  if (!start || !end) return null
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

module.exports = {
  formatDateDMY,
  isValidDMY,
  parseDMYToDate,
  getDateRangeFromDMY
}
