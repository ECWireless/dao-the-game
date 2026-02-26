import type { RunResult } from '../types';
import type { ViewMode } from './viewMode';

export type RunStatus = 'stable' | 'risk' | 'fail';

export type ShellRunView = {
  qualityScore: number;
  cost: number;
  events: string[];
  passed: boolean;
  status: RunStatus;
};

export type EngineRunView = ShellRunView & {
  cid: string;
  seed: number;
  diagnostics: RunResult['diagnostics'];
};

function deriveStatus(result: RunResult): RunStatus {
  if (!result.passed) {
    return 'fail';
  }

  if (result.qualityScore >= 80) {
    return 'stable';
  }

  return 'risk';
}

export function selectRunView(result: RunResult, mode: ViewMode): ShellRunView | EngineRunView {
  const shellView: ShellRunView = {
    qualityScore: result.qualityScore,
    cost: result.cost,
    events: result.events,
    passed: result.passed,
    status: deriveStatus(result)
  };

  if (mode === 'shell') {
    return shellView;
  }

  return {
    ...shellView,
    cid: result.cid,
    seed: result.diagnostics.seed,
    diagnostics: result.diagnostics
  };
}
