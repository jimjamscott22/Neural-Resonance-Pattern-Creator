import type { ResonanceParams } from "../config/params";
import type { EngineStats, NetworkState, NodeState } from "./types";

const RECENT_WINDOW = 200;

export function stepSimulation(state: NetworkState, params: ResonanceParams): void {
  state.time += 1;

  state.nodes.forEach((node) => {
    updateNode(node, state, params);
  });

  state.nodes.forEach((node) => {
    node.activation = node.nextActivation;
  });
}

function updateNode(node: NodeState, state: NetworkState, params: ResonanceParams): void {
  let input = 0;

  node.connections.forEach((connection) => {
    input += state.nodes[connection.targetId].activation * connection.weight;
  });

  if (node.connections.length > 0) {
    input /= node.connections.length;
  }

  if (node.isPacemaker) {
    node.pacemakerPhase += 0.05 * params.fireRate;
    input += (Math.sin(node.pacemakerPhase) + 1) * 0.3;
  }

  const nextSignal = 1 / (1 + Math.exp(-10 * (input - params.activationThreshold)));
  node.nextActivation = node.activation * params.decayRate + nextSignal * (1 - params.decayRate);

  const timeSinceLastFire = state.time - node.lastFire;
  if (node.nextActivation > 0.8 && timeSinceLastFire > params.refractoryPeriod) {
    node.nextActivation = 1;
    node.lastFire = state.time;
    node.firingHistory.push(state.time);

    if (node.firingHistory.length > 50) {
      node.firingHistory.shift();
    }
  }
}

export function deriveStats(state: NetworkState, fps: number): EngineStats {
  let totalActivation = 0;
  let activeNodeCount = 0;
  let pacemakerCount = 0;

  state.nodes.forEach((node) => {
    totalActivation += node.activation;
    if (node.activation > 0.3) {
      activeNodeCount += 1;
    }
    if (node.isPacemaker) {
      pacemakerCount += 1;
    }
  });

  return {
    nodeCount: state.nodes.length,
    edgeCount: state.edgeCount,
    pacemakerCount,
    activeNodeCount,
    averageActivation: state.nodes.length > 0 ? totalActivation / state.nodes.length : 0,
    time: state.time,
    fps,
  };
}

export function getFiringRate(node: NodeState, currentTime: number): number {
  if (node.firingHistory.length < 2) {
    return 0;
  }

  const recentFires = node.firingHistory.filter((tick) => currentTime - tick < RECENT_WINDOW);
  return recentFires.length / RECENT_WINDOW;
}
