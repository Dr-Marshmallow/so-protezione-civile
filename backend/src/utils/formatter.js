function formatVia(via) {
  if (!via) return null;

  // rimuove SOLO l'underscore iniziale
  return via.startsWith('_') ? via.slice(1) : via;
}

module.exports = {
  formatVia,
};