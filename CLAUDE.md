# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Does

Web app for fire department operators to view and manage civil protection interventions. Oracle is the read-only source of truth; MongoDB tracks local operational state (status changes, timestamps).

## Running the App

```bat
run.bat          # Opens two CMD terminals: backend + frontend
```

Or manually:

```bash
cd backend && npm run dev    # Starts Express on port 4000
cd frontend && npm run dev   # Starts Next.js on port 3000
```

## Environment Setup

- `backend/.env` — Oracle credentials, MongoDB URI, CORS origins, sync intervals
- `frontend/.env.local` — `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_REFRESH_MS`

See `.env.example` / `.env.local.example` for required variables.

## Architecture

### Data Flow

```
Oracle DB (CHIAMATE_INTERVENTI, PRIORITA=2)
    ↓  (sync on startup + every N minutes)
MongoDB (operational state: status, timestamps)
    ↓
Express REST API (port 4000)
    ↓
Next.js frontend (port 3000, auto-refresh every 3 min)
```

### Backend (`backend/src/`)

- `server.js` — entry point; initializes Mongo, starts Express, runs background sync
- `app.js` — Express setup, CORS (multi-origin), Morgan logging
- `config.js` — all env vars with defaults
- `routes/chiamateRoutes.js` — API route definitions
- `controllers/chiamateController.js` — request handlers
- `services/chiamateService.js` — Oracle queries
- `services/chiamateMongoService.js` — MongoDB CRUD
- `db/oracle.js` — Oracle connection pool (supports Thick mode via `DB_LIB_DIR`)
- `db/mongo.js` — MongoDB connection + index creation
- `utils/criterioInoltroProtezioneCivile.js` — filter logic (e.g., `PRIORITA = 2`)
- `middleware/rateLimit.js` — 1 req/sec on the update endpoint

### Frontend (`frontend/src/`)

- `pages/index.js` — main page: Attive / Archivio / Mappa tabs, filter state, auto-refresh, status-change modal
- `components/InterventiTable.js` — sortable, expandable table
- `components/InterventiMap.js` — Leaflet map of active interventions
- `components/Filters.js` — filter controls
- `lib/api.js` — all fetch calls to backend

### Key Design Decisions

**Unique ID:** `<NUMERO_CHIAMATA>-<DATA_CHIAMATA>-<ORA_CHIAMATA>-<COMUNE>` — because `NUMERO_CHIAMATA` resets daily.

**Status workflow:**
- Active: `in attesa` → `in carico`
- Closed: `concluso` or `non più necessario`
- Reverting a status clears later timestamps (`presaInCaricoAt`, `conclusaAt`, `nonPiuNecessarioAt`)

**Frontend API URL:** Detected dynamically at runtime from `window.location.hostname` so the app works across different network interfaces without rebuild.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/update_chiamate` | Sync Oracle → Mongo (rate limited) |
| GET | `/api/attive` | Active interventions |
| GET | `/api/archivio` | Archive (params: `dateFrom`, `dateTo`, `dateFieldMode`, `stati`) |
| PATCH | `/api/chiamate/stato` | Update intervention status |
| GET | `/api/filters` | Unique comuni and descrizioni values |
