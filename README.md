# flow-ui

A local web dashboard for [flow](https://github.com/Facets-cloud/flow) — visualizes tasks, projects, knowledge base, updates, tags, and the relationships between them.

Read-only. Mutations stay in the `flow` CLI.

## Install

In any Claude Code session, paste this:

> Install flow-ui from https://github.com/swapnildahiphale/flow-ui

Claude reads the repo, downloads the binary for your platform, drops it on your `$PATH`, and tells you how to launch it.

<details>
<summary>Manual install (curl + chmod)</summary>

```bash
# Pick your platform. ARM Macs use darwin-arm64; Intel Macs use darwin-amd64; Linux uses linux-amd64.
OS=darwin
ARCH=arm64

curl -fsSL -o /usr/local/bin/flow-ui \
  "https://github.com/swapnildahiphale/flow-ui/releases/latest/download/flow-ui-${OS}-${ARCH}"
chmod +x /usr/local/bin/flow-ui
xattr -d com.apple.quarantine /usr/local/bin/flow-ui 2>/dev/null || true

flow-ui
```

The `xattr` step is macOS-only — it removes Gatekeeper's quarantine attribute so the unsigned binary will run. Harmless on Linux.

</details>

flow-ui has no install step of its own — it reads `~/.flow/flow.db` directly. You need [flow](https://github.com/Facets-cloud/flow) installed and initialized (`flow init`) first.

## Upgrade

In any Claude Code session, paste this:

> Upgrade flow-ui from https://github.com/swapnildahiphale/flow-ui

Check the running version with `flow-ui --version`.

## What it shows

- **Tasks & projects browser** — filter by status, priority, tag, project; sort by recency / due date / staleness.
- **KB viewer** — all five KB files (user / org / products / processes / business) with cross-references back to tasks & projects.
- **Updates timeline** — chronological feed of progress notes across all tasks.
- **Knowledge graph** — nodes (tasks, projects, people, tags) and edges (assignment, waiting-on, project membership, tag co-occurrence).
- **Insights** — waiting-on leaderboard, tag co-occurrence, stale-task clustering, activity heatmap.

## How it runs

A single Go binary that boots a localhost HTTP server and opens your browser. The React frontend is embedded into the binary at build time, so installation is one download — no `node` required at runtime.

```bash
flow-ui              # boots on a free localhost port and opens browser
flow-ui --port 7777  # pin the port
flow-ui --no-open    # don't open the browser
flow-ui --version    # print version and exit
```

The binary reads `~/.flow/flow.db` directly in read-only mode. It never mutates anything; the `flow` CLI remains the only write path.

## Stack

- **Backend:** Go (`net/http` + `modernc.org/sqlite`, pure-Go, no CGO)
- **Frontend:** Vite + React + TypeScript + Tailwind + shadcn/ui + TanStack Query + React Flow
- **Distribution:** `//go:embed`-bundled SPA inside a single Go binary

## For contributors

Building from source requires Go, Node 20+, and pnpm 9+.

```bash
make build       # builds ./ui (vite) + ./flow-ui (go), one binary out
make dev         # runs vite dev server + go server with proxy
make test        # go test ./...
make smoke       # build + boot + curl the API
make install     # build + move binary into $GOBIN or $GOPATH/bin
```

Releases are cut by pushing a `vMAJOR.MINOR.PATCH` tag — the `release.yml` workflow builds all three target binaries with `CGO_ENABLED=0` and publishes them to GitHub Releases.

## License

MIT — same as flow itself.
