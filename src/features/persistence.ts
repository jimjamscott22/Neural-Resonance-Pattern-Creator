import { clampParamValue, DEFAULT_PARAMS, type ParamKey, type ResonanceParams } from "../config/params";

const STORAGE_KEY = "neural-resonance-lab-state-v1";

export function loadPersistedParams(): Partial<ResonanceParams> {
  const fromUrl = parseUrl();
  if (Object.keys(fromUrl).length > 0) {
    return fromUrl;
  }

  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Partial<Record<ParamKey, unknown>>;
    return sanitize(parsed);
  } catch {
    return {};
  }
}

export function persistParams(params: ResonanceParams): void {
  if (typeof window === "undefined") {
    return;
  }

  const serialized = JSON.stringify(params);
  window.localStorage.setItem(STORAGE_KEY, serialized);

  const searchParams = new URLSearchParams();
  (Object.keys(DEFAULT_PARAMS) as ParamKey[]).forEach((key) => {
    const defaultValue = DEFAULT_PARAMS[key];
    const nextValue = params[key];
    if (nextValue !== defaultValue) {
      searchParams.set(key, String(nextValue));
    }
  });

  const nextUrl = `${window.location.pathname}${searchParams.toString() ? `?${searchParams}` : ""}`;
  window.history.replaceState({}, "", nextUrl);
}

function parseUrl(): Partial<ResonanceParams> {
  if (typeof window === "undefined") {
    return {};
  }

  const searchParams = new URLSearchParams(window.location.search);
  const parsed: Partial<Record<ParamKey, unknown>> = {};

  (Object.keys(DEFAULT_PARAMS) as ParamKey[]).forEach((key) => {
    const raw = searchParams.get(key);
    if (raw !== null) {
      const value = Number(raw);
      if (Number.isFinite(value)) {
        parsed[key] = value;
      }
    }
  });

  return sanitize(parsed);
}

function sanitize(candidate: Partial<Record<ParamKey, unknown>>): Partial<ResonanceParams> {
  const sanitized: Partial<ResonanceParams> = {};

  (Object.keys(candidate) as ParamKey[]).forEach((key) => {
    const value = candidate[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      sanitized[key] = clampParamValue(key, value);
    }
  });

  return sanitized;
}
