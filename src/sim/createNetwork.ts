import type { ResonanceParams } from "../config/params";
import { createRandom, valueNoise } from "./math";
import { SmallWorldTopology } from "./topologies/SmallWorldTopology";
import type { NetworkBounds, NetworkState, NodeState, NodeType } from "./types";

interface TypeThresholds {
  excitatory: number;
  inhibitory: number;
  pacemaker: number;
}

function buildTypeThresholds(params: ResonanceParams): TypeThresholds {
  const total =
    params.excitatoryRatio +
    params.inhibitoryRatio +
    params.pacemakerRatio +
    params.burstRatio;

  // Fall back to all-excitatory if ratios are all zero
  if (total <= 0) {
    return { excitatory: 1, inhibitory: 1, pacemaker: 1 };
  }

  return {
    excitatory: params.excitatoryRatio / total,
    inhibitory: (params.excitatoryRatio + params.inhibitoryRatio) / total,
    pacemaker: (params.excitatoryRatio + params.inhibitoryRatio + params.pacemakerRatio) / total,
  };
}

function pickNodeType(roll: number, thresholds: TypeThresholds): NodeType {
  if (roll < thresholds.excitatory) return "excitatory";
  if (roll < thresholds.inhibitory) return "inhibitory";
  if (roll < thresholds.pacemaker) return "pacemaker";
  return "burst";
}

export function createNetwork(params: ResonanceParams, bounds: NetworkBounds): NetworkState {
  const rng = createRandom(params.seed);
  const nodes: NodeState[] = [];
  const thresholds = buildTypeThresholds(params);

  const gridSize = Math.ceil(Math.sqrt(params.nodeCount));
  const spacing = Math.min(bounds.width, bounds.height) / (gridSize + 1);
  const offsetX = (bounds.width - spacing * (gridSize + 1)) / 2 + spacing;
  const offsetY = (bounds.height - spacing * (gridSize + 1)) / 2 + spacing;
  const noiseOffset = spacing * 0.3;

  let nodeIndex = 0;
  for (let row = 0; row < gridSize && nodeIndex < params.nodeCount; row += 1) {
    for (let col = 0; col < gridSize && nodeIndex < params.nodeCount; col += 1) {
      const baseX = offsetX + col * spacing;
      const baseY = offsetY + row * spacing;
      const x = baseX + (valueNoise(params.seed, row * 0.1, col * 0.1, 0) - 0.5) * noiseOffset;
      const y = baseY + (valueNoise(params.seed, row * 0.1, col * 0.1, 100) - 0.5) * noiseOffset;

      nodes.push({
        id: nodeIndex,
        x,
        y,
        nodeType: pickNodeType(rng.next(), thresholds),
        activation: 0,
        nextActivation: 0,
        connections: [],
        firingHistory: [],
        lastFire: -1000,
        pacemakerPhase: rng.nextRange(0, Math.PI * 2),
        burstCounter: 0,
        burstCooldown: 0,
      });

      nodeIndex += 1;
    }
  }

  const edgeCount = SmallWorldTopology.build(nodes, params, bounds);

  return {
    nodes,
    time: 0,
    edgeCount,
    bounds,
  };
}
