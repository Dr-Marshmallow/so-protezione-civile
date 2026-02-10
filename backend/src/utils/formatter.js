function formatIndirizzo(indirizzo) {
  if (!indirizzo) return null;

  // rimuove SOLO l'underscore iniziale
  return indirizzo.startsWith('_') ? indirizzo.slice(1) : indirizzo;
}

module.exports = {
  formatIndirizzo,
};