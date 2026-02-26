import type { Agent } from '../types';
import { createRng } from './rng';

const ROLE_AFFINITIES = [
  'Strategy Architect',
  'Frontend Builder',
  'Prompt Engineer',
  'QA Verifier',
  'Content Operator',
  'Deployment Wrangler',
  'Analytics Watcher',
  'Operations Relay'
] as const;

const STARTING_AGENT_COUNT = 8;

export function generateStartingAgents(seed: number): Agent[] {
  const rng = createRng(seed);
  const agents: Agent[] = [];

  for (let i = 0; i < STARTING_AGENT_COUNT; i += 1) {
    const creativity = rng.int(42, 95);
    const reliability = rng.int(35, 96);
    const speed = rng.int(40, 95);
    const cost = Math.max(
      12,
      Math.round(8 + creativity * 0.16 + reliability * 0.14 + speed * 0.11 + rng.int(-3, 4))
    );

    agents.push({
      id: `agent-${String(i + 1).padStart(2, '0')}`,
      roleAffinity: rng.pick(ROLE_AFFINITIES),
      creativity,
      reliability,
      speed,
      cost
    });
  }

  return agents;
}
