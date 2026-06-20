import type { ResonanceParams } from "../../config/params";
import { createRandom, distanceSquared } from "../math";
import type { NetworkBounds, NodeState } from "../types";
import type { TopologyPlugin } from "./TopologyBase";

export const SmallWorldTopology: TopologyPlugin = {
  build(nodes, params, bounds): number {
    const rng = createRandom(params.seed);

    const gridSize = Math.ceil(Math.sqrt(params.nodeCount));
    const spacing = Math.min(bounds.width, bounds.height) / (gridSize + 1);
    const cellSize = spacing * 2.5;
    const localRadiusSquared = cellSize * cellSize;

    const buckets = new Map<string, number[]>();
    const keyFor = (x: number, y: number) =>
      `${Math.floor(x / cellSize)}:${Math.floor(y / cellSize)}`;

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
          if (!bucket) continue;

          bucket.forEach((neighborId) => {
            if (neighborId === node.id) return;
            const neighbor = nodes[neighborId];
            const distance = distanceSquared(node.x, node.y, neighbor.x, neighbor.y);
            if (distance <= localRadiusSquared) {
              nearby.push({ id: neighborId, distance });
            }
          });
        }
      }

      nearby.sort((a, b) => a.distance - b.distance);

      const localTargets = nearby.slice(0, Math.min(params.connectionDensity, nearby.length));
      localTargets.forEach(({ id }) => {
        node.connections.push({ targetId: id, weight: rng.nextRange(0.8, 1.2) });
        edgeCount += 1;
      });

      if (rng.next() < params.longRangeConnectionChance) {
        const longRangeTarget = nodes[rng.nextInt(nodes.length)];
        if (longRangeTarget && longRangeTarget.id !== node.id) {
          node.connections.push({ targetId: longRangeTarget.id, weight: rng.nextRange(0.5, 0.8) });
          edgeCount += 1;
        }
      }
    });

    return edgeCount;
  },
};
