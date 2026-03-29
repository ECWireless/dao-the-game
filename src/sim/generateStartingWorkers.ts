import type { Worker } from '../types';
import { BUILTIN_WORKER_REGISTRY } from '../workers/registry';
import { createRng } from './rng';

function shuffleWorkers(workers: Worker[], seed: number): Worker[] {
  const rng = createRng(seed);
  const next = [...workers];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = rng.int(0, index);
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

export function generateStartingWorkers(seed: number): Worker[] {
  return shuffleWorkers(BUILTIN_WORKER_REGISTRY, seed);
}
