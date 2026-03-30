import type { ResonanceParams } from "../config/params";
import { createRandom, distanceSquared, valueNoise } from "./math";
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

  const cellSize = spacing * 2.5;
  const localRadiusSquared = cellSize * cellSize;
  const buckets = new Map<string, number[]>();

  const keyFor = (x: number, y: number) => `${Math.floor(x / cellSize)}:${Math.floor(y / cellSize)}`;

  nodes.forEach((node) => {
    const key = keyFor(node.x, node.y);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(node.id);
      return;
    }
    buckets.set(key, [node.id]);
  });

  let edgeCount = 0;

  nodes.forEach((node) => {
    const baseCellX = Math.floor(node.x / cellSize);
    const baseCellY = Math.floor(node.y / cellSize);
    const nearby: { id: number; distance: number }[] = [];

    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        const bucket = buckets.get(`${baseCellX + dx}:${baseCellY + dy}`);
        if (!bucket) {
          continue;
        }

        bucket.forEach((neighborId) => {
          if (neighborId === node.id) {
            return;
          }

          const neighbor = nodes[neighborId];
          const distance = distanceSquared(node.x, node.y, neighbor.x, neighbor.y);
          if (distance <= localRadiusSquared) {
            nearby.push({ id: neighborId, distance });
          }
        });
      }
    }

    nearby.sort((left, right) => left.distance - right.distance);

    const localTargets = nearby.slice(0, Math.min(params.connectionDensity, nearby.length));
    localTargets.forEach(({ id }) => {
      node.connections.push({
        targetId: id,
        weight: rng.nextRange(0.8, 1.2),
      });
      edgeCount += 1;
    });

    if (rng.next() < params.longRangeConnectionChance) {
      const longRangeTarget = nodes[rng.nextInt(nodes.length)];
      if (longRangeTarget && longRangeTarget.id !== node.id) {
        node.connections.push({
          targetId: longRangeTarget.id,
          weight: rng.nextRange(0.5, 0.8),
        });
        edgeCount += 1;
      }
    }
  });

  return {
    nodes,
    time: 0,
    edgeCount,
    bounds,
  };
}
