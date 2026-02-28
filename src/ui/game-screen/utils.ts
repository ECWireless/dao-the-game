import type { StoryApp } from '../../levels/story';
import type { Agent, HatRole, RunResult } from '../../types';
import { APP_INTRO_SCENE_INDEX, APP_ORDER } from './constants';
import type { RunSummary } from './types';

export function getUnlockedApps(sceneIndex: number): StoryApp[] {
  return APP_ORDER.filter((app) => sceneIndex >= APP_INTRO_SCENE_INDEX[app]);
}

export function getAppLaunchOrigin(targetApp: StoryApp, availableApps: StoryApp[]): number {
  const launchApps = availableApps.length > 0 ? availableApps : APP_ORDER;
  const index = launchApps.indexOf(targetApp);
  const normalizedIndex = index < 0 ? 0 : index;
  return ((normalizedIndex + 0.5) / launchApps.length) * 100;
}

export function formatCredits(value: number): string {
  return `${Math.max(0, Math.round(value))} cr`;
}

export function formatRoleAssignment(role: HatRole, agent?: Agent): string {
  if (!agent) {
    return `${role.name}: awaiting hire`;
  }

  return `${role.name}: ${agent.roleAffinity} (${agent.id})`;
}

export function getRunSummary(result?: RunResult): RunSummary | undefined {
  if (!result) {
    return undefined;
  }

  return {
    passed: result.passed,
    qualityScore: result.qualityScore,
    cost: result.cost,
    events: result.events
  };
}
