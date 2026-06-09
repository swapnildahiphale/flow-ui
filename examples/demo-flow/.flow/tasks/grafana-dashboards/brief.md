# Set up Grafana dashboards

## What
Stand up Grafana dashboards covering request latency, error rate, and the daily
rollup job's health. Owned by **Mara**. `#infra #research`.

## Why
We can't safely run [blue/green deploys](../bluegreen-deploy/brief.md) or go to
GA without eyes on the system during a cutover. Part of the deploy ritual in
[processes.md](../../kb/processes.md).

## Where
work_dir: `repos/tideline-infra` · part of [tideline-infra](../../projects/tideline-infra/brief.md).

## Done when
- p50/p95/p99 latency and error-rate panels per endpoint.
- A rollup-job panel (last success, duration, rows processed) — ties to the
  [timezone bug](../timezone-bug/brief.md) work.
- Alerts on error-rate spike and rollup-job failure.

## Out of scope
- Log aggregation. Metrics first; logs later.

## Open questions
- Self-host Grafana or use a managed tier? Researching cost vs. effort.
