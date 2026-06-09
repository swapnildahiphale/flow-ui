# Tideline Infra

## What
Deploy, observability, and infrastructure for [Tideline](../tideline-app/brief.md).
Blue/green deploy scripts, nightly backups, Grafana dashboards, and cost control.

## Why
The product can't go to GA on hope. We need safe deploys (blue/green), a way to
recover (nightly S3 backups — done, P0), and eyes on latency/error rate
(Grafana) before we start charging people. The deploy ritual is documented in
[processes.md](../../kb/processes.md).

## Where
work_dir: `repos/tideline-infra`

## Done when
- Blue/green deploy script is reliable and documented.
- Grafana dashboards cover request latency, error rate, and rollup job health.
- Hosting cost is understood and trimmed where cheap to do so.

## Out of scope
- Multi-region. One region is plenty at 120 users.

## Open questions
- Is the current box oversized for the beta load? (`cut-hosting-cost`)
