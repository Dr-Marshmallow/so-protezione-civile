# SO Protezione Civile

Web app semplice e robusta per visualizzare gli interventi inoltrati dai vigili del fuoco alla protezione civile. Il backend interroga Oracle e il frontend mostra una tabella filtrabile, ordinabile e con aggiornamento automatico ogni 3 minuti.

## Prerequisiti
- Node.js 18+ (consigliato 20+)
- Oracle Client (Instant Client) **necessario** se il tuo server Oracle non è supportato dalla modalità Thin

> Nota: se ricevi l’errore `NJS-138`, abilita la modalità thick impostando `DB_LIB_DIR` con il path dell’Instant Client.

## Setup da zero

### 1) Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Configura `.env` con le credenziali Oracle:
- `DB_USER`
- `DB_PASSWORD`
- `DB_CONNECT_STRING` (es. `host:port/service`)

### 2) Frontend
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Imposta `NEXT_PUBLIC_API_BASE_URL` verso il backend (es. `http://localhost:4000`).

## Avvio in produzione

Backend:
```bash
cd backend
npm install --omit=dev
npm start
```

Frontend:
```bash
cd frontend
npm install --omit=dev
npm run build
npm start
```

## Endpoint

`GET /api/update_chiamate`

Query params supportati:
- `startDate` (dd/mm/yyyy)
- `endDate` (dd/mm/yyyy)
- `comune` (testo)
- `stato` (`tutti`, `in_corso`, `da_fare`)
- `descrizione` (testo)
- `sortField` (`data_ora`, `numero_chiamata`, `comune`, `stato`, `descrizione`)
- `sortDir` (`asc`, `desc`)

Esempi:
```bash
# base (con condizione predefinita PRIORITA=3)
curl "http://localhost:4000/api/update_chiamate"

# filtro date e comune
curl "http://localhost:4000/api/update_chiamate?startDate=01/01/2024&endDate=31/01/2024&comune=Roma"

# ordinamento per descrizione
curl "http://localhost:4000/api/update_chiamate?sortField=descrizione&sortDir=asc"
```

## Modifica della condizione (PRIORITA=3)
La logica di inoltro è centralizzata in:
- `backend/src/utils/criterioInoltroProtezioneCivile.js`

C’è un blocco commentato **MODIFICA QUI** dove cambiare la condizione. Di default:
```js
return Number(chiamata.PRIORITA) === 3
```

> L’endpoint applica anche una condizione SQL equivalente per efficienza. Se cambi la logica, aggiorna anche il filtro SQL in `backend/src/services/chiamateService.js`.

## Rate limiting
L’endpoint `/api/update_chiamate` accetta **massimo 1 richiesta al secondo** globalmente. Se superato risponde `429` con:
```json
{ "error": "Troppe richieste. Attendere prima di riprovare.", "retryAfterMs": 500 }
```

## Note tecniche
- Date gestite in formato `dd/mm/yyyy` lato backend (e input utente lato frontend).
- Campo numero chiamata: viene usato `NUMERO_CHIAMATA` con fallback su `CHIAMATA`.
- Coordinate: link a Google Maps nel formato `https://www.google.com/maps?q=<lat>,<lon>` (assumendo `Y=lat` e `X=lon`).

## Struttura progetto
```
backend/
  src/
    app.js
    server.js
    config.js
    routes/
    controllers/
    services/
    db/
    utils/
    middleware/
frontend/
  src/
    pages/
    components/
    lib/
    styles/
```
