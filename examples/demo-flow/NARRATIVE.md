# Demo dataset narrative — "Ren Okafor"

Fictional. No resemblance to any real person/company. Designed so every
flow-ui surface (Overview, Tasks, Project detail, KB, Timeline, Playbooks,
Graph) renders rich and legible, and the **Graph** view in particular looks
striking (good node/edge density via deliberate tag co-occurrence, assignees,
and waiting-on edges).

## Persona
**Ren Okafor** — a solo indie developer building a small analytics SaaS and
maintaining an open-source library on the side. Relatable to the LinkedIn dev
audience; no enterprise-org complexity. Works with two part-time collaborators
and one designer.

## People (graph nodes via assignee / waiting-on)
- **Mara** — part-time backend collaborator.
- **Devin** — part-time frontend collaborator.
- **Priya** — contract designer.
- **"Stripe support"**, **"Apple review"** — non-person waiting-on targets (show external blockers).

## Projects (3 active + 2 low)
1. **tideline-app** (high) — the SaaS: a habit & focus analytics web app.
2. **tideline-infra** (medium) — deploy/observability/infra for Tideline.
3. **confetti-rs** (medium) — open-source Rust confetti/particles lib Ren maintains.
4. **personal** (low) — misc personal tasks (keeps a low-pri project in the mix).
5. **tideline-site** (low) — the public marketing/landing site for Tideline (hero, feature blurbs, $8/mo pricing). Front door for GA; low-pri until launch is in sight. work_dir `repos/tideline-site`.

## Tasks (~23; spread across status / priority / tags / due / waiting / assignee)
Tags vocabulary (with intentional co-occurrence): `#frontend #backend #api #bug #p0 #research #design #release #docs #oss #infra`

tideline-app:
1. Ship streak-tracking dashboard — in-progress, high, `#frontend #release`, assignee Devin, due +3d.
2. Fix timezone bug in daily rollups — in-progress, high, `#backend #bug #p0`, assignee Mara.
3. Design empty-states for analytics — in-progress, medium, `#design #frontend`, waiting_on "Priya (mocks)".
4. OAuth login (Google + GitHub) — backlog, high, `#backend #api`.
5. Onboarding redesign — backlog, medium, `#design #frontend`, assignee Priya.
6. Stripe billing integration — backlog, high, `#api #backend`, waiting_on "Stripe support (webhook allowlist)".
7. Weekly email digest — backlog, low, `#backend`.
8. Public roadmap page — done, low, `#frontend #docs`.
9. Migrate charts to Recharts — done, medium, `#frontend`.

tideline-infra:
10. Set up Grafana dashboards — in-progress, medium, `#infra #research`, assignee Mara.
11. Blue/green deploy script — backlog, medium, `#infra`.
12. Nightly DB backups to S3 — done, high, `#infra #p0`.
13. Cut prod hosting cost — backlog, low, `#infra #research`.

confetti-rs:
14. v0.4 release: WASM target — in-progress, medium, `#oss #release #research`.
15. Fix panic on zero-particle emit — done, high, `#oss #bug`.
16. Write docs site + examples — backlog, medium, `#oss #docs`, waiting_on "community PR review".
17. Reduce binary size — backlog, low, `#oss #research`.
18. App Store-style demo gif for README — backlog, low, `#oss #docs`, waiting_on "Apple review".

personal:
19. Renew domain + TLS certs — backlog, medium, `#infra`, due +10d.
20. Write launch blog post — backlog, low, `#docs`, due overdue (-2d) → shows stale ⚠.

tideline-site (the 5th project — mix of statuses, reuses existing tags):
21. Build landing page hero + pricing (`site-landing-page`) — in-progress, medium, `#frontend #design`, assignee Devin. Update note: hero scaffolded, copy waiting on Priya.
22. Write product copy + feature blurbs (`site-product-copy`) — backlog, low, `#docs #design`, waiting_on "Priya (brand mocks)".
23. Set up analytics + SEO meta (`site-analytics-seo`) — done, low, `#frontend #infra`. Update note: analytics + SEO meta live.

## KB (all 5 files, with cross-references)
- **user.md** — Ren: solo founder/dev; prefers deep-work mornings; ships small & often; hates long meetings; uses flow + Claude Code daily. Cross-ref tideline-app.
- **org.md** — the three collaborators (Mara/backend, Devin/frontend, Priya/design) + how they split work; cross-ref the tasks they own.
- **products.md** — Tideline (analytics SaaS: streaks, focus sessions, weekly digest) + confetti-rs (OSS particles lib). Cross-ref projects.
- **processes.md** — deploy ritual (blue/green, nightly backups), review rule (every PR reviewed before merge), release cadence (Fridays). Cross-ref tideline-infra.
- **business.md** — Tideline early customers (a few fictional indie/studio names), simple $8/mo pricing, ~120 beta users. Cross-ref tideline-app billing task.

## Updates (progress notes — populate Task detail + Timeline)
- tideline-app #1 (streak dashboard): 1 note ("charts wired, polishing empty states").
- tideline-app #2 (timezone bug): 1 note ("root-caused to UTC offset in rollup job; fix in review").
- confetti-rs #14 (WASM): 1 note ("wasm-bindgen building; perf tuning the draw loop").
- Project-level note on tideline-app ("beta at 120 users; billing is the gate to GA").

## Playbooks (+ runs → Playbooks list/detail + runs sub-list)
Three playbooks, all `tideline-app`, each with a real brief and dated done-runs
(work_dir = `repos/tideline-app`; runs modeled as `kind='playbook_run'` tasks
with snapshotted brief + an updates/ note):
- **weekly-review** — "Every Friday: list shipped, in-flight, stalled; pick next week's top 3." → 3 runs (Fridays 05-22, 05-29, 06-05).
- **release-checklist** — "Before every Friday release: tests green, changelog, tag, backup, blue/green deploy, announce." → 2 runs (Fridays 05-29 @15:30, 06-05 @15:30).
- **bug-triage** — "Weekly: label new issues, reproduce the worst, pick top fixes, flag P0s." → 3 runs (Fridays 05-22, 05-29, 06-05 @11:00).

## Why this shape
- Status spread (in-progress/backlog/done) + priorities → Overview tiles + Tasks filters are interesting.
- Due dates incl. one overdue → stale ⚠ + due sorting demoable.
- waiting_on (people + external) → synthetic *waiting* pill + waiting-on graph edges.
- Assignees → people nodes in the Graph.
- Dense, overlapping tags → tag co-occurrence edges make the Graph look like a real knowledge graph, not a star.
- 4 projects of different sizes → project-membership clusters in the Graph + the Projects zigzag.
