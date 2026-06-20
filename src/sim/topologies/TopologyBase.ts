import type { ResonanceParams } from "../../config/params";
import type { NetworkBounds, NodeState } from "../types";

export interface TopologyPlugin {
  build(nodes: NodeState[], params: ResonanceParams, bounds: NetworkBounds): number;
}
