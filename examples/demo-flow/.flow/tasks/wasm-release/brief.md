# v0.4 release: WASM target

## What
Ship [confetti-rs](../../projects/confetti-rs/brief.md) v0.4 with a
`wasm32-unknown-unknown` target via wasm-bindgen, plus a browser demo.
`#oss #release #research`.

## Why
WASM is what lets confetti-rs run in the browser — and specifically what powers
Tideline's streak-celebration animation on the
[streak dashboard](../streak-dashboard/brief.md). The OSS work pays the product.

## Where
work_dir: `repos/confetti-rs` · released on the Friday cadence (see
[processes.md](../../kb/processes.md)).

## Done when
- `cargo build --target wasm32-unknown-unknown` is clean.
- Browser demo runs the draw loop at 60fps on a mid-range laptop.
- Bundle is small enough to ship without lazy-loading (ties to
  [reduce-binary-size](../reduce-binary-size/brief.md)).

## Out of scope
- WebGPU backend. CPU/Canvas2D for now.

## Open questions
- wasm-bindgen vs. raw web-sys for the canvas glue? Currently on wasm-bindgen.
