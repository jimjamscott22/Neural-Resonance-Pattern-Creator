import {
  DEFAULT_PARAMS,
  PARAM_DEFINITIONS,
  clampParamValue,
  cloneParams,
  type ControlledParamKey,
  type ResonanceParams,
} from "../config/params";
import { PRESETS } from "../features/presets";
import type { EngineStats } from "../sim/types";

export interface AppState {
  params: ResonanceParams;
  selectedPresetId: string;
  isPlaying: boolean;
  stats: EngineStats;
}

export type AppAction =
  | { type: "set-param"; key: ControlledParamKey; value: number; rebuild: boolean }
  | { type: "set-seed"; seed: number }
  | { type: "offset-seed"; delta: number }
  | { type: "randomize-seed"; seed: number }
  | { type: "reset-all" }
  | { type: "apply-preset"; presetId: string }
  | { type: "toggle-playing" }
  | { type: "set-playing"; isPlaying: boolean }
  | { type: "set-stats"; stats: EngineStats };

type Listener = (state: AppState, action: AppAction) => void;

const FALLBACK_STATS: EngineStats = {
  nodeCount: DEFAULT_PARAMS.nodeCount,
  edgeCount: 0,
  pacemakerCount: 0,
  inhibitoryCount: 0,
  burstCount: 0,
  activeNodeCount: 0,
  averageActivation: 0,
  time: 0,
  fps: 60,
};

const REBUILD_KEYS = new Set(
  PARAM_DEFINITIONS.filter((definition) => definition.rebuildOnChange).map((definition) => definition.key),
);

export class AppStore {
  private state: AppState;
  private listeners = new Set<Listener>();

  constructor(initialParams: ResonanceParams) {
    this.state = {
      params: cloneParams(initialParams),
      selectedPresetId: "baseline",
      isPlaying: true,
      stats: FALLBACK_STATS,
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState(), { type: "set-stats", stats: this.state.stats });

    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): AppState {
    return {
      ...this.state,
      params: cloneParams(this.state.params),
      stats: { ...this.state.stats },
    };
  }

  dispatch(action: AppAction): void {
    switch (action.type) {
      case "set-param":
        this.state = {
          ...this.state,
          params: {
            ...this.state.params,
            [action.key]: clampParamValue(action.key, action.value),
          },
          selectedPresetId: "custom",
        };
        break;
      case "set-seed":
        this.state = {
          ...this.state,
          params: {
            ...this.state.params,
            seed: clampParamValue("seed", action.seed),
          },
          selectedPresetId: "custom",
        };
        break;
      case "offset-seed":
        this.state = {
          ...this.state,
          params: {
            ...this.state.params,
            seed: Math.max(1, this.state.params.seed + action.delta),
          },
          selectedPresetId: "custom",
        };
        break;
      case "randomize-seed":
        this.state = {
          ...this.state,
          params: {
            ...this.state.params,
            seed: clampParamValue("seed", action.seed),
          },
          selectedPresetId: "custom",
        };
        break;
      case "reset-all":
        this.state = {
          ...this.state,
          params: cloneParams(DEFAULT_PARAMS),
          selectedPresetId: "baseline",
        };
        break;
      case "apply-preset": {
        const preset = PRESETS.find((entry) => entry.id === action.presetId);
        if (!preset) {
          return;
        }

        this.state = {
          ...this.state,
          params: {
            ...this.state.params,
            ...preset.params,
          },
          selectedPresetId: preset.id,
        };
        break;
      }
      case "toggle-playing":
        this.state = {
          ...this.state,
          isPlaying: !this.state.isPlaying,
        };
        break;
      case "set-playing":
        this.state = {
          ...this.state,
          isPlaying: action.isPlaying,
        };
        break;
      case "set-stats":
        this.state = {
          ...this.state,
          stats: { ...action.stats },
        };
        break;
      default:
        return;
    }

    this.listeners.forEach((listener) => {
      listener(this.getState(), action);
    });
  }

  static requiresRebuild(key: ControlledParamKey): boolean {
    return REBUILD_KEYS.has(key);
  }
}
