import type { ResonanceParams } from "../../config/params";
import { createRandom } from "../math";
import type { NetworkBounds, NodeState } from "../types";
import type { TopologyPlugin } from "./TopologyBase";

export const RandomTopology: TopologyPlugin = {
  build(nodes: NodeState[], params: ResonanceParams, _bounds: NetworkBounds): number {
    const rng = createRandom(params.seed);
    let edgeCount = 0;
 
    const p = params.connectionDensity / (nodes.length - 1);
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        if (rng.next() < p) {
          const weight = rng.nextRange(0.8, 1.2);
          nodes[i].connections.push({ targetId: j, weight });
          nodes[j].connections.push({ targetId: i, weight });
          edgeCount += 2;
        }
      }
    }
    return edgeCount;
  },
};
