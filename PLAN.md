# Modular Expansion Plan — Neural Resonance Pattern Creator

## Current State

The original `neural_resonance.html` prototype has been migrated to a modular
Vite + TypeScript SPA (`index.html` + `src/`). The single-file prototype is kept for
reference but is no longer the active application.

---

## Phase 1 — File Structure Split ✅ Done

Vite + TypeScript scaffold created. The app now has a clean module boundary between
simulation (`src/sim/`), rendering (`src/render/`), UI (`src/ui/`), config
(`src/config/`), and features (`src/features/`). See `CLAUDE.md` for the full
directory map.

---

## Phase 2 — Node Type System ✅ Done

`NodeState.nodeType` is a discriminated union: `"excitatory" | "inhibitory" | "pacemaker" | "burst"`.

Population controlled by four ratio params (`excitatoryRatio`, `inhibitoryRatio`,
`pacemakerRatio`, `burstRatio`) in a new "Node Mix" UI section. Ratios are normalized
inside `createNetwork()` so they don't need to sum to 1 manually.

Behavior per type:
- **excitatory** — standard positive-weight propagation (unchanged from prototype)
- **inhibitory** — other nodes apply a negative sign when reading from it, suppressing
  their neighbors. Renders violet-purple.
- **pacemaker** — sinusoidal spontaneous input; seeds propagation waves
- **burst** — 8 frames on, 30 frames forced silence, outer ring visual during burst

Design spec: `docs/superpowers/specs/2026-03-30-node-type-system-design.md`

---

## Phase 3 — Topology Plugins ⬜ Next

Extract graph-building into swappable strategy objects.

```
src/sim/topologies/
  TopologyBase.ts       # interface: build(nodes, params) → void (populates node.connections)
  SmallWorldTopology.ts # current algorithm (k-nearest + long-range chance) — extracted from createNetwork.ts
  ScaleFreeTopology.ts  # Barabási–Albert preferential attachment
  RandomTopology.ts     # Erdős–Rényi random graph
  GridTopology.ts       # strict lattice, no perturbation
```

`createNetwork.ts` calls `activeTopology.build(nodes, params)` after node placement.

**Param addition:** `topology` string param (default `"smallWorld"`). Structural change —
triggers `initializeSystem()`. Add a Topology dropdown to the sidebar.

**Breaking change:** None. SmallWorld is the default and produces identical output to
the current code.

---

## Phase 4 — Renderer Modules ⬜ Pending

Decouple drawing from simulation state so visual styles can be swapped at runtime.

```
src/render/renderers/
  RendererBase.ts       # interface: drawBackground(), drawConnections(nodes), drawNodes(nodes)
  ParticleRenderer.ts   # current behavior (glow circles, fade trails, white pulse)
  HeatmapRenderer.ts    # pixel grid where cell color = avg activation in that region
  GraphRenderer.ts      # nodes as labeled circles, edges as visible arcs with weight
```

`p5Renderer.ts` delegates to `activeRenderer.drawBackground()`, `.drawConnections()`,
`.drawNodes()`.

**UI addition:** Renderer dropdown in the Actions section. No reinitialization needed —
renderers read existing node state.

---

## Phase 5 — Preset & Export System ✅ Mostly Done

Already implemented:
- `src/features/presets.ts` — four built-in presets (Baseline, Signal Storm, Glass
  Cathedral, Mycelial Drift)
- `src/features/persistence.ts` — localStorage + URL query-string sync
- Export PNG button (`p5.saveCanvas`)
- Copy Link button (writes URL to clipboard)

Remaining (optional):
- User-saved presets (name input → localStorage under a custom key)

---

## Phase 6 — Audio Reactivity ⬜ Pending (optional / advanced)

```
src/features/audio.ts
```

- Microphone input via `navigator.mediaDevices.getUserMedia` → Web Audio `AnalyserNode`
- Bass energy (20–250 Hz) scales pacemaker spontaneous amplitude
- Mid energy (250–4000 Hz) shifts `activationThreshold` ± 0.1 around its slider value
- High energy (4000+ Hz) scales `fireRate`
- MIDI output: nodes that fire send `noteOn` on Web MIDI API; pitch maps to node
  position (x → note, y → velocity)

**UI addition:** "Audio" toggle section with Mic On/Off and MIDI On/Off buttons. Both
opt-in; the module only loads when activated to avoid permission prompts on startup.

---

## Implementation Order & Dependencies

```
Phase 1 ✅
  └─ Phase 2 ✅
       └─ Phase 3 ⬜ ← start here
            └─ Phase 4 ⬜ (can run in parallel with Phase 3 once Phase 1 done)
  └─ Phase 5 ✅ (mostly)
  └─ Phase 6 ⬜ (independent of Phases 2–5)
```

---

## Conventions for New Modules

- Each module exports exactly one class or one plain object.
- No module modifies `params` directly — they receive it as an argument.
- All structural changes (anything that rebuilds the graph) go through
  `engine.rebuild()` → `createNetwork()` — never mutate `nodes` directly elsewhere.
- New UI controls: add a `ParamDefinition` entry to `PARAM_DEFINITIONS` in `params.ts`
  and the slider renders automatically. For non-slider controls (dropdowns, toggles),
  add the element to `renderApp.ts` and wire it in `bindApp.ts`.
- New parameters added to `ResonanceParams` must also appear in `DEFAULT_PARAMS` and
  will be automatically handled by `clampParamValue`, `mergeParams`, and `persistParams`.
