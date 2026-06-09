# Bug triage — 2026-05-22

Six new reports this week. Labeled: two Tideline app rendering glitches (low
severity), one rollup-math complaint that traces back to the known
[timezone bug](../../timezone-bug/brief.md) (dup, linked not refiled), and a
confetti-rs community report of a panic on a zero-particle emit — reproduced,
labeled `#bug #p0`.

Top fixes picked: (1) the confetti-rs zero-particle panic — it's a crash, and
(2) the timezone rollup fix, already in flight. The two cosmetic app glitches
stay labeled in the backlog.
