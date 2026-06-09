# Fix timezone bug in daily rollups

## What
Daily rollups bucket focus sessions into the wrong day for users east of UTC.
The rollup job uses server UTC instead of the user's local offset, so a 11pm
session lands on "tomorrow" and breaks streak counts. Owned by **Mara**. `#p0`.

## Why
It corrupts the single most important number in the product — the streak. The
[streak dashboard](../streak-dashboard/brief.md) can't ship correctly until this
is fixed.

## Where
work_dir: `repos/tideline-app` · part of [tideline-app](../../projects/tideline-app/brief.md).

## Done when
- Rollups bucket sessions by the user's stored timezone, not server UTC.
- A backfill re-rolls the affected historical days.
- Regression test covers a UTC+offset user crossing midnight.

## Out of scope
- DST edge cases for users who travel mid-week. Tracked separately if it bites.

## Open questions
- Do we store IANA tz names or fixed offsets per user? (Leaning IANA.)
