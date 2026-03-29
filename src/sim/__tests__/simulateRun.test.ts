import { describe, expect, it } from 'vitest';
import type { Brief, HatRole, RunState } from '../../types';
import { generateStartingWorkers } from '../generateStartingWorkers';
import { inferPipelineStageId } from '../../pipeline';
import { simulateRun } from '../simulateRun';

const brief: Brief = {
  id: 'brief-conf-01',
  artifactType: 'conference-site',
  clientName: 'Meta Summit',
  mission: 'Rebuild a failing conference brand website.',
  requirements: ['Autonomous execution'],
  baseScore: 58,
  passThreshold: 72
};

const fullRoles: HatRole[] = [
  {
    id: 'role-01',
    name: 'Mission Coordinator',
    assignedWorkerId: 'worker-03',
    pipelineStageId: 'design'
  },
  {
    id: 'role-02',
    name: 'Frontend Architect',
    assignedWorkerId: 'worker-01',
    pipelineStageId: 'implementation'
  },
  {
    id: 'role-03',
    name: 'Quality Relay',
    assignedWorkerId: 'worker-05',
    pipelineStageId: 'review'
  },
  {
    id: 'role-04',
    name: 'Deployment Operator',
    assignedWorkerId: 'worker-06',
    pipelineStageId: 'deployment'
  }
];

function buildState(overrides: Partial<RunState> = {}): RunState {
  return {
    seed: 777,
    treasury: 420,
    brief,
    roles: fullRoles,
    workers: generateStartingWorkers(777),
    ...overrides
  };
}

function buildRoles(
  assignedWorkerIds: readonly [string, string, string, string]
): HatRole[] {
  return [
    {
      id: 'role-01',
      name: 'Mission Coordinator',
      assignedWorkerId: assignedWorkerIds[0],
      pipelineStageId: 'design'
    },
    {
      id: 'role-02',
      name: 'Frontend Architect',
      assignedWorkerId: assignedWorkerIds[1],
      pipelineStageId: 'implementation'
    },
    {
      id: 'role-03',
      name: 'Quality Relay',
      assignedWorkerId: assignedWorkerIds[2],
      pipelineStageId: 'review'
    },
    {
      id: 'role-04',
      name: 'Deployment Operator',
      assignedWorkerId: assignedWorkerIds[3],
      pipelineStageId: 'deployment'
    }
  ];
}

describe('simulateRun', () => {
  it('ignores invalid persisted pipeline stage ids and falls back to role inference', () => {
    expect(
      inferPipelineStageId({
        id: 'hat-04',
        name: 'Deployment Worker',
        pipelineStageId: 'totally-invalid' as never
      })
    ).toBe('deployment');
  });

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
            assignedWorkerId: 'worker-02',
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

  it('fails when multiple roles claim the same pipeline stage', () => {
    const result = simulateRun(
      buildState({
        roles: [
          {
            id: 'role-01',
            name: 'Mission Coordinator',
            assignedWorkerId: 'worker-03',
            pipelineStageId: 'design'
          },
          {
            id: 'role-01b',
            name: 'Brand Strategist',
            assignedWorkerId: 'worker-04',
            pipelineStageId: 'design'
          },
          {
            id: 'role-02',
            name: 'Frontend Architect',
            assignedWorkerId: 'worker-01',
            pipelineStageId: 'implementation'
          },
          {
            id: 'role-03',
            name: 'Quality Relay',
            assignedWorkerId: 'worker-05',
            pipelineStageId: 'review'
          },
          {
            id: 'role-04',
            name: 'Deployment Operator',
            assignedWorkerId: 'worker-06',
            pipelineStageId: 'deployment'
          }
        ]
      })
    );

    expect(result.passed).toBe(false);
    expect(result.diagnostics.duplicateStageIds).toEqual(['design']);
    expect(result.events[result.events.length - 1]).toContain('duplicate stage ownership');
  });

  it('treats uncovered blocked stages as weaker than covered blocked stages', () => {
    const result = simulateRun(
      buildState({
        roles: [
          {
            id: 'role-02',
            name: 'Frontend Architect',
            assignedWorkerId: 'worker-low',
            pipelineStageId: 'implementation'
          }
        ],
        workers: [
          {
            id: 'worker-low',
            registryRecordId: 'fixture-worker-low',
            name: 'Worker Low',
            handle: 'worker-low',
            roleTag: 'frontend-engineer',
            specialty: 'Frontend Engineer',
            roleAffinity: 'Frontend Builder',
            shortPitch: 'I can take the build, but this fixture is deliberately underpowered.',
            capabilityVector: {
              design: 0,
              implementation: 0,
              review: 0,
              deployment: 0
            },
            styleProfile: {
              signature: 'Unformed and inconsistent.',
              execution: 'Struggles to complete basic work.',
              collaboration: 'Creates drag across the line.'
            },
            temperament: {
              profile: 'Frayed under pressure',
              pace: 0,
              resilience: 0,
              teamwork: 0
            },
            traits: ['Unreliable'],
            bio: 'A deliberately weak fixture for blocked-stage regression tests.',
            accent: '#222222',
            shadow: '#111111',
            manifest: {
              specVersion: 'dao-the-game.worker.v1',
              identity: {
                name: 'Worker Low',
                handle: 'worker-low',
                roleTag: 'frontend-engineer',
                bio: 'A deliberately weak fixture for blocked-stage regression tests.',
                shortPitch: 'I can take the build, but this fixture is deliberately underpowered.'
              },
              execution: {
                publicEndpoint: 'https://daothegame.com/workers/fixtures/worker-low'
              },
              pricing: {
                asset: 'USDC',
                amount: '0.01',
                chargeModel: 'per_request_attempt'
              }
            },
            registration: {
              status: 'registered'
            },
            availability: 'active',
            presentation: {
              accent: '#222222',
              shadow: '#111111'
            },
            gameplay: {
              roleAffinity: 'Frontend Builder',
              capabilityVector: {
                design: 0,
                implementation: 0,
                review: 0,
                deployment: 0
              },
              styleProfile: {
                signature: 'Unformed and inconsistent.',
                execution: 'Struggles to complete basic work.',
                collaboration: 'Creates drag across the line.'
              },
              temperament: {
                profile: 'Frayed under pressure',
                pace: 0,
                resilience: 0,
                teamwork: 0
              },
              traits: ['Unreliable']
            }
          }
        ]
      })
    );

    expect(result.pipeline?.stages.find((stage) => stage.id === 'implementation')?.status).toBe(
      'blocked'
    );
    expect(result.pipeline?.weakestStageId).not.toBe('implementation');
    expect(
      result.pipeline?.stages.find((stage) => stage.id === result.pipeline?.weakestStageId)
        ?.assignedWorkerId
    ).toBeUndefined();
  });

  it('produces meaningfully different deployment profiles for different lineups', () => {
    const stableRun = simulateRun(
      buildState({
        roles: buildRoles(['worker-03', 'worker-02', 'worker-05', 'worker-06'])
      })
    );
    const flashyRun = simulateRun(
      buildState({
        roles: buildRoles(['worker-04', 'worker-01', 'worker-03', 'worker-05'])
      })
    );
    expect(stableRun.evaluation?.profileTag).toBe('premium');
    expect(flashyRun.evaluation?.profileTag).toBe('stable');
    expect(stableRun.evaluation?.strongestMetricId).toBe('launchStability');
    expect(stableRun.evaluation?.metrics.launchStability).toBeGreaterThan(
      flashyRun.evaluation?.metrics.launchStability ?? 0
    );
    expect(stableRun.evaluation?.metrics.trust).toBeGreaterThan(
      flashyRun.evaluation?.metrics.trust ?? 0
    );
  });
});
