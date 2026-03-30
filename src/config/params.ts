export interface ResonanceParams {
  seed: number;
  nodeCount: number;
  connectionDensity: number;
  activationThreshold: number;
  fireRate: number;
  decayRate: number;
  refractoryPeriod: number;
  excitatoryRatio: number;
  inhibitoryRatio: number;
  pacemakerRatio: number;
  burstRatio: number;
  longRangeConnectionChance: number;
  trailFade: number;
}

export type ParamKey = keyof ResonanceParams;
export type ControlledParamKey = Exclude<ParamKey, "seed">;

export interface ParamDefinition {
  key: ControlledParamKey;
  label: string;
  section: "structure" | "nodeMix" | "activity" | "visuals";
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  rebuildOnChange: boolean;
  description: string;
  format?: (value: number) => string;
}

export const DEFAULT_PARAMS: ResonanceParams = {
  seed: 12345,
  nodeCount: 400,
  connectionDensity: 5,
  activationThreshold: 0.45,
  fireRate: 1,
  decayRate: 0.95,
  refractoryPeriod: 15,
  excitatoryRatio: 0.72,
  inhibitoryRatio: 0.15,
  pacemakerRatio: 0.08,
  burstRatio: 0.05,
  longRangeConnectionChance: 0.15,
  trailFade: 0.1,
};

const decimal = (digits: number) => (value: number) => value.toFixed(digits);
const percent = (value: number) => `${Math.round(value * 100)}%`;

export const PARAM_DEFINITIONS: ParamDefinition[] = [
  {
    key: "nodeCount",
    label: "Node Count",
    section: "structure",
    min: 100,
    max: 1600,
    step: 50,
    defaultValue: DEFAULT_PARAMS.nodeCount,
    rebuildOnChange: true,
    description: "Total resonant nodes in the field.",
  },
  {
    key: "connectionDensity",
    label: "Connection Density",
    section: "structure",
    min: 2,
    max: 14,
    step: 1,
    defaultValue: DEFAULT_PARAMS.connectionDensity,
    rebuildOnChange: true,
    description: "How many local neighbors each node prefers.",
  },
  {
    key: "excitatoryRatio",
    label: "Excitatory",
    section: "nodeMix",
    min: 0,
    max: 1,
    step: 0.01,
    defaultValue: DEFAULT_PARAMS.excitatoryRatio,
    rebuildOnChange: true,
    description: "Fraction of standard signal-propagating neurons.",
    format: percent,
  },
  {
    key: "inhibitoryRatio",
    label: "Inhibitory",
    section: "nodeMix",
    min: 0,
    max: 1,
    step: 0.01,
    defaultValue: DEFAULT_PARAMS.inhibitoryRatio,
    rebuildOnChange: true,
    description: "Fraction of neurons that suppress their neighbors.",
    format: percent,
  },
  {
    key: "pacemakerRatio",
    label: "Pacemaker",
    section: "nodeMix",
    min: 0,
    max: 1,
    step: 0.01,
    defaultValue: DEFAULT_PARAMS.pacemakerRatio,
    rebuildOnChange: true,
    description: "Fraction of spontaneous oscillators that seed waves.",
    format: percent,
  },
  {
    key: "burstRatio",
    label: "Burst",
    section: "nodeMix",
    min: 0,
    max: 1,
    step: 0.01,
    defaultValue: DEFAULT_PARAMS.burstRatio,
    rebuildOnChange: true,
    description: "Fraction of chattering neurons that fire in short bursts then fall silent.",
    format: percent,
  },
  {
    key: "longRangeConnectionChance",
    label: "Long-Range Links",
    section: "structure",
    min: 0,
    max: 0.4,
    step: 0.01,
    defaultValue: DEFAULT_PARAMS.longRangeConnectionChance,
    rebuildOnChange: true,
    description: "Chance for each node to form a distant bridge.",
    format: percent,
  },
  {
    key: "activationThreshold",
    label: "Activation Threshold",
    section: "activity",
    min: 0.2,
    max: 0.8,
    step: 0.01,
    defaultValue: DEFAULT_PARAMS.activationThreshold,
    rebuildOnChange: false,
    description: "Higher values make firing events rarer and sharper.",
    format: decimal(2),
  },
  {
    key: "fireRate",
    label: "Fire Rate",
    section: "activity",
    min: 0.5,
    max: 3,
    step: 0.1,
    defaultValue: DEFAULT_PARAMS.fireRate,
    rebuildOnChange: false,
    description: "Multiplier for pacemaker pulse speed.",
    format: decimal(1),
  },
  {
    key: "decayRate",
    label: "Decay Rate",
    section: "activity",
    min: 0.9,
    max: 0.99,
    step: 0.01,
    defaultValue: DEFAULT_PARAMS.decayRate,
    rebuildOnChange: false,
    description: "How long residual activation lingers after each pulse.",
    format: decimal(2),
  },
  {
    key: "refractoryPeriod",
    label: "Refractory Period",
    section: "activity",
    min: 5,
    max: 40,
    step: 1,
    defaultValue: DEFAULT_PARAMS.refractoryPeriod,
    rebuildOnChange: false,
    description: "Frames a node must rest before it can fire again.",
  },
  {
    key: "trailFade",
    label: "Trail Fade",
    section: "visuals",
    min: 0.03,
    max: 0.3,
    step: 0.01,
    defaultValue: DEFAULT_PARAMS.trailFade,
    rebuildOnChange: false,
    description: "Lower values leave longer luminous traces.",
    format: percent,
  },
];

export const SECTION_COPY: Record<ParamDefinition["section"], { title: string; blurb: string }> = {
  structure: {
    title: "Topology",
    blurb: "The seeded geometry and connection fabric of the network.",
  },
  nodeMix: {
    title: "Node Mix",
    blurb: "Population split across neuron archetypes. Ratios are normalized automatically.",
  },
  activity: {
    title: "Dynamics",
    blurb: "How excitation rises, spreads, and recovers over time.",
  },
  visuals: {
    title: "Atmosphere",
    blurb: "How quickly the field forgets what just happened.",
  },
};

const PARAM_DEF_MAP = new Map(PARAM_DEFINITIONS.map((definition) => [definition.key, definition]));

export function formatParamValue(key: ControlledParamKey, value: number): string {
  const definition = PARAM_DEF_MAP.get(key);
  if (!definition) {
    return String(value);
  }

  return definition.format ? definition.format(value) : String(value);
}

export function clampParamValue(key: ParamKey, value: number): number {
  if (key === "seed") {
    if (!Number.isFinite(value)) {
      return DEFAULT_PARAMS.seed;
    }

    return Math.max(1, Math.round(value));
  }

  const definition = PARAM_DEF_MAP.get(key);
  if (!definition || !Number.isFinite(value)) {
    return DEFAULT_PARAMS[key];
  }

  const stepped =
    Math.round((value - definition.min) / definition.step) * definition.step + definition.min;
  const clamped = Math.min(definition.max, Math.max(definition.min, stepped));
  return Number(clamped.toFixed(4));
}

export function mergeParams(candidate: Partial<Record<ParamKey, unknown>>): ResonanceParams {
  const merged: ResonanceParams = { ...DEFAULT_PARAMS };

  (Object.keys(DEFAULT_PARAMS) as ParamKey[]).forEach((key) => {
    const nextValue = candidate[key];
    if (typeof nextValue === "number" && Number.isFinite(nextValue)) {
      merged[key] = clampParamValue(key, nextValue);
    }
  });

  return merged;
}

export function cloneParams(params: ResonanceParams): ResonanceParams {
  return { ...params };
}
