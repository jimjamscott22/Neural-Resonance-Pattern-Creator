import type { ResonanceParams } from "../config/params";
import { createNetwork } from "./createNetwork";
import { deriveStats, stepSimulation } from "./stepSimulation";
import type { EngineSnapshot, EngineStats, NetworkBounds, NetworkState } from "./types";

export class ResonanceEngine {
  private params: ResonanceParams;
  private state: NetworkState;
  private fps = 60;

  constructor(params: ResonanceParams, bounds: NetworkBounds) {
    this.params = { ...params };
    this.state = createNetwork(this.params, bounds);
  }

  rebuild(params: ResonanceParams, bounds: NetworkBounds): void {
    this.params = { ...params };
    this.state = createNetwork(this.params, bounds);
  }

  updateParams(params: ResonanceParams): void {
    this.params = { ...params };
  }

  resize(bounds: NetworkBounds): void {
    this.state = createNetwork(this.params, bounds);
  }

  step(): void {
    stepSimulation(this.state, this.params);
  }

  setFps(fps: number): void {
    this.fps = fps;
  }

  getStats(): EngineStats {
    return deriveStats(this.state, this.fps);
  }

  getSnapshot(): EngineSnapshot {
    return {
      state: this.state,
      params: this.params,
      stats: this.getStats(),
    };
  }
}
