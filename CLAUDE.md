# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Project

No build system. Open `neural_resonance.html` directly in a browser:

```
start neural_resonance.html   # Windows
open neural_resonance.html    # macOS
```

All dependencies (p5.js 1.7.0, Google Fonts) are loaded from CDN — no install step.

## Architecture

The entire application is a single file: `neural_resonance.html`. Structure:

- **CSS** (`<style>`): Layout (flexbox sidebar + canvas area), Anthropic brand color variables (`--anthropic-*`), slider/button component styles
- **HTML**: Static sidebar with seed controls + parameter sliders; `#canvas-container` where p5.js mounts the canvas
- **JavaScript** (`<script>`): p5.js sketch in global mode (no `new p5(...)` wrapper), plus UI event handlers

### Core simulation loop

`params` object holds all tuneable values. `initializeSystem()` rebuilds the node graph from scratch using `randomSeed(params.seed)` — calling it again with the same seed produces identical output.

`Node` class is the primary abstraction. Each node maintains `activation` and `nextActivation` as separate fields. The draw loop follows a strict two-phase update pattern to prevent same-frame cascading:

1. `node.update()` — reads neighbor activations, writes to `nextActivation`
2. `node.display()` — renders based on current `activation`
3. `node.applyNextState()` — promotes `nextActivation → activation`

### Parameters that trigger `initializeSystem()` vs. live update

- **Structural** (`nodeCount`, `connectionDensity`): call `initializeSystem()` — rebuilds the entire graph
- **Behavioral** (`activationThreshold`, `fireRate`, `decayRate`, `refractoryPeriod`): take effect immediately on the next frame; no reinitialization needed
- **Seed**: always calls `initializeSystem()`

### Network topology

Nodes are placed on a perturbed grid (Perlin noise offset). Connections follow a small-world model: each node links to its `connectionDensity` nearest neighbors plus a 15% chance of a random long-range connection. ~5% of nodes are designated pacemakers that fire spontaneously via a sinusoidal oscillator.

### Color encoding

`Node.getColor()` maps firing rate over the last 200 frames to hue (blue = low, red = high) using p5's HSB mode, then converts back to RGB for drawing. This makes activity patterns visually distinguishable from inactive regions.
