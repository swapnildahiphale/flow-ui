# Weekly review

## What
Every Friday: take stock of the week — what shipped, what's in-flight, what
stalled — and pick next week's top 3.

## Why
Solo founders drift. This ritual keeps the Friday release cadence honest (see
[processes.md](../../kb/processes.md)) and makes sure stalled work and external
blockers (Stripe support, Apple review, Priya's mocks) get surfaced instead of
quietly rotting.

## Where
work_dir: ~/code/tideline-app

## Each run does
- List what shipped this week (status → done since last Friday).
- List what's in-flight (in-progress) and who owns it.
- List what stalled — anything `waiting_on` or untouched 7+ days.
- Pick next week's top 3 and write them down.

## Out of scope
- Re-prioritizing the whole backlog. This is a 15-minute review, not planning.

## Signals to watch for
- A task `waiting_on` an external party for 2+ weeks → escalate or drop.
- An in-progress task with no update in a week → it's actually stalled.

---
*Run with `flow run playbook weekly-review`. Each run gets its own session
and a snapshot of this brief at run time. Editing this file does not
retroactively change past runs.*
