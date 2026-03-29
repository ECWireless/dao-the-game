import { describe, expect, it } from 'vitest';
import type { HatRole, RunResult, RunState } from '../../types';
import { TUTORIAL_BRIEF } from '../../levels/tutorial';
import { generateArtifacts } from '../generateArtifacts';
import { generateStartingWorkers } from '../generateStartingWorkers';
import { simulateRun } from '../simulateRun';

const roles: HatRole[] = [
  {
    id: 'hat-01',
    name: 'Frontend Engineer',
    assignedWorkerId: 'worker-01',
    pipelineStageId: 'implementation',
    isConfigured: true
  },
  {
    id: 'hat-02',
    name: 'Designer Worker',
    assignedWorkerId: 'worker-03',
    pipelineStageId: 'design',
    isConfigured: true
  },
  {
    id: 'hat-03',
    name: 'Reviewer Worker',
    assignedWorkerId: 'worker-05',
    pipelineStageId: 'review',
    isConfigured: true
  },
  {
    id: 'hat-04',
    name: 'Deployment Worker',
    assignedWorkerId: 'worker-06',
    pipelineStageId: 'deployment',
    isConfigured: true
  }
];

function buildState(overrides: Partial<RunState> = {}): RunState {
  return {
    seed: 424242,
    treasury: 540,
    brief: TUTORIAL_BRIEF,
    roles,
    workers: generateStartingWorkers(424242),
    ...overrides
  };
}

describe('generateArtifacts', () => {
  it('builds a generated conference site with crew provenance', () => {
    const run = simulateRun(buildState());
    const artifacts = generateArtifacts({
      result: run,
      brief: TUTORIAL_BRIEF,
      cycle: 2,
      studioName: 'Coopa LLC',
      roles,
      workers: buildState().workers
    });

    expect(artifacts.artifactType).toBe('conference-site');
    expect(artifacts.ensName).toBe('coopa-llc.daothegame.eth');
    expect(artifacts.siteDocument).toContain('Regen Frontier Global Conference');
    expect(artifacts.siteDocument).toContain('March 2027');
    expect(artifacts.siteDocument).toContain('Denver, Colorado');
    expect(artifacts.siteDocument).toContain('Operator control rooms');
    expect(artifacts.provenance.contributors.length).toBeGreaterThan(0);
  });

  it('keeps failure-side artifacts on the rough side when a run is forced down', () => {
    const baseRun = simulateRun(buildState());
    const failedRun: RunResult = {
      ...baseRun,
      passed: false
    };

    const artifacts = generateArtifacts({
      result: failedRun,
      brief: TUTORIAL_BRIEF,
      cycle: 1,
      studioName: 'Ghost Studio',
      roles,
      workers: buildState().workers
    });

    expect(['messy', 'failed']).toContain(artifacts.profileTag);
  });

  it('upgrades success-side artifacts away from failed when the run passes', () => {
    const baseRun = simulateRun(buildState());
    const successfulRun: RunResult = {
      ...baseRun,
      passed: true,
      evaluation: baseRun.evaluation
        ? {
            ...baseRun.evaluation,
            profileTag: 'failed'
          }
        : undefined
    };

    const artifacts = generateArtifacts({
      result: successfulRun,
      brief: TUTORIAL_BRIEF,
      cycle: 2,
      studioName: 'Ghost Studio',
      roles,
      workers: buildState().workers
    });

    expect(artifacts.profileTag).toBe('stable');
  });

  it('materially changes the generated conference site when a different lead worker assembles it', () => {
    const lineupState = buildState({
      roles: [
        {
          id: 'hat-01',
          name: 'Frontend Engineer',
          assignedWorkerId: 'worker-01',
          pipelineStageId: 'implementation',
          isConfigured: true
        }
      ]
    });
    const altLineupState = buildState({
      roles: [
        {
          id: 'hat-01',
          name: 'Frontend Engineer',
          assignedWorkerId: 'worker-02',
          pipelineStageId: 'implementation',
          isConfigured: true
        }
      ]
    });

    const runeArtifacts = generateArtifacts({
      result: simulateRun(lineupState),
      brief: TUTORIAL_BRIEF,
      cycle: 1,
      studioName: 'Ghost Studio',
      roles: lineupState.roles,
      workers: lineupState.workers
    });
    const dorianArtifacts = generateArtifacts({
      result: simulateRun(altLineupState),
      brief: TUTORIAL_BRIEF,
      cycle: 1,
      studioName: 'Ghost Studio',
      roles: altLineupState.roles,
      workers: altLineupState.workers
    });

    expect(runeArtifacts.siteDocument).toContain('Clarity as a coordination primitive');
    expect(dorianArtifacts.siteDocument).toContain('Operating systems for autonomous organizations');
    expect(runeArtifacts.siteDocument).not.toBe(dorianArtifacts.siteDocument);
  });
});
