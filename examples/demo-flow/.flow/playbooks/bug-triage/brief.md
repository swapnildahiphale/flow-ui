# Bug triage

## What
A weekly pass over new bug reports: label them, reproduce the worst ones, and
pick the top fixes to slot into next week's work.

## Why
Bugs pile up between releases — a few from beta users, a few from confetti-rs
community reports. Without a weekly sweep they either get lost or all feel
equally urgent. This keeps the bug list honest and feeds the
[weekly-review](../weekly-review/brief.md) with a clear "what to fix next".

## Where
work_dir: ~/code/tideline-app

## Each run does
- **Label new issues.** Tag each new report: `#bug`, severity, and which surface
  (Tideline app, infra, or confetti-rs).
- **Reproduce the worst.** Confirm a repro for anything that smells like data
  loss or a crash (e.g. the `zero-particle-panic` class of bug).
- **Pick top fixes.** Choose the 2–3 bugs worth fixing this cycle; everything
  else stays labeled in the backlog.
- **Flag P0s.** Anything that corrupts data or blocks a release → `#p0`, surfaced
  immediately, not deferred to next week.

## Out of scope
- Actually fixing the bugs. Triage decides *what* and *how urgent*, not *how*.
- Feature requests. Those aren't bugs; they go to the backlog as regular tasks.

## Signals to watch for
- A bug touching the daily rollups → likely related to the
  [timezone bug](../../tasks/timezone-bug/brief.md); check before filing a dup.
- A community-reported confetti-rs panic → reproduce before labeling severity.

---
*Run with `flow run playbook bug-triage`. Each run gets its own session
and a snapshot of this brief at run time. Editing this file does not
retroactively change past runs.*
