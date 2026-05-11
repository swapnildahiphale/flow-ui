# flow-ui

A local web dashboard for [flow](https://github.com/Facets-cloud/flow) — visualizes tasks, projects, knowledge base, updates, tags, and the relationships between them.

Read-only. Mutations stay in the `flow` CLI.

## Status

POC — under active scaffolding.

## What it shows

- **Tasks & projects browser** — filter by status, priority, tag, project; sort by recency / due date / staleness.
- **KB viewer** — all five KB files (user / org / products / processes / business) with cross-references back to tasks & projects.
- **Updates timeline** — chronological feed of progress notes across all tasks.
- **Knowledge graph** — nodes (tasks, projects, people, tags) and edges (assignment, waiting-on, project membership, tag co-occurrence). Cytoscape.js.
- **Insights** — waiting-on leaderboard, tag co-occurrence, stale-task clustering, activity heatmap.

## How it runs

A single Go binary that boots a localhost HTTP server and opens your browser. The React frontend is embedded into the binary at build time, so installation is one download — no `node` required at runtime.

```bash
flow-ui              # boots on a free localhost port and opens browser
flow-ui --port 7777  # pin the port
flow-ui --no-open    # don't open the browser
```

The binary reads `~/.flow/flow.db` directly in read-only mode. It never mutates anything; the `flow` CLI remains the only write path.

## Stack

- **Backend:** Go (`net/http` + `modernc.org/sqlite`, pure-Go, no CGO)
- **Frontend:** Vite + React + TypeScript + Tailwind + shadcn/ui + TanStack Query + Cytoscape.js
- **Distribution:** `//go:embed`-bundled SPA inside a single Go binary

## Build

```bash
make build       # builds ./ui (vite) + ./flow-ui (go), one binary out
make dev         # runs vite dev server + go server with proxy
make test        # go test ./...
```

## License

MIT — same as flow itself.
