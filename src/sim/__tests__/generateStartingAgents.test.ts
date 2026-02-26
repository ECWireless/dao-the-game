import { describe, expect, it } from 'vitest';
import { generateStartingAgents } from '../generateStartingAgents';

describe('generateStartingAgents', () => {
  it('is deterministic for a fixed seed', () => {
    expect(generateStartingAgents(101)).toEqual(generateStartingAgents(101));
  });

  it('changes output when seed changes', () => {
    expect(generateStartingAgents(101)).not.toEqual(generateStartingAgents(202));
  });

  it('returns 8 bounded agents with stable ids', () => {
    const agents = generateStartingAgents(33);

    expect(agents).toHaveLength(8);
    expect(agents[0]?.id).toBe('agent-01');

    for (const agent of agents) {
      expect(agent.creativity).toBeGreaterThanOrEqual(42);
      expect(agent.creativity).toBeLessThanOrEqual(95);
      expect(agent.reliability).toBeGreaterThanOrEqual(35);
      expect(agent.reliability).toBeLessThanOrEqual(96);
      expect(agent.speed).toBeGreaterThanOrEqual(40);
      expect(agent.speed).toBeLessThanOrEqual(95);
      expect(agent.cost).toBeGreaterThanOrEqual(12);
    }
  });
});
