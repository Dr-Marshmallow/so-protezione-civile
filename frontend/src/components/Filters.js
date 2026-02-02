export default function Filters({
  startDate,
  endDate,
  comune,
  descrizione,
  comuniOptions,
  descrizioniOptions,
  onChange,
  onReset
}) {
  return (
    <div className="filters">
      <div className="field">
        <label htmlFor="startDate">Data inizio</label>
        <input
          id="startDate"
          type="date"
          value={startDate}
          onChange={(e) => onChange('startDate', e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="endDate">Data fine</label>
        <input
          id="endDate"
          type="date"
          value={endDate}
          onChange={(e) => onChange('endDate', e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="comune">Comune</label>
        <select
          id="comune"
          value={comune}
          onChange={(e) => onChange('comune', e.target.value)}
        >
          <option value="">Tutti</option>
          {comuniOptions.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="descrizione">Tipologia intervento</label>
        <select
          id="descrizione"
          value={descrizione}
          onChange={(e) => onChange('descrizione', e.target.value)}
        >
          <option value="">Tutte</option>
          {descrizioniOptions.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div className="field actions">
        <label className="sr-only" htmlFor="reset-filters">Azioni</label>
        <button id="reset-filters" type="button" className="secondary" onClick={onReset}>
          Svuota filtri
        </button>
      </div>
    </div>
  )
}
