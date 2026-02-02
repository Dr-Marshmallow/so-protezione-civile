// Modifica questo file per cambiare la logica di inoltro.
/**
 * Determina se una chiamata deve essere inoltrata alla protezione civile.
 * @param {Object} chiamata - Riga Oracle della tabella CHIAMATE_INTERVENTI
 * @param {Object} [opts]
 * @returns {boolean}
 */
function criterio_inoltro_protezione_civile(chiamata, opts = {}) {
  // =========================
  // MODIFICA QUI LA CONDIZIONE
  // Default: PRIORITA === 3
  // =========================
  const target = Number.isFinite(opts.prioritaDefault) ? opts.prioritaDefault : 3
  return Number(chiamata.PRIORITA) === target
}

module.exports = {
  criterio_inoltro_protezione_civile
}
