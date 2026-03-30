# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Project

```bash
npm install       # first time only
npm run dev       # local dev server (Vite, hot-reload)
npm run build     # production build → dist/
```

Open the URL printed by `npm run dev` (usually `http://localhost:5173`).

`neural_resonance.html` is the original single-file prototype — kept for reference but no longer the active app. The live app is `index.html` + `src/`.

## Architecture

The app is a Vite + TypeScript SPA. Entry point: `src/main.ts`.

```
src/
  config/
    params.ts          # ResonanceParams interface, DEFAULT_PARAMS, PARAM_DEFINITIONS,
                       # SECTION_COPY, formatParamValue, clampParamValue, mergeParams
  app/
    store.ts           # AppStore class — holds AppState, dispatches AppAction, notifies listeners
  features/
    persistence.ts     # loadPersistedParams() / persistParams() — localStorage + URL search params
    presets.ts         # PRESETS array of PresetDefinition (id, name, accent, description, params)
  sim/
    types.ts           # NodeState, NodeType, NetworkState, EngineStats, EngineSnapshot
    math.ts            # createRandom(), valueNoise(), distanceSquared()
    createNetwork.ts   # createNetwork(params, bounds) → NetworkState
    stepSimulation.ts  # stepSimulation(), deriveStats(), getFiringRate()
    engine.ts          # ResonanceEngine class — wraps network + step loop, exposes getSnapshot()
  render/
    p5Renderer.ts      # createP5Renderer() — lazy-loaded; owns the p5 instance and canvas
  ui/
    renderApp.ts       # renderApp() builds DOM, returns AppRefs; syncAppUi() keeps it in sync
    bindApp.ts         # bindAppControls() — wires DOM events to store.dispatch()
  styles.css           # All styles
  main.ts              # bootstrap() — wires store, renderer, UI together
```

### Parameter system

`ResonanceParams` in `params.ts` is the single source of truth. `PARAM_DEFINITIONS` is a
schema array that drives slider rendering automatically — adding a new param only requires
adding it to the interface, `DEFAULT_PARAMS`, and `PARAM_DEFINITIONS`.

Params are grouped into sections rendered as collapsible clusters in the sidebar:
- **structure** — graph geometry (node count, connection density, long-range links)
- **nodeMix** — population ratios for the four neuron types (normalized automatically)
- **activity** — firing dynamics (threshold, fire rate, decay, refractory period)
- **visuals** — trail fade speed

### Node Type System (Phase 2 — complete)

`NodeState.nodeType` is a discriminated union: `"excitatory" | "inhibitory" | "pacemaker" | "burst"`.

- **excitatory** — standard signal-propagating neuron
- **inhibitory** — same firing logic, but other nodes that read from it apply a negative sign,
  so it suppresses neighbors. Renders in violet-purple (HSB ~278°).
- **pacemaker** — adds a sinusoidal spontaneous-firing input; seeds propagation waves
- **burst** — idles normally, then fires for `BURST_DURATION` (8) frames, then holds
  `BURST_COOLDOWN` (30) frames of forced silence. Shows an outer ring while bursting.

Population ratios (`excitatoryRatio`, `inhibitoryRatio`, `pacemakerRatio`, `burstRatio`) are
normalized inside `createNetwork()` — sliders don't need to sum to 1.

### Simulation loop (two-phase update)

`stepSimulation()` enforces the two-phase rule to prevent same-frame cascading:
1. All nodes compute `nextActivation` (reads from `activation` only)
2. All nodes promote `nextActivation → activation`

### Color encoding

`getNodeColor()` in `p5Renderer.ts`:
- **inhibitory** — fixed violet-purple hue (278°), brightness tracks activation
- **all others** — hue maps firing rate blue (low) → red (high) over the last 200 frames

### Persistence

`persistParams()` writes to `localStorage` and mirrors non-default params into the URL
query string. On load, URL params take precedence over localStorage.

## Implementation Status

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | File structure split + Vite/TS scaffold | ✅ Done |
| 2 | Node Type System (4 neuron archetypes) | ✅ Done |
| 3 | Topology Plugins (SmallWorld, ScaleFree, Random, Grid) | ⬜ Next |
| 4 | Renderer Modules (Particle, Heatmap, Graph) | ⬜ Pending |
| 5 | Preset & Export System | ✅ Mostly done (presets, localStorage, PNG export, copy link) |
| 6 | Audio Reactivity (optional) | ⬜ Pending |

## Next Steps (Phase 3 — Topology Plugins)

Extract graph-building into swappable strategy objects. See `PLAN.md` for full spec.

Key files to touch:
- `src/sim/createNetwork.ts` — currently contains the SmallWorld algorithm inline;
  extract it and route through an `activeTopology.build()` call
- `src/sim/topologies/` — new directory: `TopologyBase.ts`, `SmallWorldTopology.ts`,
  `ScaleFreeTopology.ts`, `RandomTopology.ts`, `GridTopology.ts`
- `src/config/params.ts` — add a `topology` string param (structural, triggers rebuild)
- `src/ui/renderApp.ts` — add a Topology dropdown to the sidebar

Design spec: `docs/superpowers/specs/2026-03-30-node-type-system-design.md` (Phase 2).
A Phase 3 spec should be written before implementation begins.
