import { describe, expect, it } from 'vitest';
import type { RunResult } from '../../types';
import { selectRunView } from '../selectors';

const runResult: RunResult = {
  qualityScore: 78,
  cost: 140,
  events: ['Clean execution window (+5 quality)'],
  cid: 'bafytestexamplecid123456789',
  passed: true,
  diagnostics: {
    seed: 111,
    variance: 4,
    passThreshold: 72,
    runwayAfterRun: 280,
    assignedRoleCount: 4,
    totalRoleCount: 4,
    costBreakdown: {
      base: 44,
      agents: 96,
      events: 0,
      total: 140
    },
    scoreBreakdown: {
      base: 58,
      creativityInfluence: 10,
      speedInfluence: 4,
      reliabilityPenalty: 3,
      roleCoverageBonus: 14,
      eventModifier: 5,
      budgetPenalty: 0,
      total: 78
    }
  }
};

describe('selectRunView', () => {
  it('hides internals in shell mode', () => {
    const shell = selectRunView(runResult, 'shell');

    expect(shell).toEqual({
      qualityScore: 78,
      cost: 140,
      events: ['Clean execution window (+5 quality)'],
      passed: true,
      status: 'risk'
    });
    expect('cid' in shell).toBe(false);
  });

  it('reveals internals in engine mode', () => {
    const engine = selectRunView(runResult, 'engine');

    expect('cid' in engine).toBe(true);

    if ('cid' in engine) {
      expect(engine.cid).toBe(runResult.cid);
      expect(engine.seed).toBe(111);
      expect(engine.diagnostics.scoreBreakdown.base).toBe(58);
    }
  });
});
