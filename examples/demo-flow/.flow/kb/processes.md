# Processes

How the work actually moves. Everything is async-first; flow tasks are the
source of truth.

## Deploy ritual
Owned by [tideline-infra](../projects/tideline-infra/brief.md).
- **Blue/green deploys.** New version goes to the green slot, gets smoke-tested,
  then traffic cuts over. The `bluegreen-deploy` task is hardening the script.
- **Nightly DB backups to S3.** Runs every night at 02:00 UTC; this is a P0 and
  it's done (`nightly-backups`). No deploy goes out without a fresh backup.
- **Dashboards.** Grafana is coming online (`grafana-dashboards`, Mara) so we can
  watch latency + error rate during a cutover.

## Review rule
**Every PR is reviewed before merge.** Even mine. For confetti-rs that means
community PRs wait on a maintainer pass (the `docs-site` task is *waiting on
community PR review*). See [org.md](org.md) for who reviews what.

## Release cadence
- **Releases ship Fridays.** Thursday is a soft freeze for anything risky.
- The [weekly-review](../playbooks/weekly-review/brief.md) playbook runs every
  Friday: list what shipped, what's in-flight, what stalled, and pick next
  week's top 3.
- confetti-rs follows semver; v0.4 is the next tag (WASM target).
