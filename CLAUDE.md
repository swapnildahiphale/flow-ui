# CLAUDE.md

Repo conventions for `flow-ui`. Read this before editing.

## What this is

A local web dashboard for the [flow](https://github.com/Facets-cloud/flow) CLI. Reads `~/.flow/flow.db` (SQLite) in read-only mode and surfaces tasks, projects, KB, updates, tags, and graph/insights views.

**Read-only by design.** Mutations live in the `flow` CLI. Do not add write paths to the database from this app, ever.

## Stack

- **Backend (`cmd/flow-ui`, `internal/`):** Go. `net/http` + `modernc.org/sqlite` (pure Go, no CGO). Single binary distribution.
- **Frontend (`ui/`):** Vite + React + TypeScript + Tailwind + shadcn/ui + TanStack Query + React Router + Cytoscape.js.
- **Build:** `make build` runs `pnpm build` in `ui/`, then `go build` embeds `ui/dist/` via `//go:embed`.

## Layout

```
flow-ui/
├── cmd/flow-ui/main.go         # CLI entry — flags, server start, browser open
├── internal/
│   ├── server/                 # HTTP server, route mounting, static embed
│   ├── db/                     # Read-only SQLite open + model structs + queries
│   └── api/                    # JSON handlers under /api/*
├── ui/                         # Vite React app (separate workspace)
│   ├── src/
│   │   ├── routes/             # One file per route
│   │   ├── components/         # Shared components (incl. shadcn under components/ui/)
│   │   ├── lib/                # api client, helpers
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
├── embed.go                    # //go:embed ui/dist
├── go.mod
├── Makefile
└── README.md
```

## Rules

- **DB is read-only.** Open with `?mode=ro` and `_query_only=1`. Never `INSERT`, `UPDATE`, or `DELETE`. If the user asks for a feature that needs a mutation, route it through the `flow` CLI as a subprocess — don't bypass.
- **No CGO.** `modernc.org/sqlite` only. Matches the parent project's discipline.
- **Single binary distribution.** The React build is embedded; don't ship `ui/dist/` separately or assume Node at runtime.
- **API contract is `/api/v1/*`.** All JSON. Version the prefix from day one so the SPA can pin a version if we ever break the shape.
- **No auth.** Localhost-only, bind to `127.0.0.1`. Never `0.0.0.0` or external interfaces.
- **`internal/db` mirrors flow's schema.** Schema is `~/.flow/flow.db`. Don't reimplement migrations — flow owns the schema. If a column is missing, the user needs to upgrade flow first; surface a clear error.

## Build commands

```bash
make build       # pnpm -C ui install && pnpm -C ui build && go build -o flow-ui ./cmd/flow-ui
make dev         # concurrent: pnpm -C ui dev + go run ./cmd/flow-ui --dev (proxies /api to go)
make test        # go test ./...
make clean       # rm -rf ui/dist ui/node_modules flow-ui
```

## Development pattern

`make dev` runs Vite on `:5173` with a proxy for `/api/*` to the Go server on a separate port. In dev mode the Go server doesn't serve the embedded SPA — Vite does — but `/api/*` is served by Go for live data.

In production (`make build` output), the Go server serves both `/api/*` and the embedded SPA from `ui/dist/`.

## Things to watch out for

- **Schema drift.** flow may add columns. Queries should `SELECT` specific columns, not `SELECT *`. If a column is missing at query time, fail with a friendly "upgrade flow to version X" message.
- **Concurrent writers.** flow runs its CLI concurrently; the read-only handle should be opened with `_busy_timeout=5000` to ride out short write windows.
- **Markdown rendering.** KB files, briefs, and updates are markdown. Use a tested renderer (`marked` + `dompurify` on the frontend, or render server-side via `goldmark`). Don't roll your own.
- **No real-time push.** Auto-refresh via TanStack Query's `refetchInterval` is fine. No websockets.
