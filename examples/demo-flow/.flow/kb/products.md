# Products

## Tideline — habit & focus analytics SaaS
The main product. A web app that turns daily focus sessions into legible
analytics: streaks, focus-time trends, and a weekly email digest.

Core surfaces:
- **Streaks** — the headline feature; the [streak dashboard](../tasks/streak-dashboard/brief.md)
  is the current build.
- **Focus sessions** — timed deep-work blocks that feed the rollups (the daily
  rollup job is where the [timezone bug](../tasks/timezone-bug/brief.md) lives).
- **Weekly digest** — a Monday email summarizing the prior week (`weekly-digest`,
  still backlog).

Built and deployed by [tideline-infra](../projects/tideline-infra/brief.md).
Pricing and customers are in [business.md](business.md).

## confetti-rs — open-source particle library
A small Rust crate for confetti/particle effects, MIT-licensed. I maintain it
because it's fun and it's a nice showcase. The [v0.4 release](../tasks/wasm-release/brief.md)
adds a WASM target so it runs in the browser — which, not coincidentally, is how
Tideline celebrates a completed streak.

Release cadence and review rules for both products are in [processes.md](processes.md).
