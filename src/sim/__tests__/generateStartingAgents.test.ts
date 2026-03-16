import { describe, expect, it } from 'vitest';
import { generateStartingAgents } from '../generateStartingAgents';

describe('generateStartingAgents', () => {
  it('is deterministic for a fixed seed', () => {
    expect(generateStartingAgents(101)).toEqual(generateStartingAgents(101));
  });

  it('changes output when seed changes', () => {
    expect(generateStartingAgents(101)).not.toEqual(generateStartingAgents(202));
  });

  it('returns the authored worker roster with stable ids and blueprint data', () => {
    const agents = generateStartingAgents(33);

    expect(agents).toHaveLength(10);
    expect(agents.map((agent) => agent.id).sort()).toEqual([
      'agent-01',
      'agent-02',
      'agent-03',
      'agent-04',
      'agent-05',
      'agent-06',
      'agent-07',
      'agent-08',
      'agent-09',
      'agent-10'
    ]);

    for (const agent of agents) {
      expect(agent.name.length).toBeGreaterThan(0);
      expect(agent.handle.length).toBeGreaterThan(0);
      expect(agent.archetype.length).toBeGreaterThan(0);
      expect(agent.traits.length).toBeGreaterThanOrEqual(3);
      expect(agent.contractCost).toBeGreaterThanOrEqual(12);
      expect(agent.capabilityVector.design).toBeGreaterThanOrEqual(0);
      expect(agent.capabilityVector.design).toBeLessThanOrEqual(100);
      expect(agent.capabilityVector.implementation).toBeGreaterThanOrEqual(0);
      expect(agent.capabilityVector.implementation).toBeLessThanOrEqual(100);
      expect(agent.capabilityVector.review).toBeGreaterThanOrEqual(0);
      expect(agent.capabilityVector.review).toBeLessThanOrEqual(100);
      expect(agent.capabilityVector.deployment).toBeGreaterThanOrEqual(0);
      expect(agent.capabilityVector.deployment).toBeLessThanOrEqual(100);
    }
  });
});
