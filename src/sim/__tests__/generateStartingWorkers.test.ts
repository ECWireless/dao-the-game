import { describe, expect, it } from 'vitest';
import { generateStartingWorkers } from '../generateStartingWorkers';

describe('generateStartingWorkers', () => {
  it('is deterministic for a fixed seed', () => {
    expect(generateStartingWorkers(101)).toEqual(generateStartingWorkers(101));
  });

  it('changes output when seed changes', () => {
    expect(generateStartingWorkers(101)).not.toEqual(generateStartingWorkers(202));
  });

  it('returns the authored worker roster with stable ids and blueprint data', () => {
    const workers = generateStartingWorkers(33);

    expect(workers).toHaveLength(6);
    expect(workers.map((worker) => worker.id).sort()).toEqual([
      'worker-01',
      'worker-02',
      'worker-03',
      'worker-04',
      'worker-05',
      'worker-06'
    ]);

    for (const worker of workers) {
      expect(worker.name.length).toBeGreaterThan(0);
      expect(worker.handle.length).toBeGreaterThan(0);
      expect(worker.specialty.length).toBeGreaterThan(0);
      expect(worker.traits.length).toBeGreaterThanOrEqual(3);
      expect(Number.parseFloat(worker.manifest.pricing.amount)).toBeGreaterThan(0);
      expect(worker.capabilityVector.design).toBeGreaterThanOrEqual(0);
      expect(worker.capabilityVector.design).toBeLessThanOrEqual(100);
      expect(worker.capabilityVector.implementation).toBeGreaterThanOrEqual(0);
      expect(worker.capabilityVector.implementation).toBeLessThanOrEqual(100);
      expect(worker.capabilityVector.review).toBeGreaterThanOrEqual(0);
      expect(worker.capabilityVector.review).toBeLessThanOrEqual(100);
      expect(worker.capabilityVector.deployment).toBeGreaterThanOrEqual(0);
      expect(worker.capabilityVector.deployment).toBeLessThanOrEqual(100);
    }
  });
});
