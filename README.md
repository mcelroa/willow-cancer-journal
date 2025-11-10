Cancer Journal (MVP)

Local‑first web app to log daily cancer treatment symptoms and see trends over time.

Tech
- Vite + React + TypeScript
- Offline‑first PWA (manifest + service worker)
- No backend; data stored locally in `localStorage`

Features
- Journal: mood (1–10), pain, fatigue, nausea (0–10), notes, tags
- History: filter, edit, delete (with confirmation)
- Trends: quick ranges (7/30/All) and optional smoothing (Off/7/30‑day)
- Export: JSON/CSV; Import JSON with conflict handling
- Backups: periodic reminder and one‑click JSON backup

Getting started
- Dev: `npm run dev`
- Build: `npm run build`
- Preview prod build: `npm run preview`

PWA
- Manifest: `public/manifest.webmanifest`
- Service worker: `public/sw.js` (cache version `cj-v2`)
- Icons: SVG in `public/icon.svg` and `public/icon-maskable.svg`; generate PNGs (192/512) from Export page and place them in `public/`.

Data & privacy
- Entries are stored only on your device in `localStorage` under `cancerJournal.v1.entries`.
- Backups you download are JSON files you control; no data leaves your device.

Release
- Current version: 0.1.0 (see `CHANGELOG.md`)
- After changes that affect static assets, bump the SW cache name in `public/sw.js` (e.g., `cj-v3`) so clients refresh promptly.

Notes for development
- Type‑only imports are used (`import type { ... }`) due to `verbatimModuleSyntax`.
- Storage helpers: `src/storage.ts` (sanitize, upsert, delete, CSV, import merge)
- UI primitives: `src/toast.tsx` (toasts), `src/confirm.tsx` (confirm modal)

Roadmap ideas
- Settings: toggle backup reminders, default start tab
- Trends: per‑series visibility toggles; moving average per metric
- Storage versioning + migrations
- Enhanced import validation and reporting
