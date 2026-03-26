# SO Protezione Civile

Web app per visualizzare e gestire gli interventi inoltrati dai vigili del fuoco alla protezione civile. Oracle resta la fonte primaria, MongoDB mantiene lo stato operativo e l'archivio. Il frontend include tab Attive/Archivio con cambio stato.

## Prerequisiti
- Node.js 18+ (consigliato 20+)
- Oracle Client (Instant Client) **necessario** se il tuo server Oracle non è supportato dalla modalità Thin
- MongoDB (istanza raggiungibile dal backend)

> Nota: se ricevi l'errore `NJS-138`, abilita la modalità thick impostando `DB_LIB_DIR` con il path dell'Instant Client.

## Avvio rapido (Windows)

Esegui `run.bat` dalla root del progetto: apre due terminali separati, uno per il backend e uno per il frontend.

## Setup da zero

### 1) Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Configura `.env` con:

Oracle:
- `DB_USER`
- `DB_PASSWORD`
- `DB_CONNECT_STRING` (es. `host:port/service`)
- `PRIORITA_DEFAULT` (default 2)
- `DB_LIB_DIR` (opzionale, path Instant Client per modalità thick)

MongoDB:
- `MONGO_URI`
- `MONGO_DB_NAME`
- `MONGO_COLLECTION_CHIAMATE`

Sync backend Oracle -> Mongo:
- `BACKGROUND_SYNC_ENABLED` (`true`/`false`, default `true`)
- `BACKGROUND_SYNC_INTERVAL_MS` (millisecondi, default `180000`)

Rete:
- `HOST` (default `0.0.0.0`, ascolta su tutte le interfacce)
- `PORT` (default `4000`)
- `CORS_ORIGIN` — origini consentite, separate da virgola (es. `http://172.16.21.64:3000,http://192.168.2.157:3000`)

### 2) Frontend
```bash
cd frontend
npm install
npm run dev
```

Configura `.env.local`:
- `NEXT_PUBLIC_API_BASE_URL` — URL del backend usato lato server (SSR). In produzione nel browser l'URL viene rilevato automaticamente dall'hostname corrente, quindi questa variabile è un fallback (es. `http://localhost:4000`).
- `NEXT_PUBLIC_REFRESH_MS` (intervallo refresh automatico in millisecondi, default `180000`)

## Supporto multi-rete

Il backend ascolta su `0.0.0.0` (tutte le interfacce) e all'avvio stampa in console tutti gli indirizzi IPv4 disponibili. Il frontend rileva automaticamente l'hostname dal browser e costruisce l'URL del backend di conseguenza: la stessa build funziona da reti diverse senza modifiche.

Per abilitare l'accesso da più reti, imposta `CORS_ORIGIN` con tutti gli indirizzi separati da virgola:
```
CORS_ORIGIN=http://172.16.21.64:3000,http://192.168.2.157:3000
```

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

## Flusso dati
- Il backend esegue una sync Oracle -> Mongo anche in background (startup + timer configurabile via env).
- `GET /api/update_chiamate` continua a leggere Oracle e sincronizzare Mongo quando chiamato da frontend.
- Le nuove chiamate vengono inserite in Mongo con `stato = "in attesa"`.
- Le chiamate attive e archivio vengono lette da Mongo.
- Lo stato si aggiorna **solo** su Mongo (Oracle non viene modificato).

## Endpoint

### `GET /api/update_chiamate`
Fetch Oracle + sync verso Mongo (solo nuove).

### `GET /api/attive`
Restituisce chiamate con `stato` in: `in attesa`, `in carico`.

### `PATCH /api/chiamate/stato`
Body:
```json
{ "id": "<uniqueKey>", "stato": "in carico" }
```
Regole:
- `in carico` -> `presaInCaricoAt = now`
- `concluso` -> `conclusaAt = now`
- `non più necessario` -> `nonPiuNecessarioAt = now`
- Se lo stato torna indietro, i timestamp successivi vengono rimossi.

### `GET /api/archivio`
Query obbligatori:
- `dateFrom` (dd/mm/yyyy)
- `dateTo` (dd/mm/yyyy)
- `dateFieldMode`: `dataChiamata` | `dataStatoFinale`

Query opzionali:
- `stati` (lista separata da virgola: `concluso,non più necessario`)

### `GET /api/filters`
Valori univoci per `comuni` e `descrizioni`.

## Stato e archivio
- **Tab Attive**: `in attesa`, `in carico` con pulsante "Cambia stato".
- **Tab Archivio**: ricerca per date (obbligatoria) su `dataChiamata` o `dataStatoFinale`. Possibile cambiare stato anche da qui.

## Identificatore univoco
Il `numero chiamata` è progressivo giornaliero, quindi **non è univoco**. L'identificatore usato in Mongo è:
```
<NUMERO_CHIAMATA>-<DATA_CHIAMATA>-<ORA_CHIAMATA>-<COMUNE>
```

## Modifica della condizione (PRIORITA=2)
La logica di inoltro è centralizzata in:
- `backend/src/utils/criterioInoltroProtezioneCivile.js`

Nel blocco **MODIFICA QUI** puoi cambiare il criterio. Di default:
```js
const target = Number.isFinite(opts.prioritaDefault) ? opts.prioritaDefault : 2
return Number(chiamata.PRIORITA) === target
```

## Rate limiting
`/api/update_chiamate`: massimo **1 richiesta al secondo** globalmente.

## Note tecniche
- Date gestite in formato `dd/mm/yyyy` lato backend.
- Coordinate: link Google Maps nel formato `https://www.google.com/maps?q=<lat>,<lon>` (assumendo `Y=lat` e `X=lon`).

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
