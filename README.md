# BrainVault 🧠

An AI-powered knowledge management system — save URLs from anywhere on the web, and let AI extract, summarize, tag, and connect them into an interactive, Obsidian-style knowledge graph.

## Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS + React Query + React Router + Framer Motion + `d3-force` (graph physics)
- **Backend:** Node.js + Express
- **Database:** MongoDB (via Mongoose)
- **Auth:** JWT only (register / login / logout — no OAuth, no password reset, per spec)
- **AI:** Google Gemini (`gemini-1.5-flash`) for summarization/tagging, with an **automatic, silent fallback** to a local heuristic engine (keyword-frequency summarizer + tech/tag detector) if no `GEMINI_API_KEY` is set, the request fails, or the response is malformed. Saving a link never breaks because of the AI provider.

## What's fully implemented

- JWT auth (register/login/logout, `/me`, settings)
- Save-URL pipeline: metadata scraping (title/description/thumbnail/favicon/site/domain/content-type/reading time) via `cheerio`, duplicate detection, AI analysis (summary, tags, keywords, category, technologies, difficulty, related topics)
- Links: list/filter/paginate, get one, update (title/notes/tags/category/collections), favorite, pin, archive, soft-delete → trash → restore/permanently delete, empty trash
- Read Later: enable + reminder presets (tomorrow / weekend / custom date) + status (unread/reading/completed/archived)
- Collections: CRUD, nested (`parent`), link counts, default collections seeded on signup
- Tags: auto-created/incremented on save, listable for autocomplete
- Graph relationship engine: auto-computed edges from shared tags / technologies / same domain / keyword-overlap ("AI similarity") + manual user-created links, with relationship strength (0–1); graph endpoint returns nodes+edges for the current user
- Interactive graph UI: force-directed layout (d3-force), pan, zoom, node drag, hover-to-highlight connections, category color-coding, click-to-open
- Dashboard: totals, recently added, domains, categories, weekly activity, knowledge growth, reading streak placeholder, broken-link count
- Analytics endpoint: most-saved domains, most-used tags, category distribution, monthly growth, reading time by content type
- Search: structured (title/tag/domain/collection/notes) + a lightweight natural-language query parser ("Show me React authentication articles")
- Export: JSON / CSV / Markdown
- Import: Netscape-format bookmarks HTML (the format Chrome, Firefox, and Edge all export to)
- Broken-link checker: standalone script (`npm run check-links`) meant to be scheduled via cron/Task Scheduler
- Command palette (⌘K / Ctrl+K): paste-to-save from anywhere, quick nav, quick search
- Rate limiting, centralized error handling, request validation, helmet, CORS, pagination, toasts, loading skeletons
- Basic PWA scaffold (installable, service worker via `vite-plugin-pwa`)

## Known simplifications (be aware of these)

This is a big spec. A few things are implemented pragmatically rather than as separate heavy subsystems:

- **UI components** are hand-built with Tailwind in a shadcn-like visual style rather than pulling in the shadcn CLI/registry — same look, one fewer moving part.
- **"AI Similarity"** in the graph engine is a fast local keyword-overlap heuristic, not an embedding-based vector search — good enough for real relationship discovery without needing a vector DB.
- **Reading streak** is tracked as a field on the user but isn't auto-incremented by a scheduled job yet — wire up a daily job against `readLater.status` transitions or view events if you want it fully live.
- **PWA offline support** is the standard Vite PWA precache (app shell installs & updates itself); it does not include a bespoke offline queue for saving links while offline.
- The **broken-link checker** is a script you run/schedule yourself (`npm run check-links`), not a built-in background worker inside the API process.

## Project structure

```
brainvault/
├── backend/
│   ├── config/         # DB connection
│   ├── controllers/    # Route handlers
│   ├── middlewares/    # auth, error handling, rate limiting
│   ├── models/         # Mongoose schemas: User, Link, Collection, Tag, Note, Reminder, GraphEdge
│   ├── repositories/   # Query helpers (pagination etc.)
│   ├── routes/         # Express routers
│   ├── services/       # metadataService (scraping), aiService (Gemini + fallback), graphService (relationship engine)
│   ├── scripts/        # checkBrokenLinks.js
│   ├── utils/
│   ├── validators/
│   └── server.js
└── frontend/
    └── src/
        ├── components/ # layout, links, graph, command, ui
        ├── pages/       # Dashboard, AllLinks, Favorites, Collections, GraphPage, ReadLater, Archive, Trash, Settings, Login, Register
        ├── layouts/     # MainLayout (sidebar + content + right details panel)
        ├── hooks/       # React Query hooks
        ├── contexts/    # AuthContext
        ├── services/    # api.ts (fetch wrapper)
        └── types/
```

## Setup

### 1. Prerequisites
- Node.js 18+
- A MongoDB instance (local `mongod`, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)
- (Optional, recommended) A free [Gemini API key](https://aistudio.google.com/apikey) — the app works without one, just with lower-quality local summaries/tags instead of Gemini's.

### 2. Backend

```bash
cd backend
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET, and (optionally) GEMINI_API_KEY
npm install
npm run dev        # starts on http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev         # starts on http://localhost:5173, proxies /api to :5000
```

Open `http://localhost:5173`, register an account, and paste a URL into the save bar (or press ⌘K / Ctrl+K) to try the pipeline end-to-end.

### 4. (Optional) Broken link checker

```bash
cd backend
npm run check-links      # checks a batch of links, marks 4xx/5xx as broken
# schedule this with cron / Task Scheduler for periodic runs, e.g.:
# 0 * * * * cd /path/to/backend && npm run check-links
```

### 5. Production build (frontend)

```bash
cd frontend
npm run build       # outputs to frontend/dist — serve with any static host, or behind the same domain as the API
```

## Environment variables (backend/.env)

| Variable | Description |
|---|---|
| `PORT` | API port (default `5000`) |
| `CLIENT_URL` | Frontend origin, for CORS (default `http://localhost:5173`) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random secret for signing JWTs |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `GEMINI_API_KEY` | Optional — enables real AI summarization/tagging via Gemini |
| `GEMINI_MODEL` | Defaults to `gemini-1.5-flash` |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | General API rate limiting |

## Notes on quality bar

Both `backend` and `frontend` were verified in this environment: the backend's dependencies install cleanly and every file passes a Node syntax check; the frontend's dependencies install cleanly, `tsc -b` passes with no type errors, and `vite build` produces a working production bundle. You'll still want to point it at a real MongoDB instance and run through the flows yourself before calling it "done" — but the code compiles and is internally consistent end-to-end.
