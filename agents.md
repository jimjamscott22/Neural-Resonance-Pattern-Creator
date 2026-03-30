# Agents Notes

## Project Overview

Neural Resonance Lab is now a modular frontend app built with Vite, TypeScript, and a lazy-loaded p5 renderer. The original `neural_resonance.html` file remains in the repository as a historical prototype and behavior reference.

## Current Architecture

- `src/app/store.ts`: central app state and action handling
- `src/config/params.ts`: default params, slider schema, formatting, and clamping
- `src/features/presets.ts`: reusable scene presets
- `src/features/persistence.ts`: URL and localStorage hydration/persistence
- `src/sim/*`: deterministic network generation and simulation stepping
- `src/render/p5Renderer.ts`: p5-based drawing layer
- `src/ui/*`: DOM rendering and control bindings

## Latest Implementation Summary

On 2026-03-29, the project was reworked from a single HTML file into a scalable app structure. The new version includes a modular simulation engine, schema-driven controls, presets, shareable seeded state, PNG export, responsive layout, and production build configuration. Validation completed with `npm install` and `npm run build`.

## Important Notes For Future Agents

- Update `implementation-summary.md` and this `agents.md` file after significant repo changes.
- Preserve `neural_resonance.html` unless there is a deliberate decision to retire the legacy prototype.
- The current production build succeeds, but the lazy-loaded p5 renderer is still the largest output chunk.
