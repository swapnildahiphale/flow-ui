# Streak dashboard — charts wired, polishing empty states

Charts are wired end-to-end: current streak, longest streak, and the focus-day
heatmap all render from live rollup data. Devin landed the layout and the
confetti hook fires on a new longest streak (pending the confetti-rs WASM build).

Next is the empty state — the brand-new-user view still looks like a broken
chart. That's waiting on Priya's mocks before I can finish it.

Blocked on: empty-state mocks from Priya.
