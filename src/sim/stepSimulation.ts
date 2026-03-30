import type { ResonanceParams } from "../config/params";
import type { EngineStats, NetworkState, NodeState } from "./types";

const RECENT_WINDOW = 200;
const BURST_DURATION = 8;
const BURST_COOLDOWN = 30;

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
  switch (node.nodeType) {
    case "excitatory":
      updateExcitatory(node, state, params);
      break;
    case "inhibitory":
      updateInhibitory(node, state, params);
      break;
    case "pacemaker":
      updatePacemaker(node, state, params);
      break;
    case "burst":
      updateBurst(node, state, params);
      break;
  }
}

/** Accumulates weighted input from neighbors, treating inhibitory sources as negative. */
function accumulateInput(node: NodeState, state: NetworkState): number {
  let input = 0;

  node.connections.forEach((connection) => {
    const target = state.nodes[connection.targetId];
    const sign = target.nodeType === "inhibitory" ? -1 : 1;
    input += sign * target.activation * connection.weight;
  });

  if (node.connections.length > 0) {
    input /= node.connections.length;
  }

  return input;
}

function sigmoid(input: number, threshold: number): number {
  return 1 / (1 + Math.exp(-10 * (input - threshold)));
}

function recordFire(node: NodeState, time: number): void {
  node.lastFire = time;
  node.firingHistory.push(time);

  if (node.firingHistory.length > 50) {
    node.firingHistory.shift();
  }
}

function updateExcitatory(node: NodeState, state: NetworkState, params: ResonanceParams): void {
  const input = accumulateInput(node, state);
  const nextSignal = sigmoid(input, params.activationThreshold);
  node.nextActivation = node.activation * params.decayRate + nextSignal * (1 - params.decayRate);

  const timeSinceLastFire = state.time - node.lastFire;
  if (node.nextActivation > 0.8 && timeSinceLastFire > params.refractoryPeriod) {
    node.nextActivation = 1;
    recordFire(node, state.time);
  }
}

function updateInhibitory(node: NodeState, state: NetworkState, params: ResonanceParams): void {
  // Inhibitory nodes receive the same input accumulation but their outgoing sign is already
  // handled in accumulateInput for their neighbors. Internally they fire like excitatory
  // nodes — they just suppress rather than excite whoever reads from them.
  const input = accumulateInput(node, state);
  const nextSignal = sigmoid(input, params.activationThreshold);
  node.nextActivation = node.activation * params.decayRate + nextSignal * (1 - params.decayRate);

  const timeSinceLastFire = state.time - node.lastFire;
  if (node.nextActivation > 0.8 && timeSinceLastFire > params.refractoryPeriod) {
    node.nextActivation = 1;
    recordFire(node, state.time);
  }
}

function updatePacemaker(node: NodeState, state: NetworkState, params: ResonanceParams): void {
  let input = accumulateInput(node, state);

  node.pacemakerPhase += 0.05 * params.fireRate;
  input += (Math.sin(node.pacemakerPhase) + 1) * 0.3;

  const nextSignal = sigmoid(input, params.activationThreshold);
  node.nextActivation = node.activation * params.decayRate + nextSignal * (1 - params.decayRate);

  const timeSinceLastFire = state.time - node.lastFire;
  if (node.nextActivation > 0.8 && timeSinceLastFire > params.refractoryPeriod) {
    node.nextActivation = 1;
    recordFire(node, state.time);
  }
}

function updateBurst(node: NodeState, state: NetworkState, params: ResonanceParams): void {
  // Forced silence after a burst completes
  if (node.burstCooldown > 0) {
    node.burstCooldown -= 1;
    node.nextActivation = 0;
    return;
  }

  // Continue an active burst
  if (node.burstCounter > 0) {
    node.burstCounter -= 1;
    node.nextActivation = 1;
    recordFire(node, state.time);

    if (node.burstCounter === 0) {
      node.burstCooldown = BURST_COOLDOWN;
    }
    return;
  }

  // Idle: accumulate input and decide whether to start a new burst
  const input = accumulateInput(node, state);
  const nextSignal = sigmoid(input, params.activationThreshold);
  node.nextActivation = node.activation * params.decayRate + nextSignal * (1 - params.decayRate);

  const timeSinceLastFire = state.time - node.lastFire;
  if (node.nextActivation > 0.8 && timeSinceLastFire > params.refractoryPeriod) {
    node.burstCounter = BURST_DURATION - 1;
    node.nextActivation = 1;
    recordFire(node, state.time);
  }
}

export function deriveStats(state: NetworkState, fps: number): EngineStats {
  let totalActivation = 0;
  let activeNodeCount = 0;
  let pacemakerCount = 0;
  let inhibitoryCount = 0;
  let burstCount = 0;

  state.nodes.forEach((node) => {
    totalActivation += node.activation;
    if (node.activation > 0.3) {
      activeNodeCount += 1;
    }

    switch (node.nodeType) {
      case "pacemaker":
        pacemakerCount += 1;
        break;
      case "inhibitory":
        inhibitoryCount += 1;
        break;
      case "burst":
        burstCount += 1;
        break;
    }
  });

  return {
    nodeCount: state.nodes.length,
    edgeCount: state.edgeCount,
    pacemakerCount,
    inhibitoryCount,
    burstCount,
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
