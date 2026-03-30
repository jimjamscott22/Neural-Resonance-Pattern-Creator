# Neural Resonance Lab

Neural Resonance Lab is a modular generative art app for exploring seeded neural activation patterns. The original `neural_resonance.html` prototype is still in the repo as a reference, while the main experience now lives in a Vite + TypeScript application with separated simulation, rendering, state, and UI layers.

## What Changed

- Rebuilt the prototype as a maintainable app with `src/` modules.
- Extracted seeded network creation and per-frame stepping into pure simulation modules.
- Added a small app store, schema-driven controls, presets, URL/local persistence, export support, and responsive layout.
- Moved the p5 renderer behind a lazy-loaded boundary so the app shell can scale more cleanly.

## Quick Start

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Architecture

```text
src/
  app/       Store and app orchestration
  config/    Parameter schema and defaults
  features/  Presets and persistence helpers
  render/    p5 renderer
  sim/       Network generation and simulation stepping
  ui/        App shell rendering and event binding
```

## Notes

- `neural_resonance.html` is preserved as the original single-file prototype.
- The current build succeeds locally with `npm run build`.
- The p5 renderer remains the heaviest chunk in production output, but it is now lazy-loaded instead of blocking initial shell startup.
