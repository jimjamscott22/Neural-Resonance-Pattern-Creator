# Phase 2 — Node Type System Design

**Date:** 2026-03-30
**Approach:** Discriminated union on `NodeState` (Option A)

---

## Overview

Replace the single `isPacemaker: boolean` flag with a `nodeType` discriminated union
(`"excitatory" | "inhibitory" | "pacemaker" | "burst"`). All behavior differences are
handled inside `updateNode()` with a `switch` on `nodeType`. No class hierarchy is
introduced — the simulation stays purely data-oriented, consistent with the existing
codebase style.

---

## Architecture

### `src/sim/types.ts`

- Add `nodeType: "excitatory" | "inhibitory" | "pacemaker" | "burst"` to `NodeState`.
- Remove `isPacemaker: boolean` (fully absorbed by `nodeType === "pacemaker"`).
- Add `burstCounter: number` and `burstCooldown: number` to `NodeState`. Default `0` for
  all non-burst nodes; only `"burst"` nodes write to these fields.
- Add `inhibitoryCount` and `burstCount` to `EngineStats` (replace the existing
  `pacemakerCount` with counts for all four types, or add the new two alongside the
  existing one — whichever keeps the stats panel concise).

### `src/sim/stepSimulation.ts`

`updateNode()` dispatches on `nodeType`:

| Type | Behavior |
|------|----------|
| `excitatory` | Current logic unchanged: `input += activation * weight` |
| `inhibitory` | Flips sign: `input -= activation * weight`. All other logic (threshold, decay, refractory) identical. |
| `pacemaker` | Current `isPacemaker` branch extracted verbatim: sinusoidal `pacemakerPhase` input boost. |
| `burst` | When `nextActivation > threshold` and refractory cleared, enter burst mode: fire for `BURST_DURATION` frames (e.g. 8), then force `BURST_COOLDOWN` frames of silence (e.g. 30). Managed via `burstCounter` / `burstCooldown`. |

The two-phase update contract (`nextActivation` written, applied after all nodes update)
is unchanged for all types.

### `src/sim/createNetwork.ts`

Replace the single `isPacemaker` roll with a weighted draw across all four types:

1. Compute cumulative thresholds from the four ratio params.
2. For each node, draw one random value and pick the type from the cumulative range.
3. Normalize the four ratios at construction time (divide by their sum) so they always
   total 1.0 regardless of floating-point slider imprecision.

### `src/config/params.ts`

**New params added to `ResonanceParams`:**

| Key | Default | Section | Rebuild |
|-----|---------|---------|---------|
| `excitatoryRatio` | 0.72 | `nodeMix` | true |
| `inhibitoryRatio` | 0.15 | `nodeMix` | true |
| `pacemakerRatio` | 0.08 | `nodeMix` | true |
| `burstRatio` | 0.05 | `nodeMix` | true |

The existing `pacemakerRatio` param is **replaced** by the four new ratio params (it
previously lived in `structure`; the four new params form their own `nodeMix` section).

**`SECTION_COPY`** gets a new `nodeMix` entry:
```
title: "Node Mix"
blurb: "The population split across all four neuron archetypes."
```

**`PARAM_DEFINITIONS`** gets four new entries, all with `format: percent` and
`rebuildOnChange: true`. Sliders range from `0.0` to `1.0` in `0.01` steps.

> Note: The four sliders are independent — no hard enforcement that they sum to 1.
> Normalization happens silently inside `createNetwork()`. The UI copy on the section
> should note this ("values are normalized automatically").

### `src/render/p5Renderer.ts`

Color encoding extended to reflect node type:

- `"inhibitory"` — cool violet/purple hue (HSB ~270–290°) independent of firing rate,
  so they remain visually distinct from excitatory (blue→red spectrum).
- `"burst"` — during active burst frames (`burstCounter > 0`), draw an extra white
  outer ring (same style as the existing white pulse, slightly larger radius).
- `"excitatory"` and `"pacemaker"` — existing color logic unchanged.

---

## Data Flow

```
createNetwork()
  reads: excitatoryRatio, inhibitoryRatio, pacemakerRatio, burstRatio (normalized)
  writes: nodeType per node, burstCounter=0, burstCooldown=0

stepSimulation()  [per frame]
  reads: nodeType → dispatches update logic
  writes: nextActivation, burstCounter, burstCooldown (burst nodes only)
  applies: nextActivation → activation (all nodes, after full pass)

p5Renderer  [per frame]
  reads: nodeType, activation, burstCounter → color + ring decisions
```

---

## Error Handling

- If the four ratios all round to zero (unlikely but possible), `createNetwork()`
  falls back to assigning all nodes as `"excitatory"`.
- No other error paths — all inputs are clamped by the existing `clampParamValue` logic.

---

## Testing Opportunities

- Seeded network with known ratios: assert correct node-type counts (within ±1 of
  rounding).
- Inhibitory nodes: assert that a fully-inhibitory network's average activation
  stays near zero after N steps.
- Burst nodes: assert that `burstCounter` cycles through its expected range.

---

## Out of Scope

- UI enforcement that the four ratios sum to 1 (normalization is silent and sufficient).
- Visual type legend in the canvas — out of scope for this phase.
- Any changes to topology construction (that is Phase 3).
