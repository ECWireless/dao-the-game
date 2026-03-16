import type { Agent } from '../types';
import { WORKER_CATALOG } from '../workers/catalog';
import { createRng } from './rng';

function shuffleAgents(agents: Agent[], seed: number): Agent[] {
  const rng = createRng(seed);
  const next = [...agents];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = rng.int(0, index);
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

export function generateStartingAgents(seed: number): Agent[] {
  return shuffleAgents(WORKER_CATALOG, seed);
}
