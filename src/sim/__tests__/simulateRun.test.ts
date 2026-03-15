import { describe, expect, it } from 'vitest';
import type { Brief, HatRole, RunState } from '../../types';
import { generateStartingAgents } from '../generateStartingAgents';
import { simulateRun } from '../simulateRun';

const brief: Brief = {
  id: 'brief-conf-01',
  clientName: 'Meta Summit',
  mission: 'Rebuild a failing conference brand website.',
  requirements: ['No human labor', 'Autonomous execution'],
  baseScore: 58,
  passThreshold: 72
};

const fullRoles: HatRole[] = [
  {
    id: 'role-01',
    name: 'Mission Coordinator',
    assignedAgentId: 'agent-01',
    pipelineStageId: 'design'
  },
  {
    id: 'role-02',
    name: 'Frontend Architect',
    assignedAgentId: 'agent-02',
    pipelineStageId: 'implementation'
  },
  {
    id: 'role-03',
    name: 'Quality Relay',
    assignedAgentId: 'agent-03',
    pipelineStageId: 'review'
  },
  {
    id: 'role-04',
    name: 'Deployment Operator',
    assignedAgentId: 'agent-04',
    pipelineStageId: 'deployment'
  }
];

function buildState(overrides: Partial<RunState> = {}): RunState {
  return {
    seed: 777,
    treasury: 420,
    brief,
    roles: fullRoles,
    agents: generateStartingAgents(777),
    ...overrides
  };
}

describe('simulateRun', () => {
  it('is deterministic for the same input', () => {
    const state = buildState();

    expect(simulateRun(state)).toEqual(simulateRun(state));
  });

  it('changes output across different seeds', () => {
    const a = simulateRun(buildState({ seed: 100 }));
    const b = simulateRun(buildState({ seed: 101 }));

    expect(a).not.toEqual(b);
    expect(a.cid).not.toBe(b.cid);
  });

  it('fails when treasury is depleted', () => {
    const result = simulateRun(buildState({ treasury: 20 }));

    expect(result.passed).toBe(false);
    expect(result.diagnostics.runwayAfterRun).toBeLessThan(0);
    expect(result.diagnostics.scoreBreakdown.budgetPenalty).toBeGreaterThan(0);
  });

  it('returns engine diagnostics and a pseudo CID', () => {
    const result = simulateRun(buildState());

    expect(result.cid.startsWith('bafy')).toBe(true);
    expect(result.events.length).toBeGreaterThan(0);
    expect(result.diagnostics.costBreakdown.total).toBe(result.cost);
    expect(result.diagnostics.scoreBreakdown.total).toBe(result.qualityScore);
  });

  it('returns pipeline stages in canonical execution order', () => {
    const result = simulateRun(buildState());

    expect(result.pipeline?.order).toEqual([
      'design',
      'implementation',
      'review',
      'deployment'
    ]);
    expect(result.pipeline?.stages.map((stage) => stage.id)).toEqual(result.pipeline?.order);
    expect(result.pipeline?.coveredStageCount).toBe(4);
    expect(result.diagnostics.totalStageCount).toBe(4);
  });

  it('marks missing stages as blocked when the line is under-configured', () => {
    const result = simulateRun(
      buildState({
        roles: [
          {
            id: 'role-02',
            name: 'Frontend Architect',
            assignedAgentId: 'agent-02',
            pipelineStageId: 'implementation'
          }
        ]
      })
    );

    expect(result.pipeline?.coveredStageCount).toBe(1);
    expect(result.pipeline?.missingStageCount).toBe(3);
    expect(result.pipeline?.stages.find((stage) => stage.id === 'design')?.status).toBe('blocked');
    expect(result.pipeline?.stages.find((stage) => stage.id === 'review')?.status).toBe('blocked');
    expect(result.pipeline?.stages.find((stage) => stage.id === 'deployment')?.status).toBe(
      'blocked'
    );
  });
});
