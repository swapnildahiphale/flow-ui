# Ship streak-tracking dashboard

## What
The headline Tideline screen: a dashboard that shows the user's current streak,
longest streak, and a calendar heatmap of focus days. Owned by **Devin**.

## Why
Streaks are the reason people open the app daily. This is the demo screen for GA
and the hook for the [launch blog post](../launch-blog-post/brief.md).

## Where
work_dir: `repos/tideline-app` · part of [tideline-app](../../projects/tideline-app/brief.md).

## Done when
- Streak math is correct across timezones (depends on the
  [timezone bug fix](../timezone-bug/brief.md) landing).
- Empty state looks intentional (depends on
  [empty-states](../empty-states/brief.md), waiting on Priya's mocks).
- Confetti fires on a new longest streak (uses
  [confetti-rs](../../projects/confetti-rs/brief.md) WASM build).

## Out of scope
- Sharing/exporting streaks. Later.

## Open questions
- Do we count a partial focus day toward the streak, or require a full session?
