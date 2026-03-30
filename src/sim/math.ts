export interface RandomSource {
  next(): number;
  nextRange(min: number, max: number): number;
  nextInt(maxExclusive: number): number;
}

export function createRandom(seed: number): RandomSource {
  let current = seed >>> 0;

  const next = () => {
    current += 0x6d2b79f5;
    let t = current;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    nextRange(min: number, max: number) {
      return min + (max - min) * next();
    },
    nextInt(maxExclusive: number) {
      return Math.floor(next() * maxExclusive);
    },
  };
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function hash(seed: number, x: number, y: number, z: number): number {
  let value = seed ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  value ^= value >>> 16;
  return (value >>> 0) / 4294967295;
}

export function valueNoise(seed: number, x: number, y: number, z = 0): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const z0 = Math.floor(z);

  const tx = smoothstep(x - x0);
  const ty = smoothstep(y - y0);

  const v00 = hash(seed, x0, y0, z0);
  const v10 = hash(seed, x0 + 1, y0, z0);
  const v01 = hash(seed, x0, y0 + 1, z0);
  const v11 = hash(seed, x0 + 1, y0 + 1, z0);

  const a = lerp(v00, v10, tx);
  const b = lerp(v01, v11, tx);
  return lerp(a, b, ty);
}

export function distanceSquared(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}
