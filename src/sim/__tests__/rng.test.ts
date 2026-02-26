import { describe, expect, it } from 'vitest';
import { createRng, hashSeedParts } from '../rng';

describe('createRng', () => {
  it('returns identical sequences for the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);

    const sequenceA = [a.next(), a.next(), a.next(), a.next()];
    const sequenceB = [b.next(), b.next(), b.next(), b.next()];

    expect(sequenceA).toEqual(sequenceB);
  });

  it('returns different sequences for different seeds', () => {
    const a = createRng(42);
    const b = createRng(43);

    const sequenceA = [a.next(), a.next(), a.next()];
    const sequenceB = [b.next(), b.next(), b.next()];

    expect(sequenceA).not.toEqual(sequenceB);
  });

  it('produces bounded integers', () => {
    const rng = createRng(99);

    for (let i = 0; i < 50; i += 1) {
      const value = rng.int(3, 8);
      expect(value).toBeGreaterThanOrEqual(3);
      expect(value).toBeLessThanOrEqual(8);
    }
  });
});

describe('hashSeedParts', () => {
  it('is stable for the same numeric input', () => {
    expect(hashSeedParts(1, 2, 3, 4)).toBe(hashSeedParts(1, 2, 3, 4));
  });
});
