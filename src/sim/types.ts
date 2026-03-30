import type { ResonanceParams } from "../config/params";

export type NodeType = "excitatory" | "inhibitory" | "pacemaker" | "burst";

export interface Connection {
  targetId: number;
  weight: number;
}

export interface NodeState {
  id: number;
  x: number;
  y: number;
  nodeType: NodeType;
  activation: number;
  nextActivation: number;
  connections: Connection[];
  firingHistory: number[];
  lastFire: number;
  pacemakerPhase: number;
  burstCounter: number;
  burstCooldown: number;
}

export interface NetworkBounds {
  width: number;
  height: number;
}

export interface NetworkState {
  nodes: NodeState[];
  time: number;
  edgeCount: number;
  bounds: NetworkBounds;
}

export interface EngineStats {
  nodeCount: number;
  edgeCount: number;
  pacemakerCount: number;
  inhibitoryCount: number;
  burstCount: number;
  activeNodeCount: number;
  averageActivation: number;
  time: number;
  fps: number;
}

export interface EngineSnapshot {
  state: NetworkState;
  params: ResonanceParams;
  stats: EngineStats;
}
