import type { CSSProperties, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { OrgTreeRecord } from '../contracts/org';
import { getScene, type StoryApp } from '../levels/story';
import { countAssignedRoles, estimateRunwayAfterRun, getActiveRoles, useGameStore } from '../state/gameStore';
import { APP_META } from './game-screen/constants';
import { AppDock } from './game-screen/components/AppDock';
import { IntroDialog } from './game-screen/components/IntroDialog';
import { getCrossAppHandoff } from './game-screen/handoffs';
import { buildClientReview } from './game-screen/clientReview';
import { NotificationBanner, type MessageNotification } from './game-screen/scenes/CommunicationScenes';
import { MailInboxScene } from './game-screen/scenes/MailScenes';
import { StatusBar } from './game-screen/components/StatusBar';
import { renderSceneContent } from './game-screen/sceneContent';
import { DormantAppPanel } from './game-screen/scenes/OperationsScenes';
import type { AppSwitchPhase, ArtifactGenerationProgress } from './game-screen/types';
import { getAppLaunchOrigin, getLatestReachedSceneForApp, getUnlockedApps } from './game-screen/utils';
import './game-screen.css';

export type IntroDialogConfig = {
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  primaryActionDisabled?: boolean;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
};

type GameScreenProps = {
  forceIntroDialog?: boolean;
  suppressIntroDialog?: boolean;
  introDialogConfig?: IntroDialogConfig | null;
  headerAccessory?: ReactNode;
  orgTree?: OrgTreeRecord | null;
  artifactGenerationProgress?: ArtifactGenerationProgress | null;
  artifactGenerationError?: string | null;
  onRetryArtifactGeneration?: () => Promise<void> | void;
  isRetryingArtifactGeneration?: boolean;
  onSetStudioName?: (name: string) => Promise<void> | void;
  onConfigureRole?: (roleId: string, name: string) => Promise<void> | void;
  onRunProduction?: () => Promise<void> | void;
  onResetDemo?: () => Promise<void> | void;
};

export default function GameScreen({
  forceIntroDialog = false,
  suppressIntroDialog = false,
  introDialogConfig = null,
  headerAccessory = null,
  orgTree = null,
  artifactGenerationProgress = null,
  artifactGenerationError = null,
  onRetryArtifactGeneration,
  isRetryingArtifactGeneration = false,
  onSetStudioName,
  onConfigureRole,
  onRunProduction,
  onResetDemo
}: GameScreenProps) {
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
  const runHistory = useGameStore((state) => state.runHistory);
  const clientReviews = useGameStore((state) => state.clientReviews);

  const advanceStory = useGameStore((state) => state.advanceStory);
  const retreatStory = useGameStore((state) => state.retreatStory);
  const setStudioName = useGameStore((state) => state.setStudioName);
  const dismissIntroDialog = useGameStore((state) => state.dismissIntroDialog);
  const configureRole = useGameStore((state) => state.configureRole);
  const unlockExpandedRoles = useGameStore((state) => state.unlockExpandedRoles);
  const assignRole = useGameStore((state) => state.assignRole);
  const runProduction = useGameStore((state) => state.runProduction);
  const resetTutorial = useGameStore((state) => state.resetTutorial);
  const setClientReview = useGameStore((state) => state.setClientReview);

  const scene = getScene(storySceneIndex);
  const nextScene = getScene(storySceneIndex + 1);
  const unlockedApps = useMemo(() => getUnlockedApps(storySceneIndex), [storySceneIndex]);
  const previousUnlockedAppsRef = useRef<StoryApp[]>(storySceneIndex === 0 && unlockedApps.includes('mail') ? unlockedApps.filter((app) => app !== 'mail') : unlockedApps);

  const [currentApp, setCurrentApp] = useState<StoryApp>(scene.app);
  const [pendingApp, setPendingApp] = useState<StoryApp | null>(null);
  const [switchPhase, setSwitchPhase] = useState<AppSwitchPhase>('idle');
  const [launchOriginX, setLaunchOriginX] = useState<number>(getAppLaunchOrigin(scene.app, unlockedApps));
  const [pulseApp, setPulseApp] = useState<StoryApp | null>(null);
  const [installingApp, setInstallingApp] = useState<StoryApp | null>(null);
  const [isFactoryLocked, setIsFactoryLocked] = useState(false);
  const [isEmailNotificationVisible, setIsEmailNotificationVisible] = useState(false);
  const [pendingHandoffSceneId, setPendingHandoffSceneId] = useState<string | null>(null);
  const [openedStoryMailSceneIds, setOpenedStoryMailSceneIds] = useState<string[]>([]);

  const activeRoles = getActiveRoles(roles, unlockedRoleCount);
  const assignedActiveRoles = countAssignedRoles(activeRoles);
  const runwayAfterRun = estimateRunwayAfterRun(treasury, activeRoles, agents);
  const showIntroDialog =
    forceIntroDialog || (!suppressIntroDialog && storySceneIndex === 0 && !hasSeenIntroDialog);
  const canSwitchApps = !isFactoryLocked && !showIntroDialog;

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

  const handleReplayDemo = useCallback(() => {
    void (async () => {
      try {
        await onResetDemo?.();
      } catch (error) {
        window.alert(
          error instanceof Error ? error.message : 'Could not reset the current run.'
        );
        return;
      }

      const resetApps = getUnlockedApps(0);
      resetTutorial();
      setCurrentApp('messages');
      setPendingApp(null);
      setSwitchPhase('idle');
      setPulseApp(null);
      setInstallingApp(resetApps.includes('mail') ? 'mail' : null);
      setIsFactoryLocked(false);
      setIsEmailNotificationVisible(false);
      setPendingHandoffSceneId(null);
      setOpenedStoryMailSceneIds([]);
      setLaunchOriginX(getAppLaunchOrigin('messages', resetApps));
      previousUnlockedAppsRef.current = resetApps;
    })();
  }, [onResetDemo, resetTutorial]);

  const handleDockOpen = useCallback(
    (targetApp: StoryApp) => {
      requestAppSwitch(targetApp);
    },
    [requestAppSwitch]
  );

  const handleRunProduction = useCallback(() => {
    if (onRunProduction) {
      return onRunProduction();
    }

    runProduction();
  }, [onRunProduction, runProduction]);

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
  useEffect(() => {
    if (storySceneIndex === 0) {
      setIsEmailNotificationVisible(false);
      setPendingHandoffSceneId(null);
      setOpenedStoryMailSceneIds([]);
    }
  }, [storySceneIndex]);

  const frameStyle = { '--launch-origin-x': `${launchOriginX}%` } as CSSProperties;

  const handleMailNotificationOpen = useCallback(() => {
    setIsEmailNotificationVisible(false);
    advanceStoryAndOpenApp('mail');
  }, [advanceStoryAndOpenApp]);
  const getClientReviewForSceneId = useCallback(
    (sceneId: string) => {
      if (sceneId === 'mail-fail') {
        return clientReviews[1] ?? null;
      }

      if (sceneId === 'mail-success') {
        return clientReviews[2] ?? null;
      }

      return null;
    },
    [clientReviews]
  );
  const buildMailHandoff = useCallback(
    (sceneId: string) => {
      const review = getClientReviewForSceneId(sceneId);

      if (!review) {
        return getCrossAppHandoff(sceneId);
      }

      return {
        targetApp: 'mail' as const,
        appName: 'Mail',
        title: review.notificationTitle,
        preview: review.notificationPreview,
        icon: 'mail' as const
      };
    },
    [getClientReviewForSceneId]
  );
  const nextHandoff = buildMailHandoff(nextScene.id);
  const pendingHandoff = pendingHandoffSceneId ? buildMailHandoff(pendingHandoffSceneId) : undefined;
  const queueCrossAppAdvance = useCallback(() => {
    if (nextHandoff) setPendingHandoffSceneId(nextScene.id);
    advanceStory();
  }, [advanceStory, nextHandoff, nextScene.id]);
  const handleSubmitToClient = useCallback(
    (cycle: 1 | 2) => {
      if (!latestRun || !latestArtifacts) {
        return;
      }

      const review = buildClientReview({
        cycle,
        studioName,
        run: latestRun,
        artifact: latestArtifacts
      });

      setClientReview(cycle, review);
      queueCrossAppAdvance();
    },
    [latestArtifacts, latestRun, queueCrossAppAdvance, setClientReview, studioName]
  );
  const handleHandoffNotificationOpen = useCallback(() => {
    if (!pendingHandoff) return;

    if (pendingHandoff.targetApp === 'mail' && pendingHandoffSceneId) {
      setOpenedStoryMailSceneIds((current) =>
        current.includes(pendingHandoffSceneId) ? current : [...current, pendingHandoffSceneId]
      );
    }

    setPendingHandoffSceneId(null);
    requestAppSwitch(pendingHandoff.targetApp);
  }, [pendingHandoff, pendingHandoffSceneId, requestAppSwitch]);

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
  const isCurrentStoryMailOpened = openedStoryMailSceneIds.includes(scene.id);
  const dockTargetApp = pendingHandoff?.targetApp ?? (hasEmailNotification && isEmailNotificationVisible ? 'mail' : scene.app);
  const resolvedIntroDialogConfig: Required<
    Pick<IntroDialogConfig, 'onPrimaryAction' | 'primaryActionLabel' | 'primaryActionDisabled'>
  > &
    Omit<IntroDialogConfig, 'onPrimaryAction' | 'primaryActionLabel' | 'primaryActionDisabled'> = {
    onPrimaryAction: introDialogConfig?.onPrimaryAction ?? dismissIntroDialog,
    primaryActionLabel: introDialogConfig?.primaryActionLabel ?? 'Start Demo',
    primaryActionDisabled: introDialogConfig?.primaryActionDisabled ?? false,
    secondaryActionLabel: introDialogConfig?.secondaryActionLabel,
    onSecondaryAction: introDialogConfig?.onSecondaryAction
  };

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
      autoAdvanceDelayMs =
        scene.id === 'mail-offer' || (scene.id === 'mail-fail' && isCurrentStoryMailOpened)
          ? 3600
          : null;
    }

    if (autoAdvanceDelayMs === null) {
      return;
    }

    const timer = window.setTimeout(() => queueCrossAppAdvance(), autoAdvanceDelayMs);
    return () => window.clearTimeout(timer);
  }, [
    currentApp,
    isCurrentStoryMailOpened,
    pendingHandoffSceneId,
    queueCrossAppAdvance,
    scene.id,
    showIntroDialog
  ]);

  useEffect(() => {
    if (pendingHandoffSceneId && (pendingHandoffSceneId !== scene.id || currentApp === scene.app)) {
      setPendingHandoffSceneId(null);
    }
  }, [currentApp, pendingHandoffSceneId, scene.app, scene.id]);

  const displayedScene = currentApp === scene.app ? scene : getLatestReachedSceneForApp(storySceneIndex, currentApp);
  const isSceneInteractive = currentApp === scene.app;
  const displayedClientReview = displayedScene ? getClientReviewForSceneId(displayedScene.id) : null;
  const storyMailInboxItem =
    displayedScene && displayedClientReview
      ? {
          sender: displayedClientReview.sender,
          subject: displayedClientReview.subject,
          preview: displayedClientReview.inboxPreview,
          timestamp: 'now',
          onOpen: () =>
            setOpenedStoryMailSceneIds((current) =>
              current.includes(displayedScene.id) ? current : [...current, displayedScene.id]
            )
        }
      : undefined;
  const shouldShowStoryMailInbox =
    currentApp === 'mail' &&
    Boolean(displayedScene && displayedClientReview) &&
    !openedStoryMailSceneIds.includes(displayedScene?.id ?? '');
  const sceneContent = displayedScene
    ? renderSceneContent({
        sceneId: displayedScene.id,
        isInteractive: isSceneInteractive,
        studioName,
        orgTree,
        activeRoles,
        agents,
        assignmentLog,
        assignedActiveRoles,
        latestRun,
        latestArtifacts,
        runHistory,
        clientReviews,
        runCount,
        runwayAfterRun,
        artifactGenerationProgress,
        artifactGenerationError,
        retryArtifactGeneration: onRetryArtifactGeneration,
        isRetryingArtifactGeneration,
        advanceStory,
        queueCrossAppAdvance,
        setStudioName: onSetStudioName ?? setStudioName,
        configureRole: onConfigureRole ?? configureRole,
        unlockExpandedRoles,
        assignRole,
        runProduction: handleRunProduction,
        submitClientReview: handleSubmitToClient,
        resetDemo: handleReplayDemo,
        setIsFactoryLocked
      })
    : null;
  const appContent = showIntroDialog
    ? <div className="intro-app-placeholder" aria-hidden="true" />
    : shouldShowStoryMailInbox && storyMailInboxItem
      ? <MailInboxScene storyItem={storyMailInboxItem} />
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
              {headerAccessory ? <div className="app-header-accessory">{headerAccessory}</div> : null}
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

          {showIntroDialog ? <IntroDialog {...resolvedIntroDialogConfig} /> : null}
        </div>
      </section>
    </main>
  );
}
