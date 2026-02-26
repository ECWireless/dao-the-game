const UINT32_MAX = 4294967296;

export type SeededRng = {
  next: () => number;
  int: (min: number, max: number) => number;
  pick: <T>(values: readonly T[]) => T;
  chance: (probability: number) => boolean;
};

export function normalizeSeed(seed: number): number {
  if (!Number.isFinite(seed)) {
    return 1;
  }

  return (Math.trunc(seed) >>> 0) || 1;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function createRng(seed: number): SeededRng {
  let state = normalizeSeed(seed);

  const next = (): number => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / UINT32_MAX;
  };

  const int = (min: number, max: number): number => {
    if (max < min) {
      throw new Error(`Invalid int range: min=${min}, max=${max}`);
    }

    const span = max - min + 1;
    return Math.floor(next() * span) + min;
  };

  const pick = <T>(values: readonly T[]): T => {
    if (values.length === 0) {
      throw new Error('Cannot pick from an empty list.');
    }

    return values[int(0, values.length - 1)];
  };

  const chance = (probability: number): boolean => {
    const bounded = clamp(probability, 0, 1);
    return next() < bounded;
  };

  return {
    next,
    int,
    pick,
    chance
  };
}

export function hashSeedParts(...parts: number[]): number {
  let hash = 2166136261;

  for (const part of parts) {
    hash ^= normalizeSeed(part);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}
