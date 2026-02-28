import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getScene, type StoryApp } from '../levels/story';
import {
  countAssignedRoles,
  estimateRunCost,
  estimateRunwayAfterRun,
  getActiveRoles,
  useGameStore
} from '../state/gameStore';
import { APP_META } from './game-screen/constants';
import { AppDock } from './game-screen/components/AppDock';
import { StatusBar } from './game-screen/components/StatusBar';
import { renderSceneContent } from './game-screen/sceneContent';
import { DormantAppPanel } from './game-screen/scenes/OperationsScenes';
import type { AppSwitchPhase } from './game-screen/types';
import { getAppLaunchOrigin, getRunSummary, getUnlockedApps, formatCredits } from './game-screen/utils';
import './game-screen.css';

export default function GameScreen() {
  const storySceneIndex = useGameStore((state) => state.storySceneIndex);
  const unlockedRoleCount = useGameStore((state) => state.unlockedRoleCount);
  const treasury = useGameStore((state) => state.treasury);
  const roles = useGameStore((state) => state.roles);
  const agents = useGameStore((state) => state.agents);
  const assignmentLog = useGameStore((state) => state.assignmentLog);
  const runCount = useGameStore((state) => state.runCount);
  const latestRun = useGameStore((state) => state.latestRun);

  const advanceStory = useGameStore((state) => state.advanceStory);
  const retreatStory = useGameStore((state) => state.retreatStory);
  const unlockExpandedRoles = useGameStore((state) => state.unlockExpandedRoles);
  const assignRole = useGameStore((state) => state.assignRole);
  const runProduction = useGameStore((state) => state.runProduction);
  const resetTutorial = useGameStore((state) => state.resetTutorial);

  const scene = getScene(storySceneIndex);
  const unlockedApps = useMemo(() => getUnlockedApps(storySceneIndex), [storySceneIndex]);
  const previousUnlockedAppsRef = useRef<StoryApp[]>(unlockedApps);

  const [currentApp, setCurrentApp] = useState<StoryApp>(scene.app);
  const [pendingApp, setPendingApp] = useState<StoryApp | null>(null);
  const [switchPhase, setSwitchPhase] = useState<AppSwitchPhase>('idle');
  const [launchOriginX, setLaunchOriginX] = useState<number>(getAppLaunchOrigin(scene.app, unlockedApps));
  const [pulseApp, setPulseApp] = useState<StoryApp | null>(null);
  const [installingApp, setInstallingApp] = useState<StoryApp | null>(null);
  const [isMachineLocked, setIsMachineLocked] = useState(false);

  const activeRoles = getActiveRoles(roles, unlockedRoleCount);
  const assignedActiveRoles = countAssignedRoles(activeRoles);
  const runEstimate = estimateRunCost(activeRoles, agents);
  const runwayAfterRun = estimateRunwayAfterRun(treasury, activeRoles, agents);
  const latestRunSummary = getRunSummary(latestRun);
  const canSwitchApps = !isMachineLocked;

  const requestAppSwitch = useCallback(
    (targetApp: StoryApp) => {
      if (!canSwitchApps || targetApp === currentApp || switchPhase !== 'idle') {
        return;
      }

      setLaunchOriginX(getAppLaunchOrigin(targetApp, unlockedApps));
      setPulseApp(targetApp);
      setPendingApp(targetApp);
      setSwitchPhase('out');
    },
    [canSwitchApps, currentApp, switchPhase, unlockedApps]
  );

  useEffect(() => {
    const previousUnlockedApps = previousUnlockedAppsRef.current;
    const newlyUnlockedApp = unlockedApps.find((app) => !previousUnlockedApps.includes(app));
    previousUnlockedAppsRef.current = unlockedApps;

    if (!newlyUnlockedApp) {
      if (unlockedApps.length < previousUnlockedApps.length) {
        setInstallingApp(null);
      }
      return;
    }

    setInstallingApp(newlyUnlockedApp);

    const timer = window.setTimeout(() => {
      setInstallingApp((current) => (current === newlyUnlockedApp ? null : current));
    }, 1900);

    return () => {
      window.clearTimeout(timer);
    };
  }, [unlockedApps]);

  useEffect(() => {
    if (unlockedApps.includes(currentApp)) {
      return;
    }

    const fallbackApp = unlockedApps[unlockedApps.length - 1] ?? scene.app;
    setCurrentApp(fallbackApp);
    setPendingApp(null);
    setSwitchPhase('idle');
    setPulseApp(null);
    setLaunchOriginX(getAppLaunchOrigin(fallbackApp, unlockedApps));
  }, [currentApp, scene.app, unlockedApps]);

  useEffect(() => {
    if (switchPhase !== 'out' || !pendingApp) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCurrentApp(pendingApp);
      setSwitchPhase('in');
    }, 180);

    return () => {
      window.clearTimeout(timer);
    };
  }, [pendingApp, switchPhase]);

  useEffect(() => {
    if (switchPhase !== 'in') {
      return;
    }

    const timer = window.setTimeout(() => {
      setSwitchPhase('idle');
      setPendingApp(null);
      setPulseApp(null);
    }, 220);

    return () => {
      window.clearTimeout(timer);
    };
  }, [switchPhase]);

  const frameStyle = {
    '--launch-origin-x': `${launchOriginX}%`
  } as CSSProperties;

  const sceneContent = renderSceneContent({
    sceneId: scene.id,
    activeRoles,
    agents,
    assignmentLog,
    assignedActiveRoles,
    latestRunSummary,
    runCount,
    runwayAfterRun,
    advanceStory,
    unlockExpandedRoles,
    assignRole,
    runProduction,
    resetTutorial,
    setIsMachineLocked
  });

  const appContent =
    currentApp === scene.app ? (
      sceneContent
    ) : (
      <DormantAppPanel
        app={currentApp}
        targetApp={scene.app}
        onReturn={() => requestAppSwitch(scene.app)}
        activeRoles={activeRoles}
        assignedRoles={assignedActiveRoles}
        runCount={runCount}
        latestRun={latestRun}
      />
    );

  return (
    <main className="game-root">
      <section className="phone-shell">
        <div className="phone-screen">
          <div className="phone-notch" aria-hidden="true" />
          <div className="wallpaper-grid" aria-hidden="true" />

          <StatusBar sceneIndex={storySceneIndex} treasury={treasury} />

          <section className="app-header">
            <div className="app-header-bar">
              <button
                className="nav-back"
                type="button"
                onClick={retreatStory}
                disabled={storySceneIndex === 0 || !canSwitchApps || switchPhase !== 'idle'}
                aria-label="Go to previous beat"
              >
                <span className="nav-chevron" aria-hidden="true">
                  ‹
                </span>
                <span>Back</span>
              </button>

              <div className="app-heading">
                <p className="app-title">{APP_META[currentApp].label}</p>
                <p className="app-subtitle">{scene.app === currentApp ? scene.subtitle : 'Background app'}</p>
              </div>
            </div>
          </section>

          <section className="app-viewport">
            <article
              key={`${currentApp}-${scene.id}`}
              className={`app-frame phase-${switchPhase}`}
              style={frameStyle}
              aria-live="polite"
            >
              {appContent}
            </article>
          </section>

          <footer className="app-bottom">
            <div className="bottom-metric">
              <p className="eyebrow">Contract</p>
              <p>
                Roles {assignedActiveRoles}/{activeRoles.length} | est {formatCredits(runEstimate)} | runway{' '}
                {formatCredits(runwayAfterRun)}
              </p>
            </div>

            <AppDock
              availableApps={unlockedApps}
              currentApp={currentApp}
              targetApp={scene.app}
              pulseApp={pulseApp}
              installingApp={installingApp}
              onOpen={requestAppSwitch}
              disabled={!canSwitchApps || switchPhase !== 'idle'}
            />
          </footer>
        </div>
      </section>
    </main>
  );
}
