#!/usr/bin/env bash
#
# seed.sh — reproducible generator for the "Ren Okafor" demo flow dataset.
#
# Implements docs/NARRATIVE.md: 4 projects, ~20 tasks, 1 playbook.
# All data is FICTIONAL. This script writes ONLY to the demo flow root.
#
# Usage:  ./seed.sh
#
# It uses a dedicated flow binary built from this repo's source. Override
# with FLOW_BIN=/path/to/flow if needed.

set -euo pipefail

# ---------------------------------------------------------------------------
# DATA-SAFETY: derive the demo root from this script's own location, and
# refuse to run against the real ~/.flow under any circumstances.
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEMO_ROOT="$SCRIPT_DIR/.flow"
export FLOW_ROOT="$DEMO_ROOT"
[ "$FLOW_ROOT" != "$HOME/.flow" ] || { echo "refusing to seed the real ~/.flow"; exit 1; }

FLOW="${FLOW_BIN:-flow}"
REPOS="$SCRIPT_DIR/repos"

echo "== flow root: $FLOW_ROOT"
echo "== flow bin:  $FLOW"

# ---------------------------------------------------------------------------
# init
# ---------------------------------------------------------------------------
"$FLOW" init

# ---------------------------------------------------------------------------
# projects (3 active + 1 low)
# ---------------------------------------------------------------------------
"$FLOW" add project "Tideline"        --slug tideline-app   --priority high   --work-dir "$REPOS/tideline-app"   --mkdir
"$FLOW" add project "Tideline Infra"  --slug tideline-infra --priority medium --work-dir "$REPOS/tideline-infra" --mkdir
"$FLOW" add project "confetti-rs"     --slug confetti-rs    --priority medium --work-dir "$REPOS/confetti-rs"    --mkdir
"$FLOW" add project "Personal"        --slug personal       --priority low    --work-dir "$REPOS/personal"       --mkdir

# ---------------------------------------------------------------------------
# tasks — created as backlog; status/tags/waiting applied below.
# ---------------------------------------------------------------------------

# tideline-app
"$FLOW" add task "Ship streak-tracking dashboard" --slug streak-dashboard   --project tideline-app --priority high   --assignee Devin --due 3d
"$FLOW" add task "Fix timezone bug in daily rollups" --slug timezone-bug     --project tideline-app --priority high   --assignee Mara
"$FLOW" add task "Design empty-states for analytics" --slug empty-states     --project tideline-app --priority medium
"$FLOW" add task "OAuth login (Google + GitHub)" --slug oauth-login          --project tideline-app --priority high
"$FLOW" add task "Onboarding redesign" --slug onboarding-redesign            --project tideline-app --priority medium --assignee Priya
"$FLOW" add task "Stripe billing integration" --slug stripe-billing          --project tideline-app --priority high
"$FLOW" add task "Weekly email digest" --slug weekly-digest                  --project tideline-app --priority low
"$FLOW" add task "Public roadmap page" --slug roadmap-page                   --project tideline-app --priority low
"$FLOW" add task "Migrate charts to Recharts" --slug recharts-migration      --project tideline-app --priority medium

# tideline-infra
"$FLOW" add task "Set up Grafana dashboards" --slug grafana-dashboards       --project tideline-infra --priority medium --assignee Mara
"$FLOW" add task "Blue/green deploy script" --slug bluegreen-deploy          --project tideline-infra --priority medium
"$FLOW" add task "Nightly DB backups to S3" --slug nightly-backups           --project tideline-infra --priority high
"$FLOW" add task "Cut prod hosting cost" --slug cut-hosting-cost             --project tideline-infra --priority low

# confetti-rs
"$FLOW" add task "v0.4 release: WASM target" --slug wasm-release             --project confetti-rs --priority medium
"$FLOW" add task "Fix panic on zero-particle emit" --slug zero-particle-panic --project confetti-rs --priority high
"$FLOW" add task "Write docs site + examples" --slug docs-site               --project confetti-rs --priority medium
"$FLOW" add task "Reduce binary size" --slug reduce-binary-size              --project confetti-rs --priority low
"$FLOW" add task "Demo gif for README" --slug readme-demo-gif               --project confetti-rs --priority low

# personal
"$FLOW" add task "Renew domain + TLS certs" --slug renew-domain              --project personal --priority medium --due 10d
"$FLOW" add task "Write launch blog post" --slug launch-blog-post            --project personal --priority low --due 2026-06-07

# ---------------------------------------------------------------------------
# tags + waiting
# ---------------------------------------------------------------------------

# tideline-app
"$FLOW" update task streak-dashboard    --tag frontend --tag release
"$FLOW" update task timezone-bug        --tag backend --tag bug --tag p0
"$FLOW" update task empty-states        --tag design --tag frontend --waiting "Priya (mocks)"
"$FLOW" update task oauth-login         --tag backend --tag api
"$FLOW" update task onboarding-redesign --tag design --tag frontend
"$FLOW" update task stripe-billing      --tag api --tag backend --waiting "Stripe support (webhook allowlist)"
"$FLOW" update task weekly-digest       --tag backend
"$FLOW" update task roadmap-page        --tag frontend --tag docs
"$FLOW" update task recharts-migration  --tag frontend

# tideline-infra
"$FLOW" update task grafana-dashboards  --tag infra --tag research
"$FLOW" update task bluegreen-deploy    --tag infra
"$FLOW" update task nightly-backups     --tag infra --tag p0
"$FLOW" update task cut-hosting-cost    --tag infra --tag research

# confetti-rs
"$FLOW" update task wasm-release        --tag oss --tag release --tag research
"$FLOW" update task zero-particle-panic --tag oss --tag bug
"$FLOW" update task docs-site           --tag oss --tag docs --waiting "community PR review"
"$FLOW" update task reduce-binary-size  --tag oss --tag research
"$FLOW" update task readme-demo-gif     --tag oss --tag docs --waiting "Apple review"

# personal
"$FLOW" update task renew-domain        --tag infra
"$FLOW" update task launch-blog-post    --tag docs

# NOTE: DONE and IN-PROGRESS statuses are applied via sqlite3 in a separate
# step (status-and-runs.sql), because `flow update task --status` refuses any
# non-backlog status without a session_id, and `flow done` triggers a headless
# Claude sweep. See the companion SQL file.

# ---------------------------------------------------------------------------
# playbook
# ---------------------------------------------------------------------------
"$FLOW" add playbook "Weekly review" --slug weekly-review --project tideline-app --work-dir "$REPOS/tideline-app" --mkdir

echo "== seed.sh complete"
