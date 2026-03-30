# Modular Expansion Plan — Neural Resonance Pattern Creator

## Current State

The entire application lives in one 684-line `neural_resonance.html` file. This works for a
standalone demo but makes it difficult to add features, test in isolation, or let contributors
work on separate concerns without conflicts.

---

## Phase 1 — File Structure Split

Break the monolith into focused source files. The HTML file becomes a thin orchestrator.

```
src/
  css/
    styles.css          # all existing CSS, unchanged
  js/
    params.js           # `params` object, `defaultParams`, resetParameters()
    node.js             # Node class (update, fire, display, getColor)
    network.js          # initializeSystem(), graph construction
    sketch.js           # p5.js setup() and draw() loop
    ui.js               # all DOM event handlers (updateParam, seed controls)
neural_resonance.html   # loads scripts in order, holds only the HTML markup
```

**Why first:** Every subsequent phase adds a new file; the split makes those additions clean
rather than appending hundreds of lines to one file.

**Breaking change:** None. Behavior is identical.

---

## Phase 2 — Node Type System

Replace the single `Node` class with a typed hierarchy so different neuron behaviors can be
mixed in the same simulation.

```
src/js/nodes/
  NodeBase.js           # shared fields (x, y, id, activation, connections, firingHistory)
                        # abstract update(), display(), getColor()
  ExcitatoryNode.js     # current default behavior (positive weight influence)
  InhibitoryNode.js     # negative weight influence, suppresses neighbors
  PacemakerNode.js      # sinusoidal spontaneous firing, extracted from the isPacemaker flag
  BurstNode.js          # fires in short bursts then goes silent (chattering behavior)
```

**UI addition:** A "Node Mix" section with four sliders controlling the percentage of each
node type. Structural change — calls `initializeSystem()`.

**Key design rule:** `NodeBase.update()` reads `conn.target.activation` and writes
`this.nextActivation`. All subclasses must honor this contract so the two-phase update in
`draw()` stays correct.

---

## Phase 3 — Topology Plugins

Extract graph-building into swappable strategy objects.

```
src/js/topologies/
  TopologyBase.js       # interface: build(nodes, params) → void (populates node.connections)
  SmallWorldTopology.js # current algorithm (k-nearest + 15% long-range)
  ScaleFreeTopology.js  # Barabási–Albert preferential attachment
  RandomTopology.js     # Erdős–Rényi random graph
  GridTopology.js       # strict lattice, no perturbation
```

`network.js` calls `activeTopology.build(nodes, params)` after node placement.

**UI addition:** A "Topology" dropdown in the Parameters section. Structural change — calls
`initializeSystem()`.

---

## Phase 4 — Renderer Modules

Decouple drawing from simulation state so visual styles can be swapped at runtime.

```
src/js/renderers/
  RendererBase.js       # interface: drawBackground(), drawConnections(nodes), drawNodes(nodes)
  ParticleRenderer.js   # current behavior (glow circles, fade trails, white pulse)
  HeatmapRenderer.js    # draws a pixel grid where each cell color = avg activation in that region
  GraphRenderer.js      # draws nodes as labeled circles, edges as visible arcs with weight
```

`draw()` delegates to `activeRenderer.drawBackground()`, `.drawConnections()`, `.drawNodes()`.

**UI addition:** A "Renderer" dropdown in the Actions section. No reinitialization needed —
renderers read existing node state.

---

## Phase 5 — Preset & Export System

```
src/js/presets.js
```

**Features:**
- `savePreset(name)` — serializes `params` to `localStorage` under the given name
- `loadPreset(name)` — restores `params`, updates all sliders, calls `initializeSystem()`
- `exportParamsToURL()` — encodes `params` as a URL hash (`#seed=42&nodeCount=400&…`) so
  patterns can be shared by link
- `importParamsFromURL()` — called on page load; parses the hash and populates `params`
- `exportCanvasPNG()` — calls p5's `saveCanvas()` with a timestamped filename

**UI additions:**
- "Save Preset" text input + button
- Preset dropdown to load saved presets
- "Export PNG" button in the Actions section
- "Copy Link" button that calls `exportParamsToURL()` and writes to clipboard

---

## Phase 6 — Audio Reactivity (optional / advanced)

```
src/js/audio.js
```

**Features:**
- Microphone input via `navigator.mediaDevices.getUserMedia` → Web Audio `AnalyserNode`
- Bass energy (20–250 Hz) scales pacemaker spontaneous amplitude
- Mid energy (250–4000 Hz) shifts `activationThreshold` ± 0.1 around its slider value
- High energy (4000+ Hz) scales `fireRate`
- MIDI output: nodes that fire send `noteOn` messages on Web MIDI API; pitch maps to node
  position (x → note, y → velocity)

**UI addition:** An "Audio" toggle section with a Mic On/Off button and MIDI On/Off button.
Both are opt-in; the module only loads when activated to avoid permission prompts on startup.

---

## Implementation Order & Dependencies

```
Phase 1 (no deps)
  └─ Phase 2 (depends on Phase 1 file structure)
       └─ Phase 3 (depends on Phase 2 NodeBase contract)
            └─ Phase 4 (depends on Phase 1; can run in parallel with Phase 3)
  └─ Phase 5 (depends on Phase 1 params.js)
  └─ Phase 6 (depends on Phase 1; independent of Phases 2–5)
```

Phases 4, 5, and 6 can be developed in parallel once Phase 1 is complete.

---

## Conventions for New Modules

- Each module exports exactly one class or one plain object.
- No module modifies `params` directly — they read it as a parameter argument.
- All structural changes (anything that rebuilds the graph) go through `network.js`'s
  `initializeSystem()` — never call `nodes = []` elsewhere.
- New UI controls use the existing `.control-section` / `.control-group` / `.slider-container`
  HTML pattern so they inherit all CSS automatically.
- New parameters added to `params` must also be added to `defaultParams` and handled in
  `resetParameters()`.
