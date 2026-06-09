# Design empty-states for analytics

## What
Design the empty states for the analytics screens — what a brand-new user sees
before they've logged any focus sessions. *Waiting on Priya* for mocks.

## Why
First impressions. A blank chart reads as "broken"; a good empty state reads as
"here's what you'll see once you start." Directly affects activation of the
~120 beta users (see [business.md](../../kb/business.md)).

## Where
work_dir: `repos/tideline-app` · part of [tideline-app](../../projects/tideline-app/brief.md).

## Done when
- Empty states for streaks, focus-time chart, and weekly digest preview.
- They guide the user to their first focus session.
- Implemented behind the same components the
  [streak dashboard](../streak-dashboard/brief.md) uses.

## Out of scope
- Onboarding flow itself — that's [onboarding-redesign](../onboarding-redesign/brief.md).

## Open questions
- Illustration vs. plain copy for the empty states? Waiting on Priya's direction.
