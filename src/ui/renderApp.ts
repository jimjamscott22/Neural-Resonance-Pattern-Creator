import {
  PARAM_DEFINITIONS,
  SECTION_COPY,
  formatParamValue,
  type ControlledParamKey,
} from "../config/params";
import { PRESETS } from "../features/presets";
import type { AppState } from "../app/store";

export interface AppRefs {
  canvasMount: HTMLDivElement;
  seedInput: HTMLInputElement;
  previousSeedButton: HTMLButtonElement;
  nextSeedButton: HTMLButtonElement;
  randomSeedButton: HTMLButtonElement;
  playToggleButton: HTMLButtonElement;
  resetButton: HTMLButtonElement;
  exportButton: HTMLButtonElement;
  copyLinkButton: HTMLButtonElement;
  presetButtons: HTMLButtonElement[];
  sliderInputs: Map<ControlledParamKey, HTMLInputElement>;
  sliderValues: Map<ControlledParamKey, HTMLElement>;
  statNodes: Map<string, HTMLElement>;
}

export function renderApp(root: HTMLElement): AppRefs {
  root.innerHTML = `
    <div class="app-shell">
      <aside class="control-panel">
        <div class="panel-hero">
          <p class="eyebrow">Generative Systems Studio</p>
          <h1>Neural Resonance Lab</h1>
          <p class="hero-copy">
            A seeded field of coupled oscillators, rebuilt as a modular app with presets, persistence,
            and a renderer that can keep growing with the project.
          </p>
        </div>

        <section class="panel-section">
          <div class="section-header">
            <div>
              <p class="section-kicker">Seed</p>
              <h2>Reproducibility</h2>
            </div>
            <p class="section-copy">Shareable seeds and quick iteration controls.</p>
          </div>

          <label class="seed-label" for="seed-input">Current Seed</label>
          <input id="seed-input" class="seed-input" type="number" min="1" step="1" />

          <div class="seed-actions">
            <button id="previous-seed" class="ghost-button" type="button">Previous</button>
            <button id="next-seed" class="ghost-button" type="button">Next</button>
            <button id="random-seed" class="primary-button wide" type="button">Randomize</button>
          </div>
        </section>

        <section class="panel-section">
          <div class="section-header">
            <div>
              <p class="section-kicker">Presets</p>
              <h2>Scene Library</h2>
            </div>
            <p class="section-copy">Reusable starting points for different motion signatures.</p>
          </div>
          <div class="preset-grid" id="preset-grid">
            ${PRESETS.map(
              (preset) => `
                <button
                  class="preset-card"
                  data-preset="${preset.id}"
                  type="button"
                  style="--preset-accent: ${preset.accent};"
                >
                  <span class="preset-name">${preset.name}</span>
                  <span class="preset-description">${preset.description}</span>
                </button>
              `,
            ).join("")}
          </div>
        </section>

        <section class="panel-section">
          <div class="section-header">
            <div>
              <p class="section-kicker">Controls</p>
              <h2>Field Parameters</h2>
            </div>
            <p class="section-copy">Schema-driven sliders sourced from a single definition map.</p>
          </div>
          <div id="control-groups"></div>
        </section>

        <section class="panel-section panel-actions">
          <div class="section-header">
            <div>
              <p class="section-kicker">Actions</p>
              <h2>Session</h2>
            </div>
            <p class="section-copy">Pause, export, reset, or copy a shareable link.</p>
          </div>

          <div class="action-grid">
            <button id="play-toggle" class="primary-button" type="button">Pause</button>
            <button id="reset-controls" class="ghost-button" type="button">Reset</button>
            <button id="copy-link" class="ghost-button" type="button">Copy Link</button>
            <button id="export-frame" class="ghost-button" type="button">Export PNG</button>
          </div>
        </section>

        <section class="panel-section panel-resources">
          <div class="section-header">
            <div>
              <p class="section-kicker">Resources</p>
              <h2>How It Works</h2>
            </div>
            <p class="section-copy">Understanding the generative field parameters and underlying mechanics.</p>
          </div>
          <div class="resource-content">
            <details class="resource-drawer">
              <summary>Field Mechanics</summary>
              <div class="drawer-body">
                <p>The simulation uses a 2D field of coupled continuous-value oscillators. Nodes fire when their internal activation exceeds the threshold, passing excitement to connected neighbors. Pacemakers spike spontaneously, driving the entire system.</p>
              </div>
            </details>
            <details class="resource-drawer">
              <summary>Structure & Topology</summary>
              <div class="drawer-body">
                <p><strong>Node Count:</strong> Determines grid resolution. Higher counts require more processing but yield finer patterns.</p>
                <p><strong>Connection Density:</strong> How many local links each node forms. Higher means wider, more unified wave fronts.</p>
                <p><strong>Long-Range Links:</strong> Bridges distant areas, breaking local waves into complex, jumping patterns across the stage.</p>
              </div>
            </details>
            <details class="resource-drawer">
              <summary>Node Mix</summary>
              <div class="drawer-body">
                <p><strong>Excitatory:</strong> Standard nodes that spread waves.</p>
                <p><strong>Inhibitory:</strong> Nodes that suppress nearby activity, creating boundaries and halting runaway feedback.</p>
                <p><strong>Pacemaker:</strong> Spontaneous nodes that act as wave origins.</p>
                <p><strong>Burst:</strong> Chatter in quick, stuttering sequences, sustaining local activity before resting.</p>
              </div>
            </details>
            <details class="resource-drawer">
              <summary>Activity Dynamics</summary>
              <div class="drawer-body">
                <p><strong>Activation Threshold:</strong> Higher thresholds require multiple neighbors to fire synchronously to spread a signal.</p>
                <p><strong>Fire Rate:</strong> Adjusts the frequency of Pacemaker pulses.</p>
                <p><strong>Decay Rate:</strong> Controls how quickly activation fades.</p>
                <p><strong>Refractory Period:</strong> Rest time after firing. Longer rests create gaps between traveling waves.</p>
              </div>
            </details>
          </div>
        </section>
      </aside>

      <main class="stage-shell">
        <div class="stage-chrome">
          <div>
            <p class="section-kicker">Live Stage</p>
            <h2>Resonance Viewport</h2>
          </div>
          <dl class="stats-grid" id="stats-grid">
            <div><dt>Nodes</dt><dd data-stat="nodeCount">0</dd></div>
            <div><dt>Edges</dt><dd data-stat="edgeCount">0</dd></div>
            <div><dt>Pacemakers</dt><dd data-stat="pacemakerCount">0</dd></div>
            <div><dt>Active</dt><dd data-stat="activeNodeCount">0</dd></div>
            <div><dt>Avg Activation</dt><dd data-stat="averageActivation">0.00</dd></div>
            <div><dt>FPS</dt><dd data-stat="fps">0</dd></div>
          </dl>
        </div>

        <div class="canvas-frame">
          <div class="canvas-glow"></div>
          <div id="canvas-mount" class="canvas-mount" aria-label="Neural resonance canvas"></div>
        </div>
      </main>
    </div>
  `;

  const controlGroups = root.querySelector<HTMLDivElement>("#control-groups");
  if (!controlGroups) {
    throw new Error("Control panel root is missing.");
  }

  const sliderInputs = new Map<ControlledParamKey, HTMLInputElement>();
  const sliderValues = new Map<ControlledParamKey, HTMLElement>();

  const groupedDefinitions = PARAM_DEFINITIONS.reduce<Record<string, typeof PARAM_DEFINITIONS>>((groups, definition) => {
    if (!groups[definition.section]) {
      groups[definition.section] = [];
    }
    groups[definition.section].push(definition);
    return groups;
  }, {});

  controlGroups.innerHTML = Object.entries(groupedDefinitions)
    .map(([sectionKey, definitions]) => {
      const section = SECTION_COPY[sectionKey as keyof typeof SECTION_COPY];
      return `
        <div class="control-cluster">
          <div class="control-cluster-header">
            <h3>${section.title}</h3>
            <p>${section.blurb}</p>
          </div>
          <div class="control-stack">
            ${definitions
              .map(
                (definition) => `
                  <label class="control-card" for="param-${definition.key}">
                    <span class="control-copy">
                      <span class="control-name-row">
                        <span class="control-name">${definition.label}</span>
                        <span class="control-value" data-value-for="${definition.key}">
                          ${formatParamValue(definition.key, definition.defaultValue)}
                        </span>
                      </span>
                      <span class="control-description">${definition.description}</span>
                    </span>
                    <input
                      id="param-${definition.key}"
                      data-param-key="${definition.key}"
                      type="range"
                      min="${definition.min}"
                      max="${definition.max}"
                      step="${definition.step}"
                      value="${definition.defaultValue}"
                    />
                  </label>
                `,
              )
              .join("")}
          </div>
        </div>
      `;
    })
    .join("");

  PARAM_DEFINITIONS.forEach((definition) => {
    const input = root.querySelector<HTMLInputElement>(`#param-${definition.key}`);
    const valueNode = root.querySelector<HTMLElement>(`[data-value-for="${definition.key}"]`);
    if (!input || !valueNode) {
      throw new Error(`Missing control wiring for ${definition.key}.`);
    }
    sliderInputs.set(definition.key, input);
    sliderValues.set(definition.key, valueNode);
  });

  const statNodes = new Map<string, HTMLElement>();
  root.querySelectorAll<HTMLElement>("[data-stat]").forEach((node) => {
    const key = node.dataset.stat;
    if (key) {
      statNodes.set(key, node);
    }
  });

  return {
    canvasMount: query(root, "#canvas-mount"),
    seedInput: query(root, "#seed-input"),
    previousSeedButton: query(root, "#previous-seed"),
    nextSeedButton: query(root, "#next-seed"),
    randomSeedButton: query(root, "#random-seed"),
    playToggleButton: query(root, "#play-toggle"),
    resetButton: query(root, "#reset-controls"),
    exportButton: query(root, "#export-frame"),
    copyLinkButton: query(root, "#copy-link"),
    presetButtons: Array.from(root.querySelectorAll<HTMLButtonElement>("[data-preset]")),
    sliderInputs,
    sliderValues,
    statNodes,
  };
}

export function syncAppUi(refs: AppRefs, state: AppState): void {
  refs.seedInput.value = String(state.params.seed);
  refs.playToggleButton.textContent = state.isPlaying ? "Pause" : "Play";

  refs.presetButtons.forEach((button) => {
    const presetId = button.dataset.preset;
    button.classList.toggle("is-active", presetId === state.selectedPresetId);
  });

  refs.sliderInputs.forEach((input, key) => {
    input.value = String(state.params[key]);
  });

  refs.sliderValues.forEach((valueNode, key) => {
    valueNode.textContent = formatParamValue(key, state.params[key]);
  });

  refs.statNodes.get("nodeCount")!.textContent = String(state.stats.nodeCount);
  refs.statNodes.get("edgeCount")!.textContent = String(state.stats.edgeCount);
  refs.statNodes.get("pacemakerCount")!.textContent = String(state.stats.pacemakerCount);
  refs.statNodes.get("activeNodeCount")!.textContent = String(state.stats.activeNodeCount);
  refs.statNodes.get("averageActivation")!.textContent = state.stats.averageActivation.toFixed(2);
  refs.statNodes.get("fps")!.textContent = Math.round(state.stats.fps).toString();
}

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const node = root.querySelector<T>(selector);
  if (!node) {
    throw new Error(`Missing expected element: ${selector}`);
  }
  return node;
}
