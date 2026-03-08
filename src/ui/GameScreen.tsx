import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getScene, type StoryApp } from '../levels/story';
import { countAssignedRoles, estimateRunwayAfterRun, getActiveRoles, useGameStore } from '../state/gameStore';
import { APP_META } from './game-screen/constants';
import { AppDock } from './game-screen/components/AppDock';
import { IntroDialog } from './game-screen/components/IntroDialog';
import { getCrossAppHandoff } from './game-screen/handoffs';
import { NotificationBanner, type MessageNotification } from './game-screen/scenes/CommunicationScenes';
import { MailInboxScene } from './game-screen/scenes/MailScenes';
import { StatusBar } from './game-screen/components/StatusBar';
import { renderSceneContent } from './game-screen/sceneContent';
import { DormantAppPanel } from './game-screen/scenes/OperationsScenes';
import type { AppSwitchPhase } from './game-screen/types';
import { getAppLaunchOrigin, getLatestReachedSceneForApp, getUnlockedApps } from './game-screen/utils';
import './game-screen.css';

export default function GameScreen() {
  const storySceneIndex = useGameStore((state) => state.storySceneIndex);
  const unlockedRoleCount = useGameStore((state) => state.unlockedRoleCount);
  const treasury = useGameStore((state) => state.treasury);
  const studioName = useGameStore((state) => state.studioName);
  const hasSeenIntroDialog = useGameStore((state) => state.hasSeenIntroDialog);
  const roles = useGameStore((state) => state.roles);
  const agents = useGameStore((state) => state.agents);
  const assignmentLog = useGameStore((state) => state.assignmentLog);
  const runCount = useGameStore((state) => state.runCount);
  const latestRun = useGameStore((state) => state.latestRun);
  const latestArtifacts = useGameStore((state) => state.latestArtifacts);

  const advanceStory = useGameStore((state) => state.advanceStory);
  const retreatStory = useGameStore((state) => state.retreatStory);
  const setStudioName = useGameStore((state) => state.setStudioName);
  const dismissIntroDialog = useGameStore((state) => state.dismissIntroDialog);
  const configureRole = useGameStore((state) => state.configureRole);
  const unlockExpandedRoles = useGameStore((state) => state.unlockExpandedRoles);
  const assignRole = useGameStore((state) => state.assignRole);
  const runProduction = useGameStore((state) => state.runProduction);
  const resetTutorial = useGameStore((state) => state.resetTutorial);

  const scene = getScene(storySceneIndex);
  const nextScene = getScene(storySceneIndex + 1);
  const nextHandoff = getCrossAppHandoff(nextScene.id);
  const unlockedApps = useMemo(() => getUnlockedApps(storySceneIndex), [storySceneIndex]);
  const previousUnlockedAppsRef = useRef<StoryApp[]>(storySceneIndex === 0 && unlockedApps.includes('mail') ? unlockedApps.filter((app) => app !== 'mail') : unlockedApps);
  const resetTapRef = useRef<{ count: number; timerId: number | null }>({ count: 0, timerId: null });

  const [currentApp, setCurrentApp] = useState<StoryApp>(scene.app);
  const [pendingApp, setPendingApp] = useState<StoryApp | null>(null);
  const [switchPhase, setSwitchPhase] = useState<AppSwitchPhase>('idle');
  const [launchOriginX, setLaunchOriginX] = useState<number>(getAppLaunchOrigin(scene.app, unlockedApps));
  const [pulseApp, setPulseApp] = useState<StoryApp | null>(null);
  const [installingApp, setInstallingApp] = useState<StoryApp | null>(null);
  const [isMachineLocked, setIsMachineLocked] = useState(false);
  const [isEmailNotificationVisible, setIsEmailNotificationVisible] = useState(false);
  const [pendingHandoffSceneId, setPendingHandoffSceneId] = useState<string | null>(null);

  const activeRoles = getActiveRoles(roles, unlockedRoleCount);
  const assignedActiveRoles = countAssignedRoles(activeRoles);
  const runwayAfterRun = estimateRunwayAfterRun(treasury, activeRoles, agents);
  const showIntroDialog = storySceneIndex === 0 && !hasSeenIntroDialog;
  const canSwitchApps = !isMachineLocked && !showIntroDialog;

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

  const clearResetTapState = useCallback(() => {
    if (resetTapRef.current.timerId !== null) window.clearTimeout(resetTapRef.current.timerId);
    resetTapRef.current = { count: 0, timerId: null };
  }, []);

  const handleHiddenReset = useCallback(() => {
    const resetApps = getUnlockedApps(0);
    clearResetTapState();
    resetTutorial();
    setCurrentApp('messages');
    setPendingApp(null);
    setSwitchPhase('idle');
    setPulseApp(null);
    setInstallingApp(resetApps.includes('mail') ? 'mail' : null);
    setIsMachineLocked(false);
    setIsEmailNotificationVisible(false);
    setPendingHandoffSceneId(null);
    setLaunchOriginX(getAppLaunchOrigin('messages', resetApps));
    previousUnlockedAppsRef.current = resetApps;
  }, [clearResetTapState, resetTutorial]);

  const handleDockOpen = useCallback(
    (targetApp: StoryApp) => {
      if (targetApp === 'messages') {
        const nextCount = resetTapRef.current.count + 1;
        if (resetTapRef.current.timerId !== null) window.clearTimeout(resetTapRef.current.timerId);

        if (nextCount >= 3) {
          clearResetTapState();
          if (window.confirm('Confirm demo reset?')) handleHiddenReset();
          return;
        }

        resetTapRef.current = {
          count: nextCount,
          timerId: window.setTimeout(() => {
            resetTapRef.current = { count: 0, timerId: null };
          }, 1200)
        };
      } else {
        clearResetTapState();
      }

      requestAppSwitch(targetApp);
    },
    [clearResetTapState, handleHiddenReset, requestAppSwitch]
  );

  const advanceStoryAndOpenApp = useCallback((targetApp: StoryApp) => {
    advanceStory();
    requestAppSwitch(targetApp);
  }, [advanceStory, requestAppSwitch]);

  useEffect(() => {
    if (showIntroDialog) {
      return;
    }

    const previousUnlockedApps = previousUnlockedAppsRef.current;
    const newlyUnlockedApp = unlockedApps.find((app) => !previousUnlockedApps.includes(app));
    previousUnlockedAppsRef.current = unlockedApps;

    if (!newlyUnlockedApp) {
      if (unlockedApps.length < previousUnlockedApps.length) setInstallingApp(null);
      return;
    }

    setInstallingApp(newlyUnlockedApp);
  }, [showIntroDialog, unlockedApps]);

  useEffect(() => {
    if (showIntroDialog || !installingApp) {
      return;
    }

    const timer = window.setTimeout(() => setInstallingApp((current) => (current === installingApp ? null : current)), 1900);
    return () => window.clearTimeout(timer);
  }, [installingApp, showIntroDialog]);

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
    return () => window.clearTimeout(timer);
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
    return () => window.clearTimeout(timer);
  }, [switchPhase]);

  useEffect(() => () => clearResetTapState(), [clearResetTapState]);

  useEffect(() => {
    if (storySceneIndex === 0) {
      setIsEmailNotificationVisible(false);
      setPendingHandoffSceneId(null);
    }
  }, [storySceneIndex]);

  const frameStyle = { '--launch-origin-x': `${launchOriginX}%` } as CSSProperties;

  const handleMailNotificationOpen = useCallback(() => {
    setIsEmailNotificationVisible(false);
    advanceStoryAndOpenApp('mail');
  }, [advanceStoryAndOpenApp]);
  const queueCrossAppAdvance = useCallback(() => {
    if (nextHandoff) setPendingHandoffSceneId(nextScene.id);
    advanceStory();
  }, [advanceStory, nextHandoff, nextScene.id]);
  const pendingHandoff = pendingHandoffSceneId ? getCrossAppHandoff(pendingHandoffSceneId) : undefined;
  const handleHandoffNotificationOpen = useCallback(() => {
    if (!pendingHandoff) return;
    setPendingHandoffSceneId(null);
    requestAppSwitch(pendingHandoff.targetApp);
  }, [pendingHandoff, requestAppSwitch]);

  const hasEmailNotification = scene.id === 'messages-notification';
  const activePhoneNotification: MessageNotification | null = showIntroDialog
    ? null
    : pendingHandoff
      ? {
          appName: pendingHandoff.appName,
          title: pendingHandoff.title,
          preview: pendingHandoff.preview,
          icon: pendingHandoff.icon,
          onOpen: handleHandoffNotificationOpen
        }
      : hasEmailNotification && isEmailNotificationVisible
        ? {
            appName: 'Mail',
            title: 'URGENT: Full rebrand needed in 48 hours',
            preview: 'Lina, Event Director',
            icon: 'mail',
            onOpen: handleMailNotificationOpen
          }
        : null;
  const mailInboxStoryItem = hasEmailNotification
    ? {
        sender: 'Lina, Event Director',
        subject: 'URGENT: Full rebrand needed in 48 hours',
        preview: 'Our conference brand is collapsing and our website is unusable.',
        timestamp: 'now',
        onOpen: handleMailNotificationOpen
      }
    : undefined;
  const dockTargetApp = pendingHandoff?.targetApp ?? (hasEmailNotification && isEmailNotificationVisible ? 'mail' : scene.app);

  useEffect(() => {
    if (!hasEmailNotification) {
      setIsEmailNotificationVisible(false);
      return;
    }
    setIsEmailNotificationVisible(false);
    const timer = window.setTimeout(() => setIsEmailNotificationVisible(true), 3000);
    return () => window.clearTimeout(timer);
  }, [hasEmailNotification]);

  useEffect(() => {
    if (showIntroDialog) {
      return;
    }

    if (pendingHandoffSceneId) {
      return;
    }

    let autoAdvanceDelayMs: number | null = null;

    if (currentApp === 'messages') {
      autoAdvanceDelayMs =
        scene.id === 'messages-board-drop'
          ? 1700
          : scene.id === 'messages-guild-open'
            ? 2500
            : scene.id === 'messages-pivot-fix'
              ? 2900
              : null;
    } else if (currentApp === 'mail') {
      autoAdvanceDelayMs = scene.id === 'mail-offer' || scene.id === 'mail-fail' ? 3600 : null;
    }

    if (autoAdvanceDelayMs === null) {
      return;
    }

    const timer = window.setTimeout(() => queueCrossAppAdvance(), autoAdvanceDelayMs);
    return () => window.clearTimeout(timer);
  }, [currentApp, pendingHandoffSceneId, queueCrossAppAdvance, scene.id, showIntroDialog]);

  useEffect(() => {
    if (pendingHandoffSceneId && (pendingHandoffSceneId !== scene.id || currentApp === scene.app)) {
      setPendingHandoffSceneId(null);
    }
  }, [currentApp, pendingHandoffSceneId, scene.app, scene.id]);

  const displayedScene = currentApp === scene.app ? scene : getLatestReachedSceneForApp(storySceneIndex, currentApp);
  const isSceneInteractive = currentApp === scene.app;
  const sceneContent = displayedScene
    ? renderSceneContent({
        sceneId: displayedScene.id,
        isInteractive: isSceneInteractive,
        studioName,
        activeRoles,
        agents,
        assignmentLog,
        assignedActiveRoles,
        latestRun,
        latestArtifacts,
        runCount,
        runwayAfterRun,
        advanceStory,
        queueCrossAppAdvance,
        setStudioName,
        configureRole,
        unlockExpandedRoles,
        assignRole,
        runProduction,
        resetTutorial,
        setIsMachineLocked
      })
    : null;
  const appContent = showIntroDialog
    ? <div className="intro-app-placeholder" aria-hidden="true" />
    : sceneContent
      ? sceneContent
      : currentApp === 'mail'
        ? <MailInboxScene storyItem={mailInboxStoryItem} />
        : <DormantAppPanel app={currentApp} targetApp={scene.app} onReturn={() => requestAppSwitch(scene.app)} activeRoles={activeRoles} assignedRoles={assignedActiveRoles} runCount={runCount} latestRun={latestRun} />;
  return (
    <main className="game-root">
      <section className="phone-shell">
        <div className="phone-screen">
          <div className="phone-notch" aria-hidden="true" />
          <div className="wallpaper-grid" aria-hidden="true" />

          <StatusBar sceneIndex={storySceneIndex} treasury={treasury} />

          {activePhoneNotification ? (
            <div className="phone-notification-tray">
              <NotificationBanner notification={activePhoneNotification} />
            </div>
          ) : null}

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
              </div>
            </div>
          </section>

          <section className="app-viewport">
            <article
              key={currentApp}
              className={`app-frame phase-${switchPhase}`}
              style={frameStyle}
              aria-live="polite"
            >
              {appContent}
            </article>
          </section>

          <footer className="app-bottom">
            <AppDock
              availableApps={unlockedApps}
              currentApp={currentApp}
              targetApp={dockTargetApp}
              pulseApp={pulseApp}
              installingApp={installingApp}
              onOpen={handleDockOpen}
              disabled={!canSwitchApps || switchPhase !== 'idle'}
            />
          </footer>

          {showIntroDialog ? <IntroDialog onStart={dismissIntroDialog} /> : null}
        </div>
      </section>
    </main>
  );
}
