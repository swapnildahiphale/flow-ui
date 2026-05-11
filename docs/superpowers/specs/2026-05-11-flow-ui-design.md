# flow-ui v1 — Design Spec

Date: 2026-05-11
Status: Approved (pending user review)
Owner: Swapnil Dahiphale
Task: `flow-ui` (under project `flow-itself`)

## 1. Purpose

A local web dashboard for [flow](https://github.com/Facets-cloud/flow) that surfaces tasks, projects, knowledge base, updates, tags, sessions, and the relationships between them. Visual, fast, distinctive — not a generic CRUD admin.

**Read-only.** Mutations stay in the `flow` CLI. The dashboard reads `~/.flow/flow.db` (SQLite) and `~/.flow/{projects,tasks,playbooks,kb}/**` (markdown). It never writes.

## 2. Constraints

- **Distribution:** single Go binary. The React build is embedded via `//go:embed`. The user installs one binary; no Node runtime needed.
- **DB access:** SQLite, read-only (`mode=ro&_pragma=busy_timeout(5000)&_pragma=query_only(1)`).
- **Schema source of truth:** the `flow` binary owns the schema. flow-ui mirrors model shapes for decoupling but doesn't migrate or alter.
- **Local-only:** bind `127.0.0.1`. No auth, no `0.0.0.0`, no external interfaces.
- **No CGO:** `modernc.org/sqlite` only. Mirrors flow's own discipline.
- **Read-only by contract:** API surface is `/api/v1/*`. No write endpoints exist; future mutations must shell out to `flow` rather than touch the DB.

## 3. Stack

| Layer | Choice |
|---|---|
| Backend | Go (stdlib `net/http` route patterns) + `modernc.org/sqlite` |
| Frontend framework | Vite + React + TypeScript |
| Styling | Tailwind CSS v4 + customized shadcn/ui |
| Data fetching | TanStack Query |
| Routing | TanStack Router (file-based) |
| Motion | framer-motion |
| Markdown | `marked` + `dompurify` (client-side rendering) |
| Graph | Cytoscape.js (vanilla, no React wrapper) |
| Icons | `@phosphor-icons/react`, `weight="regular"` |

## 4. Architecture

```
flow-ui/
├── cmd/flow-ui/main.go             # CLI entry, listener, browser-open
├── internal/
│   ├── server/server.go            # HTTP mux, SPA fallback, dev/prod split
│   ├── db/                         # Read-only SQLite open, models, queries
│   └── api/                        # JSON handlers /api/v1/*
├── ui/                             # Vite React app
│   ├── src/
│   │   ├── routes/                 # File-based routes
│   │   ├── components/             # Shared components + shadcn under ui/
│   │   ├── lib/api.ts              # Typed API client
│   │   └── lib/markdown.ts         # Markdown render helpers
│   ├── index.html, vite.config.ts, tailwind.config.ts, package.json
├── embed.go                        # //go:embed ui/dist  (added at end)
├── docs/superpowers/specs/         # Design specs
├── design/                         # Static HTML mockups for review
└── go.mod, Makefile, CLAUDE.md, README.md
```

### 4.1 Dev vs prod

- **Dev (`make dev`):** Vite on `:5173` proxies `/api/*` to Go on `:7777`. Go server starts with `--dev` and does not serve the embedded SPA.
- **Prod (`make build` → `./flow-ui`):** Go server serves the embedded SPA at `/` (with SPA fallback for client routes) and the API at `/api/v1/*`.

## 5. Information Architecture

**Chrome:** persistent left sidebar is the sole navigation surface. 230px expanded → 64px icon-only collapsed (state in `localStorage`). Bottom of sidebar shows live-sessions dot linking to running-sessions view. The top bar holds only the brand wordmark and the `Cmd+K` Search button — no top tabs. Active sidebar item gets a soft-emerald pill background plus a 3px emerald accent bar on its inner edge.

**Routes (v1, full scope):**

| Path | Page |
|---|---|
| `/` | Overview (bento) |
| `/tasks` | Filterable list |
| `/tasks/:slug` | Task detail (brief + updates + metadata rail) |
| `/projects` | Project list (2-col zigzag) |
| `/projects/:slug` | Project detail |
| `/kb` | KB landing (5 file tiles) |
| `/kb/:file` | One KB file (full reader + TOC) |
| `/timeline` | Updates chronological |
| `/graph` | Cytoscape full-bleed |
| `/playbooks` | Playbooks list |
| `/playbooks/:slug` | Playbook detail with run sub-list |

Plus a global `Cmd+K` palette for jump-to-task/project (shadcn `command`).

## 6. Page Designs

### 6.1 Overview (`/`)

Bento 2.0 grid. Hero: "Today<span class="accent">.</span>" + mono date + live-sessions dot + "Resume last" soft-accent button. Focal stat tile "In flight" with accent-tinted soft gradient and a breathing accent halo, 7-bar activity sparkline, and high/medium/low breakdown. Right rail uses `border-t` dividers (no card boxes) for Waiting / High backlog / Overdue.

**In-flight task rows (compact summary form, Overview only):**
- Grid: `12px | minmax(0,1fr) | auto`.
- Left: status dot (live = pulse, stale = static slate).
- Middle: stacked slug (mono) + project eyebrow on row 1, task name truncated on row 2.
- Right: status chip on top (`in flight` / `waiting · <name>` / `stale · Nd`), single mono meta line below combining relative + absolute timestamp (e.g., `just now · 16:58`).
- Tags are **not** rendered on Overview rows — they live on the dedicated Tasks page where the row has room. The Tag cloud panel surfaces them globally on Overview instead.

Below the in-flight list: a 14-day project-activity carousel (Bento Archetype #4 — seamless `translateX(-50%)` loop) and a Recent updates feed (last 5 across all tasks, anchored-timestamp pattern). Right column of the lower bento: Waiting-on leaderboard + Tag cloud.

### 6.2 Tasks (`/tasks`)

Asymmetric layout. Left rail (280px) holds filter groups: status, priority, project, tags. Main area: search input + sparse `divide-y` rows. Each row: status dot (pulsing if live session), slug (mono, small), project chip (uppercase mini-label), name, tags (chips), waiting/overdue/stale badge, mono `updated_at` timestamp. Click row → navigate `/tasks/:slug`.

**Stale criterion (v1):** `status = 'in-progress' AND updated_at < now - 7 days`. Computed in the API response so the frontend doesn't fight time zones.

### 6.3 Task detail (`/tasks/:slug`)

Two-column on `lg:`. Left: brief.md rendered (sticky in-page TOC for long briefs), then updates timeline below. Right: sticky metadata rail (status / priority / due / waiting / assignee / session_id + state / tags / workdir / created / updated). A "Resume in terminal" hint with copy-to-clipboard for `flow do <slug>`. Read-only.

### 6.4 Projects (`/projects`)

2-column zigzag layout. Each project: name (display-size), priority chip, work_dir mono path (truncated), task rollup (`6 IP · 3 BL · 1 done`), most-recent-activity mono timestamp, top tags. Click → `/projects/:slug`.

### 6.5 Project detail (`/projects/:slug`)

Mirrors task detail. Left: brief, then nested tasks list (status grouped), then project updates timeline. Right: metadata rail (status / priority / workdir / created / counts).

### 6.6 KB (`/kb`)

Landing: 5 tiles (user / org / products / processes / business) with last-modified mono timestamp and approx entry count. Tile click → `/kb/:file`.

KB reader: full-page markdown render, sticky right-rail TOC built from headings. Cross-reference layer: post-render walk turns any token matching a known task slug, project slug, or `#tag` into an internal link to the corresponding page.

### 6.7 Timeline (`/timeline`)

Vertical thread of all updates grouped by day. Day header (`MON 11 MAY`, uppercase tracking-wide). Entry: time (mono), task slug pill, project chip, body excerpt (first 2 lines), expand-on-click for full body. Top filter chips: by project, by task, by date range (today / this week / 30d / all).

### 6.8 Graph (`/graph`)

Cytoscape full-bleed canvas (`min-h-[100dvh]`, no `max-w-7xl`). Nodes:
- Tasks — circle, size = recent activity (last 14d updates)
- Projects — rounded square
- People (from `waiting_on`, `assignee`) — small circle
- Tags — diamond

Edges:
- `task → project` (membership, neutral)
- `task → person` (waiting/assignee, amber)
- `task → tag` (tag, accent)

Layout: `cose` (compound spring). Floating filter panel top-right (collapsible, glass material). Click node → glass mini-card with key facts and a "Open" link to the entity's page.

### 6.9 Playbooks (`/playbooks` + detail)

List mirrors Projects. Detail mirrors Task detail but renders `Each run does` body and a Runs sub-list (each run is a task with `kind=playbook_run`, linked).

## 7. API Contract (v1)

```
GET  /api/v1/health                                -> {"status":"ok"}
GET  /api/v1/stats                                 -> headline counts
GET  /api/v1/tasks                                 -> {tasks:[], count:N}
       ?status&priority&project&tag&kind&archived
GET  /api/v1/tasks/{slug}                          -> Task
GET  /api/v1/tasks/{slug}/brief                    -> {markdown:"..."}      [NEW]
GET  /api/v1/tasks/{slug}/updates                  -> {updates:[{file,date,body}]} [NEW]
GET  /api/v1/projects                              -> {projects:[]}
GET  /api/v1/projects/{slug}                       -> Project               [NEW]
GET  /api/v1/projects/{slug}/brief                 -> {markdown}            [NEW]
GET  /api/v1/projects/{slug}/updates               -> {updates:[]}          [NEW]
GET  /api/v1/projects/{slug}/tasks                 -> {tasks:[]}            [NEW]
GET  /api/v1/playbooks                             -> {playbooks:[]}        [NEW]
GET  /api/v1/playbooks/{slug}                      -> Playbook              [NEW]
GET  /api/v1/playbooks/{slug}/brief                -> {markdown}            [NEW]
GET  /api/v1/playbooks/{slug}/runs                 -> {runs:[]}             [NEW]
GET  /api/v1/kb                                    -> {files:[{name,size,mtime,entries}]} [NEW]
GET  /api/v1/kb/{file}                             -> {markdown,mtime}      [NEW]
GET  /api/v1/timeline?since=...&project=&task=     -> {entries:[]}          [NEW]
GET  /api/v1/graph                                 -> {nodes:[], edges:[]}  [NEW]
GET  /api/v1/tags                                  -> {tags:[{tag,count}]}
```

`[NEW]` = to be implemented; the bare list/show endpoints + stats + tags are already in place.

## 8. Data Flow

- TanStack Query: `staleTime: 30s`, `refetchInterval: 15s` (gentle polling). No websockets.
- Single API client `ui/src/lib/api.ts` with typed shapes mirroring Go models.
- Markdown rendered client-side with `marked` + `dompurify`. Renders include a post-pass that wraps cross-references (slugs/tags) in internal `<Link>`s.
- Updates and briefs live on disk, not in SQLite. The server walks `~/.flow/{tasks,projects,playbooks}/<slug>/updates/*.md`, parses the leading `YYYY-MM-DD-` from each filename for date, and reads file content on demand. KB files are flat `~/.flow/kb/{user,org,products,processes,business}.md`. The `/api/v1/timeline` endpoint walks all `tasks/*/updates/*.md` (and project equivalents) once per request, sorts by parsed date, paginates with `?since=YYYY-MM-DD`.
- No mutations from the UI. The "Resume in terminal" affordance is copy-to-clipboard, not a fetch.
- Sidebar state, KB last-visited file, and filter selections cached in `localStorage`.

## 9. Design System (pinned from design-taste-frontend)

**Dials:** DESIGN_VARIANCE 8 · MOTION_INTENSITY 6 · VISUAL_DENSITY 4.

### Typography
- Sans `Geist` (300/400/500/600/700). Mono `Geist Mono` (400/500). **Inter BANNED. Serifs BANNED.**
- Display: `text-4xl md:text-6xl tracking-tighter leading-none font-medium`. Hierarchy via weight + color, not just scale.
- Body: `text-base text-slate-600 leading-relaxed max-w-[65ch]`.
- Numbers, IDs, timestamps, slugs: always `font-mono tabular-nums`.

### Color
- Background `#f9fafb`. Pure black BANNED — use `text-zinc-950` / `text-slate-900`.
- Single accent: **Emerald** (`#10b981`). Saturation under 80%. No glow. AI purple/blue gradients BANNED.
- Status: `in-progress` emerald · `backlog` zinc-400 · `done` zinc-300 · `waiting` amber-600 · `overdue` rose-600. Used sparingly, never decoratively.
- Cards: `bg-white` + `border-slate-200/50`. Diffusion shadow `shadow-[0_20px_40px_-15px_rgba(15,23,42,0.05)]` only when elevation has meaning.

### Layout & Spacing
- Container `max-w-7xl mx-auto px-8`. Graph route is full-bleed.
- Cards: `rounded-[2.5rem]` for hero bento, `rounded-2xl` for inline panels.
- Card interior padding `p-8` / `p-10`.
- 3-equal-cards row BANNED. Use 2-col zigzag, asymmetric grids, or `divide-y` rows.
- Cards used ONLY where elevation/grouping is meaningful; tasks list is `divide-y` rows.
- Hero heights `min-h-[100dvh]`, never `h-screen`.
- Mobile collapse below `md:`: `w-full px-4 py-8` single column.

### Motion
- framer-motion. Spring default `type:"spring", stiffness:100, damping:20`. No linear easing on interactive elements.
- Perpetual micro-animations:
  - Live-session dot: CSS keyframe pulse loop.
  - Stale-task chip: CSS keyframe shimmer.
  - Stat tile accent corner: gentle 6s breathing.
- Stagger-in on list mount: parent `staggerChildren: 0.04`. Parent and children in the same client component subtree.
- Layout transitions: `layout` and `layoutId` on filter changes for smooth reordering.
- No magnetic buttons. Restrained.
- Hardware acceleration: animate only `transform` + `opacity`. Memoize perpetual-motion components. Isolated leaves with `'use client'` (N/A in Vite, but same isolation rule applies).

### Materials
- Liquid glass: Cmd+K palette + graph filter panel only. Inner border `border-white/10` + inner shadow `inset 0 1px 0 rgba(255,255,255,0.1)`.
- No noise overlays on scrolling containers.

### Icons & Assets
- `@phosphor-icons/react` `weight="regular"` everywhere. No emojis in code, markup, copy, or alt text.
- No avatars in v1 (no real user photos).

### Forbidden (AI tells)
Pure black · neon/outer glows · AI purple-blue gradients · `Inter` · oversized screaming H1 · 3-equal-cards row · startup-slop names · filler verbs (Elevate / Seamless / Unleash) · Unsplash · custom mouse cursors · arbitrary `z-50` spam · default shadcn appearance.

### Pre-flight check (every PR)
- [ ] Global state minimal
- [ ] Mobile collapse below `md:` on every page
- [ ] `min-h-[100dvh]` not `h-screen`
- [ ] All `useEffect` animations have cleanup
- [ ] Empty / loading / error states implemented
- [ ] Cards only where elevation is meaningful
- [ ] Perpetual motion isolated + memoized

## 10. Edge Cases

- **No tasks / no projects / no playbooks:** warm empty state. Copy contains the exact CLI command the user would run (e.g., `flow add task "..."`). Never invent commands; quote `flow` errors verbatim if the empty state stems from an error path.
- **Schema drift:** queries `SELECT` named columns. On `no such column`, server returns `409` with `{"error":"upgrade flow to vX for this view"}`. Frontend renders a friendly upgrade banner.
- **DB locked / busy:** `busy_timeout=5000` covers most cases. On persistent failure, TanStack Query auto-retries; UI shows a small toast "flow is writing — retrying".
- **Missing `~/.flow/flow.db`:** Go server fails fast at startup with clear stderr message ("not initialized; run `flow init`").
- **Missing markdown file:** API returns `404`; UI renders inline "file removed since last query" placeholder.
- **Very long briefs / updates:** clamp the in-page TOC to a fixed-height scroll area; main column scrolls naturally.
- **0 graph nodes:** graph route shows an empty state with hint, no Cytoscape canvas.

## 11. Testing

- **Backend:** Go table-driven tests for query layer + handlers, against a fixture `~/.flow`-like temp directory built once via test helpers.
- **Frontend:** Vitest + React Testing Library for the highest-leverage units — filter logic, the cross-reference parser, and the timeline grouper. Visual review covers the rest.
- **Smoke:** `make smoke` boots the binary, hits `/api/v1/health` and `/api/v1/stats`, asserts non-zero counts, kills.

## 12. Out of Scope (v1)

- Mutations of any kind.
- Multi-user, hosted version, auth.
- Mobile-first layouts (mobile collapses cleanly but isn't the primary target).
- Real-time WebSocket push.
- AI summarization of updates or KB.
- Export (PDF/CSV).
- Insights as a separate route — insights surface on Overview only in v1.

## 13. Open Questions

None blocking. Items deferred to implementation discretion:
- Exact cose layout tuning for the graph (will iterate during build).
- Cmd+K result ranking heuristic (start naive: prefix match → fuzzy).
- Whether to show archived rows behind a toggle (default: off in v1; revisit post-ship).
