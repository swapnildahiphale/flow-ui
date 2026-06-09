# Demo data

A small, fully fictional `flow` dataset so you can try flow-ui without
installing the `flow` CLI or having any data of your own.

It belongs to **"Ren Okafor,"** a solo indie developer building a habit-and-focus
analytics SaaS (*Tideline*) and maintaining an open-source Rust library
(*confetti-rs*) on the side. The data is shaped to light up every surface:
projects at different priorities, tasks across backlog / in-progress / done,
due dates (one overdue, so you see the stale marker), waiting-on notes,
assignees, overlapping tags, a populated KB, progress notes, and a few
playbooks with dated runs. See [`demo-flow/NARRATIVE.md`](demo-flow/NARRATIVE.md)
for the full cast.

## Run it

Point flow-ui straight at the prebuilt database — no `flow` install needed:

```bash
flow-ui --db examples/demo-flow/.flow/flow.db
```

That boots the dashboard on a localhost port against the demo data. Browse the
tasks, open the KB, and especially try the **Graph** view.

## Regenerate it (optional)

The dataset is reproducible. [`demo-flow/seed.sh`](demo-flow/seed.sh) rebuilds
the whole thing from scratch via the `flow` CLI — useful if you want to see how
it's constructed or tweak it:

```bash
cd examples/demo-flow
./seed.sh                 # uses `flow` on your PATH; override with FLOW_BIN=...
```

`seed.sh` derives its flow root from its own location and refuses to touch your
real `~/.flow`, so it's safe to run.

> All names, companies, and customers here are invented. Any resemblance to a
> real person or organization is coincidental.
