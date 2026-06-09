# Tideline

## What
The Tideline web app — a habit & focus analytics SaaS. Streaks, focus-session
trends, and a weekly digest. This project is the product surface itself (React
front end + API), as opposed to the deploy/observability plumbing, which lives
in [tideline-infra](../tideline-infra/brief.md).

## Why
It's the business. ~120 beta users today at a planned $8/mo (see
[business.md](../../kb/business.md)). The path to GA runs through this repo:
ship the headline streak dashboard, fix the rollup correctness bug, and wire
billing.

## Where
work_dir: `repos/tideline-app`

## Done when
- Streak dashboard shipped and stable.
- Daily rollups are timezone-correct.
- OAuth (Google + GitHub) and Stripe billing live → GA.

## Out of scope
- Native mobile apps.
- Team/enterprise plans.

## Open questions
- Do we gate public signups behind billing, or open a free tier at GA?
