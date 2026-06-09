# confetti-rs WASM — wasm-bindgen building, tuning the draw loop

wasm-bindgen is building cleanly against `wasm32-unknown-unknown` and the browser
demo runs. The draw loop is the bottleneck right now — perf-tuning the particle
update so it holds 60fps on a mid-range laptop.

Next is trimming the bundle (ties into reduce-binary-size) so it can ship inside
Tideline's streak-celebration animation without lazy-loading.
