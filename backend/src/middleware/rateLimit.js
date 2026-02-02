let lastRequestTime = 0

function rateLimitOnePerSecond(req, res, next) {
  const now = Date.now()
  const diff = now - lastRequestTime
  if (diff < 1000) {
    return res.status(429).json({
      error: 'Troppe richieste. Attendere prima di riprovare.',
      retryAfterMs: 1000 - diff
    })
  }
  lastRequestTime = now
  next()
}

module.exports = rateLimitOnePerSecond
