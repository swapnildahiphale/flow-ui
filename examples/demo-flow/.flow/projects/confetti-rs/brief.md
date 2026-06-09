# confetti-rs

## What
An open-source Rust library for confetti/particle effects. MIT-licensed, semver,
maintained by me. Next tag is **v0.4**, which adds a **WASM target** so it runs
in the browser.

## Why
Two reasons. It's credibility and a funnel for [Tideline](../tideline-app/brief.md),
and — once WASM lands — it powers Tideline's streak-celebration animation. So the
OSS work pays the product directly (see [products.md](../../kb/products.md)).

## Where
work_dir: `repos/confetti-rs`

## Done when
- v0.4 ships with a working `wasm32-unknown-unknown` target and a browser demo.
- Docs site + examples are published.
- Binary size is reasonable for web delivery.

## Out of scope
- 3D particles. This is a 2D library and will stay one.

## Open questions
- Can we keep the WASM bundle small enough to ship in Tideline without lazy-loading?
