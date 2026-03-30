import type { ResonanceParams } from "../config/params";

export interface PresetDefinition {
  id: string;
  name: string;
  accent: string;
  description: string;
  params: Partial<ResonanceParams>;
}

export const PRESETS: PresetDefinition[] = [
  {
    id: "baseline",
    name: "Baseline Field",
    accent: "#ff7f50",
    description: "A balanced topology close to the original prototype.",
    params: {},
  },
  {
    id: "storm",
    name: "Signal Storm",
    accent: "#f5b642",
    description: "Dense circuitry with frequent long-range bridges and fast pulses.",
    params: {
      nodeCount: 900,
      connectionDensity: 9,
      fireRate: 2.2,
      longRangeConnectionChance: 0.28,
      trailFade: 0.07,
    },
  },
  {
    id: "cathedral",
    name: "Glass Cathedral",
    accent: "#74b3ff",
    description: "Slow, luminous propagation with long rests between flashes.",
    params: {
      nodeCount: 625,
      connectionDensity: 4,
      activationThreshold: 0.52,
      decayRate: 0.97,
      refractoryPeriod: 24,
      trailFade: 0.05,
    },
  },
  {
    id: "mycelial",
    name: "Mycelial Drift",
    accent: "#7bc6a4",
    description: "Sparse structure with a higher pacemaker ratio for wandering blooms.",
    params: {
      nodeCount: 500,
      connectionDensity: 3,
      pacemakerRatio: 0.11,
      fireRate: 1.4,
      longRangeConnectionChance: 0.09,
    },
  },
];
