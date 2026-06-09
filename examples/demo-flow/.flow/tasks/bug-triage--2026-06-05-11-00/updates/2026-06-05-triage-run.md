# Bug triage — 2026-06-05

Four new reports, all Tideline app. The big one: streak counts looking off for
users in non-UTC timezones — same root cause as the
[timezone bug](../../timezone-bug/brief.md) already in review, so linked as a dup
rather than refiled. Two empty-state rendering glitches on brand-new accounts
(folded into the [empty-states](../../empty-states/brief.md) work, not separate
fixes). One stale-CSS report on the new landing page — labeled, low.

No new P0s. Top fix stays landing the timezone fix + backfill; the empty-state
glitches resolve once Priya's mocks land.
