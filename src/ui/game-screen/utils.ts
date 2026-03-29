import { getScene, type StoryApp, type StoryScene } from '../../levels/story';
import type { RunResult } from '../../types';
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

export function formatUsdc(value: number): string {
  return `${(Math.max(0, value) / 100).toFixed(2)} USDC`;
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

export function getLatestReachedSceneForApp(sceneIndex: number, app: StoryApp): StoryScene | undefined {
  for (let index = sceneIndex; index >= 0; index -= 1) {
    const scene = getScene(index);

    if (scene.app === app) {
      return scene;
    }
  }

  return undefined;
}
