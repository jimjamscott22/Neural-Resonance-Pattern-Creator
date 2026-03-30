import p5 from "p5";
import type { ResonanceParams } from "../config/params";
import { ResonanceEngine } from "../sim/engine";
import { getFiringRate } from "../sim/stepSimulation";

interface RendererOptions {
  container: HTMLElement;
  initialParams: ResonanceParams;
  getParams: () => ResonanceParams;
  getPlaying: () => boolean;
  onStats: (stats: ReturnType<ResonanceEngine["getStats"]>) => void;
}

export interface RendererController {
  setParams(params: ResonanceParams, rebuild: boolean): void;
  exportFrame(): void;
  destroy(): void;
}

export function createP5Renderer(options: RendererOptions): RendererController {
  let currentParams = { ...options.initialParams };
  let bounds = measureBounds(options.container);
  const engine = new ResonanceEngine(currentParams, bounds);
  let clearBackground = true;
  let sketch: p5;

  const instance = new p5((p: p5) => {
    sketch = p;

    p.setup = () => {
      const canvas = p.createCanvas(bounds.width, bounds.height);
      canvas.parent(options.container);
      p.pixelDensity(1);
      p.noSmooth();
      paintBackground(p);
    };

    p.draw = () => {
      currentParams = options.getParams();
      if (clearBackground) {
        paintBackground(p);
        clearBackground = false;
      }

      p.noStroke();
      p.fill(5, 8, 15, Math.round(currentParams.trailFade * 255));
      p.rect(0, 0, p.width, p.height);

      if (options.getPlaying()) {
        engine.step();
      }

      drawSnapshot(p, engine);
      engine.setFps(p.frameRate());
      options.onStats(engine.getStats());
    };
  });

  const resizeObserver = new ResizeObserver(() => {
    const nextBounds = measureBounds(options.container);
    if (nextBounds.width === bounds.width && nextBounds.height === bounds.height) {
      return;
    }

    bounds = nextBounds;
    sketch.resizeCanvas(bounds.width, bounds.height);
    engine.resize(bounds);
    clearBackground = true;
  });

  resizeObserver.observe(options.container);

  return {
    setParams(params, rebuild) {
      currentParams = { ...params };
      if (rebuild) {
        engine.rebuild(currentParams, bounds);
        clearBackground = true;
        return;
      }

      engine.updateParams(currentParams);
    },
    exportFrame() {
      const name = `neural-resonance-${currentParams.seed}`;
      instance.saveCanvas(name, "png");
    },
    destroy() {
      resizeObserver.disconnect();
      instance.remove();
    },
  };
}

function paintBackground(p: p5): void {
  p.background(5, 8, 15);
}

function drawSnapshot(p: p5, engine: ResonanceEngine): void {
  const snapshot = engine.getSnapshot();
  const { nodes, time } = snapshot.state;

  nodes.forEach((node) => {
    if (node.firingHistory.length === 0) {
      return;
    }

    const recentFiring = node.firingHistory[node.firingHistory.length - 1];
    const timeSinceFire = time - recentFiring;

    if (timeSinceFire >= 10) {
      return;
    }

    const alpha = mapRange(timeSinceFire, 0, 10, 90, 0);
    const color = getNodeColor(node.activation, getFiringRate(node, time), node.nodeType);

    node.connections.forEach((connection) => {
      const target = nodes[connection.targetId];
      p.stroke(color.r, color.g, color.b, alpha);
      p.strokeWeight(0.5);
      p.line(node.x, node.y, target.x, target.y);
    });
  });

  nodes.forEach((node) => {
    const color = getNodeColor(node.activation, getFiringRate(node, time), node.nodeType);

    if (node.activation > 0.3) {
      const glowSize = mapRange(node.activation, 0.3, 1, 5, 16);
      const alpha = mapRange(node.activation, 0.3, 1, 40, 180);
      p.noStroke();
      p.fill(color.r, color.g, color.b, alpha);
      p.circle(node.x, node.y, glowSize);
    }

    p.noStroke();
    p.fill(color.r, color.g, color.b);
    p.circle(node.x, node.y, mapRange(node.activation, 0, 1, 2.2, 4.6));

    const timeSinceLastFire = time - node.lastFire;
    if (timeSinceLastFire < 6) {
      p.fill(255, 251, 243, mapRange(timeSinceLastFire, 0, 6, 255, 0));
      p.circle(node.x, node.y, 7);
    }

    // Burst nodes get an extra outer ring during their active burst window
    if (node.nodeType === "burst" && node.burstCounter > 0) {
      p.noFill();
      p.stroke(color.r, color.g, color.b, 160);
      p.strokeWeight(1);
      p.circle(node.x, node.y, 12);
    }
  });
}

function measureBounds(container: HTMLElement): { width: number; height: number } {
  const rect = container.getBoundingClientRect();
  const fallback = 720;
  const width = Math.max(320, Math.floor(rect.width || fallback));
  const height = Math.max(320, Math.floor(rect.height || fallback));
  return { width, height };
}

function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  if (inMax === inMin) {
    return outMin;
  }

  const clamped = Math.min(inMax, Math.max(inMin, value));
  return outMin + ((clamped - inMin) / (inMax - inMin)) * (outMax - outMin);
}

function getNodeColor(
  activation: number,
  firingRate: number,
  nodeType: import("../sim/types").NodeType,
): { r: number; g: number; b: number } {
  if (nodeType === "inhibitory") {
    // Cool violet-purple hue, independent of firing rate
    const saturation = mapRange(activation, 0, 1, 30, 90);
    const brightness = mapRange(activation, 0, 1, 18, 88);
    return hsbToRgb(278, saturation, brightness);
  }

  const hue = clamp(mapRange(firingRate, 0, 0.15, 210, 12), 12, 210);
  const saturation = mapRange(activation, 0, 1, 25, 95);
  const brightness = mapRange(activation, 0, 1, 18, 100);
  return hsbToRgb(hue, saturation, brightness);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hsbToRgb(hue: number, saturation: number, brightness: number): { r: number; g: number; b: number } {
  const s = saturation / 100;
  const v = brightness / 100;
  const c = v * s;
  const h = (hue % 360) / 60;
  const x = c * (1 - Math.abs((h % 2) - 1));

  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 1) {
    r = c;
    g = x;
  } else if (h < 2) {
    r = x;
    g = c;
  } else if (h < 3) {
    g = c;
    b = x;
  } else if (h < 4) {
    g = x;
    b = c;
  } else if (h < 5) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const m = v - c;
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}
