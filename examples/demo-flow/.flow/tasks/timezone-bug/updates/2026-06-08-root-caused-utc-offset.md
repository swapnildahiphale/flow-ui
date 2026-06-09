# Timezone bug — root-caused to UTC offset in rollup job

Mara root-caused it: the daily rollup job buckets sessions by server UTC instead
of the user's stored timezone, so late-evening sessions for users east of UTC
land on the wrong day and break the streak count. Fix is in review.

Next is the historical backfill to re-roll the affected days, plus a regression
test for a UTC+offset user crossing local midnight.
