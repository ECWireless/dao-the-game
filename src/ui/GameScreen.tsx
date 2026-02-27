import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getScene, STORY_SCENE_COUNT, type StoryApp } from '../levels/story';
import { TUTORIAL_TREASURY } from '../levels/tutorial';
import {
  countAssignedRoles,
  estimateRunCost,
  estimateRunwayAfterRun,
  getActiveRoles,
  useGameStore
} from '../state/gameStore';
import type { Agent, HatRole, RunResult } from '../types';
import './game-screen.css';

type ChatAuthor = 'friend' | 'player' | 'system' | 'client';
type AppSwitchPhase = 'idle' | 'out' | 'in';

type ChatLine = {
  id: string;
  author: ChatAuthor;
  text: string;
};

type RunSummary = {
  passed: boolean;
  qualityScore: number;
  cost: number;
  events: string[];
};

const RUN_PHASES = ['Designing', 'Building', 'Reviewing', 'Deploying', 'Client Reviewing'];
const APP_ORDER: StoryApp[] = ['messages', 'mail', 'whiteboard', 'guild', 'machine'];

const APP_META: Record<StoryApp, { label: string; icon: string; tint: string }> = {
  messages: { label: 'Messages', icon: 'MSG', tint: '#6bc4ff' },
  mail: { label: 'Mail', icon: 'ML', tint: '#ffbf67' },
  whiteboard: { label: 'Whiteboard', icon: 'WB', tint: '#a6ff8e' },
  guild: { label: 'RaidGuild', icon: 'RG', tint: '#f98bc8' },
  machine: { label: 'Machine', icon: 'RUN', tint: '#9da4ff' }
};

function getAppLaunchOrigin(targetApp: StoryApp): number {
  const index = APP_ORDER.indexOf(targetApp);
  const normalizedIndex = index < 0 ? 0 : index;
  return ((normalizedIndex + 0.5) / APP_ORDER.length) * 100;
}

function formatCredits(value: number): string {
  return `${Math.max(0, Math.round(value))} cr`;
}

function formatRoleAssignment(role: HatRole, agent?: Agent): string {
  if (!agent) {
    return `${role.name}: awaiting hire`;
  }

  return `${role.name}: ${agent.roleAffinity} (${agent.id})`;
}

function getRunSummary(result?: RunResult): RunSummary | undefined {
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

function usePhoneTime(): string {
  const [timeLabel, setTimeLabel] = useState(() =>
    new Date().toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit'
    })
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLabel(
        new Date().toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit'
        })
      );
    }, 30_000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return timeLabel;
}

function StatusBar({ sceneIndex, treasury }: { sceneIndex: number; treasury: number }) {
  const timeLabel = usePhoneTime();
  const normalized = Math.max(0, Math.min(1, treasury / TUTORIAL_TREASURY));

  return (
    <header className="status-bar">
      <div className="status-time">{timeLabel}</div>
      <div className="status-center">
        <span>{sceneIndex + 1}/{STORY_SCENE_COUNT}</span>
      </div>
      <div className="status-right">
        <span>{Math.round(normalized * 100)}%</span>
        <span className="battery-pill" aria-hidden="true">
          <span style={{ width: `${Math.round(normalized * 100)}%` }} />
        </span>
      </div>
    </header>
  );
}

function ChatBubble({ line, order }: { line: ChatLine; order: number }) {
  return (
    <article
      className={`chat-bubble from-${line.author}`}
      style={{ animationDelay: `${order * 95}ms` }}
      aria-label={`${line.author} message`}
    >
      <p>{line.text}</p>
    </article>
  );
}

function MessagesScene({
  thread,
  draft,
  sendLabel,
  onSend,
  footerActionLabel,
  onFooterAction,
  showNotification
}: {
  thread: ChatLine[];
  draft?: string;
  sendLabel?: string;
  onSend?: () => void;
  footerActionLabel?: string;
  onFooterAction?: () => void;
  showNotification?: boolean;
}) {
  return (
    <section className="scene-body messages-scene">
      <div className="chat-thread">
        {thread.map((line, index) => (
          <ChatBubble key={line.id} line={line} order={index} />
        ))}
      </div>

      {showNotification ? (
        <aside className="notification-drop" role="status">
          New Email: "URGENT REBRAND REQUEST"
        </aside>
      ) : null}

      {draft && onSend ? (
        <div className="draft-row">
          <p className="draft-preview">{draft}</p>
          <button className="primary-action" type="button" onClick={onSend}>
            {sendLabel ?? 'Send'}
          </button>
        </div>
      ) : null}

      {footerActionLabel && onFooterAction ? (
        <button className="primary-action" type="button" onClick={onFooterAction}>
          {footerActionLabel}
        </button>
      ) : null}
    </section>
  );
}

function MailScene({
  from,
  subject,
  body,
  draft,
  sendLabel,
  onSend,
  actionLabel,
  onAction,
  tone
}: {
  from: string;
  subject: string;
  body: string[];
  draft?: string;
  sendLabel?: string;
  onSend?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  tone: 'panic' | 'fail' | 'success';
}) {
  return (
    <section className="scene-body mail-scene">
      <article className={`mail-card tone-${tone}`}>
        <p className="eyebrow">From: {from}</p>
        <h2>{subject}</h2>
        <div className="mail-copy">
          {body.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </article>

      {draft && onSend ? (
        <div className="draft-row">
          <p className="draft-preview">{draft}</p>
          <button className="primary-action" type="button" onClick={onSend}>
            {sendLabel ?? 'Send Reply'}
          </button>
        </div>
      ) : null}

      {actionLabel && onAction ? (
        <button className="primary-action" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}

function WhiteboardScene({
  roles,
  agents,
  copy,
  actionLabel,
  onAction,
  isExpanded
}: {
  roles: HatRole[];
  agents: Agent[];
  copy: string;
  actionLabel: string;
  onAction: () => void;
  isExpanded: boolean;
}) {
  const agentById = useMemo(() => new Map(agents.map((agent) => [agent.id, agent])), [agents]);

  return (
    <section className="scene-body whiteboard-scene">
      <p className="scene-copy">{copy}</p>

      <div className={`whiteboard-grid ${isExpanded ? 'expanded' : ''}`}>
        {roles.map((role) => {
          const agent = role.assignedAgentId ? agentById.get(role.assignedAgentId) : undefined;

          return (
            <article key={role.id} className="role-note">
              <p className="role-note-title">{role.name}</p>
              <p>{formatRoleAssignment(role, agent)}</p>
              <span className={`status-lamp ${agent ? 'lamp-on' : 'lamp-off'}`} aria-hidden="true" />
            </article>
          );
        })}
      </div>

      <button className="primary-action" type="button" onClick={onAction}>
        {actionLabel}
      </button>
    </section>
  );
}

function GuildScene({
  roles,
  agents,
  assignmentLog,
  onAssign,
  onContinue,
  continueDisabled,
  guidance
}: {
  roles: HatRole[];
  agents: Agent[];
  assignmentLog: Array<{ id: string; message: string }>;
  onAssign: (roleId: string, agentId: string) => void;
  onContinue: () => void;
  continueDisabled: boolean;
  guidance: string;
}) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.id ?? '');

  useEffect(() => {
    if (!roles.some((role) => role.id === selectedRoleId)) {
      setSelectedRoleId(roles[0]?.id ?? '');
    }
  }, [roles, selectedRoleId]);

  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? roles[0];

  return (
    <section className="scene-body guild-scene">
      <p className="scene-copy">{guidance}</p>

      <div className="role-tabs" role="tablist" aria-label="Select role to hire for">
        {roles.map((role) => (
          <button
            key={role.id}
            className={`role-tab ${selectedRole?.id === role.id ? 'is-active' : ''}`}
            type="button"
            role="tab"
            aria-selected={selectedRole?.id === role.id}
            onClick={() => setSelectedRoleId(role.id)}
          >
            {role.name}
          </button>
        ))}
      </div>

      <div className="candidate-stack" aria-label="Candidate responses">
        {agents.map((agent, index) => (
          <article className="candidate-card" key={agent.id} style={{ animationDelay: `${index * 125}ms` }}>
            <div>
              <p className="candidate-name">{agent.roleAffinity}</p>
              <p className="candidate-meta">
                {agent.id} | reliability {agent.reliability} | cost {formatCredits(agent.cost)}
              </p>
            </div>
            <button
              className="mini-action"
              type="button"
              onClick={() => selectedRole && onAssign(selectedRole.id, agent.id)}
            >
              Hire for {selectedRole?.name ?? 'role'}
            </button>
          </article>
        ))}
      </div>

      <section className="ops-log">
        <p className="eyebrow">Ops Log</p>
        <ul>
          {assignmentLog.slice(0, 4).map((entry) => (
            <li key={entry.id}>{entry.message}</li>
          ))}
          {assignmentLog.length === 0 ? <li>No hires logged yet.</li> : null}
        </ul>
      </section>

      <button className="primary-action" type="button" disabled={continueDisabled} onClick={onContinue}>
        Return to Machine
      </button>
    </section>
  );
}

function MachineScene({
  cycle,
  canRun,
  hasRun,
  latestRunSummary,
  onRun,
  onContinue,
  onLockChange
}: {
  cycle: 1 | 2;
  canRun: boolean;
  hasRun: boolean;
  latestRunSummary?: RunSummary;
  onRun: () => Promise<void>;
  onContinue: () => void;
  onLockChange: (isLocked: boolean) => void;
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(-1);

  useEffect(() => {
    onLockChange(isRunning);

    return () => {
      onLockChange(false);
    };
  }, [isRunning, onLockChange]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const timer = window.setInterval(() => {
      setPhaseIndex((current) => {
        if (current >= RUN_PHASES.length - 1) {
          window.clearInterval(timer);
          return current;
        }

        return current + 1;
      });
    }, 650);

    return () => {
      window.clearInterval(timer);
    };
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning || phaseIndex < RUN_PHASES.length - 1) {
      return;
    }

    const finalize = window.setTimeout(async () => {
      await onRun();
      setIsRunning(false);
      setPhaseIndex(-1);
    }, 480);

    return () => {
      window.clearTimeout(finalize);
    };
  }, [isRunning, onRun, phaseIndex]);

  return (
    <section className="scene-body machine-scene">
      <p className="scene-copy">
        {cycle === 1
          ? 'Cycle one: one role only. Expect unstable output and client backlash.'
          : 'Cycle two: expanded role graph online. Running confidence rebuild.'}
      </p>

      <ol className="phase-list" aria-label="Autonomous pipeline">
        {RUN_PHASES.map((phase, index) => {
          const state = isRunning
            ? index < phaseIndex
              ? 'done'
              : index === phaseIndex
                ? 'active'
                : 'todo'
            : 'todo';

          return (
            <li key={phase} className={`phase-row is-${state}`}>
              <span className="phase-lamp" aria-hidden="true" />
              <span>{phase}</span>
            </li>
          );
        })}
      </ol>

      {!hasRun ? (
        <button
          className="primary-action"
          type="button"
          disabled={!canRun || isRunning}
          onClick={() => {
            setIsRunning(true);
            setPhaseIndex(0);
          }}
        >
          {isRunning ? 'Machine Running...' : 'Engage Autonomous Cycle'}
        </button>
      ) : null}

      {hasRun && latestRunSummary ? (
        <article className={`run-summary ${latestRunSummary.passed ? 'is-pass' : 'is-fail'}`}>
          <h2>{latestRunSummary.passed ? 'Deployment accepted' : 'Deployment rejected'}</h2>
          <p>Quality {latestRunSummary.qualityScore} | Cost {formatCredits(latestRunSummary.cost)}</p>
          <p>{latestRunSummary.events[latestRunSummary.events.length - 1]}</p>
          <button className="primary-action" type="button" onClick={onContinue}>
            Submit to Client
          </button>
        </article>
      ) : null}
    </section>
  );
}

function AppDock({
  currentApp,
  targetApp,
  pulseApp,
  onOpen,
  disabled
}: {
  currentApp: StoryApp;
  targetApp: StoryApp;
  pulseApp: StoryApp | null;
  onOpen: (app: StoryApp) => void;
  disabled: boolean;
}) {
  return (
    <nav className="app-dock" aria-label="App Dock">
      {APP_ORDER.map((app) => {
        const meta = APP_META[app];
        const isCurrent = currentApp === app;
        const isTarget = targetApp === app;
        const isPulse = pulseApp === app;

        return (
          <button
            key={app}
            className={`dock-app ${isCurrent ? 'is-current' : ''} ${isPulse ? 'is-pulse' : ''}`}
            type="button"
            onClick={() => onOpen(app)}
            disabled={disabled}
            aria-label={`Open ${meta.label}`}
          >
            <span className="dock-icon" style={{ borderColor: meta.tint, color: meta.tint }}>
              {meta.icon}
            </span>
            <span className="dock-label">{meta.label}</span>
            {isTarget ? <span className="dock-badge" aria-hidden="true" /> : null}
          </button>
        );
      })}
    </nav>
  );
}

function DormantAppPanel({
  app,
  targetApp,
  onReturn,
  activeRoles,
  assignedRoles,
  runCount,
  latestRun
}: {
  app: StoryApp;
  targetApp: StoryApp;
  onReturn: () => void;
  activeRoles: HatRole[];
  assignedRoles: number;
  runCount: number;
  latestRun?: RunResult;
}) {
  const titleByApp: Record<StoryApp, string> = {
    messages: 'Guide thread is quiet right now.',
    mail: 'Inbox is waiting for the next update.',
    whiteboard: 'Blueprint remains pinned.',
    guild: 'Guild chat is idling between hires.',
    machine: 'Machine controls are on standby.'
  };

  return (
    <section className="scene-body dormant-scene">
      <p className="scene-copy">{titleByApp[app]}</p>
      <article className="dormant-card">
        <p>
          Active assignments: {assignedRoles}/{activeRoles.length}
        </p>
        <p>Runs completed: {runCount}</p>
        <p>Latest quality: {latestRun?.qualityScore ?? '--'}</p>
      </article>
      <button className="primary-action" type="button" onClick={onReturn}>
        Return to {APP_META[targetApp].label}
      </button>
    </section>
  );
}

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

  const [currentApp, setCurrentApp] = useState<StoryApp>(getScene(storySceneIndex).app);
  const [pendingApp, setPendingApp] = useState<StoryApp | null>(null);
  const [switchPhase, setSwitchPhase] = useState<AppSwitchPhase>('idle');
  const [launchOriginX, setLaunchOriginX] = useState<number>(getAppLaunchOrigin(getScene(storySceneIndex).app));
  const [pulseApp, setPulseApp] = useState<StoryApp | null>(null);
  const [isMachineLocked, setIsMachineLocked] = useState(false);

  const scene = getScene(storySceneIndex);
  const activeRoles = getActiveRoles(roles, unlockedRoleCount);
  const assignedActiveRoles = countAssignedRoles(activeRoles);
  const runEstimate = estimateRunCost(activeRoles, agents);
  const runwayAfterRun = estimateRunwayAfterRun(treasury, activeRoles, agents);

  const canSwitchApps = !isMachineLocked;

  const requestAppSwitch = useCallback(
    (targetApp: StoryApp) => {
      if (!canSwitchApps || targetApp === currentApp || switchPhase !== 'idle') {
        return;
      }

      setLaunchOriginX(getAppLaunchOrigin(targetApp));
      setPulseApp(targetApp);
      setPendingApp(targetApp);
      setSwitchPhase('out');
    },
    [canSwitchApps, currentApp, switchPhase]
  );

  useEffect(() => {
    if (scene.app !== currentApp && switchPhase === 'idle' && !pendingApp) {
      requestAppSwitch(scene.app);
    }
  }, [currentApp, pendingApp, requestAppSwitch, scene.app, switchPhase]);

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

  const latestRunSummary = getRunSummary(latestRun);

  const targetSceneContent = (() => {
    if (scene.id === 'messages-warmup') {
      const thread: ChatLine[] = [
        { id: 'a', author: 'friend', text: 'yo accidental operator, you online?' },
        { id: 'b', author: 'player', text: 'barely. why?' },
        { id: 'c', author: 'friend', text: 'keep this thread open. chaos is inbound.' }
      ];

      return (
        <MessagesScene
          thread={thread}
          draft="uh okay... waiting for chaos"
          sendLabel="Send"
          onSend={advanceStory}
        />
      );
    }

    if (scene.id === 'messages-notification') {
      const thread: ChatLine[] = [
        { id: 'd', author: 'system', text: 'Push alert: new email marked URGENT.' },
        { id: 'e', author: 'friend', text: 'that ping is your plot twist. open mail now.' }
      ];

      return (
        <MessagesScene
          thread={thread}
          showNotification
          footerActionLabel="Switch to Mail"
          onFooterAction={advanceStory}
        />
      );
    }

    if (scene.id === 'mail-offer') {
      return (
        <MailScene
          tone="panic"
          from="Lina, Event Director"
          subject="URGENT: Full rebrand needed in 48 hours"
          body={[
            'Our conference brand is collapsing and our website is unusable.',
            'Budget approved: 2800 credits for immediate autonomous rebuild.',
            'Need architecture, design, QA, deployment. No delays.'
          ]}
          draft="I think you emailed the wrong person. I have no idea how to build this."
          sendLabel="Send Reply"
          onSend={advanceStory}
        />
      );
    }

    if (scene.id === 'messages-convince') {
      const thread: ChatLine[] = [
        { id: 'f', author: 'player', text: 'they offered 2800 credits. wrong address though.' },
        { id: 'g', author: 'friend', text: 'wrong address? no. destiny typo.' },
        {
          id: 'h',
          author: 'friend',
          text: 'you do not need to build it yourself. you orchestrate. machine does the lifting.'
        }
      ];

      return (
        <MessagesScene
          thread={thread}
          draft="fine. i accept the contract. please don’t let me crash this."
          sendLabel="Send"
          onSend={advanceStory}
        />
      );
    }

    if (scene.id === 'whiteboard-first') {
      return (
        <WhiteboardScene
          roles={activeRoles}
          agents={agents}
          isExpanded={false}
          copy="You open a whiteboard app. Gremlin rule: keep it clumsy and fast. One role only for cycle one."
          actionLabel="Ask Guide About Hiring"
          onAction={advanceStory}
        />
      );
    }

    if (scene.id === 'messages-cant-do') {
      const thread: ChatLine[] = [
        { id: 'i', author: 'player', text: 'can you fill this role for me?' },
        { id: 'j', author: 'friend', text: 'heck no. i am advisory chaos only.' },
        {
          id: 'k',
          author: 'friend',
          text: 'dropping you into RaidGuild server. post the role, hire someone, assign them.'
        }
      ];

      return (
        <MessagesScene
          thread={thread}
          draft="copy that. opening guild and posting role now."
          sendLabel="Send"
          onSend={advanceStory}
        />
      );
    }

    if (scene.id === 'guild-first') {
      const firstRole = activeRoles[0];
      const firstRoleAssigned = Boolean(firstRole?.assignedAgentId);

      return (
        <GuildScene
          roles={activeRoles}
          agents={agents}
          assignmentLog={assignmentLog}
          onAssign={assignRole}
          guidance="Post your role to RaidGuild. Pick one candidate and bind them to the board."
          onContinue={advanceStory}
          continueDisabled={!firstRoleAssigned}
        />
      );
    }

    if (scene.id === 'machine-first') {
      return (
        <MachineScene
          cycle={1}
          canRun={assignedActiveRoles === activeRoles.length}
          hasRun={runCount >= 1}
          latestRunSummary={runCount >= 1 ? latestRunSummary : undefined}
          onRun={async () => {
            runProduction();
          }}
          onContinue={advanceStory}
          onLockChange={setIsMachineLocked}
        />
      );
    }

    if (scene.id === 'mail-fail') {
      return (
        <MailScene
          tone="fail"
          from="Lina, Event Director"
          subject="Re: URGENT rebrand"
          body={[
            'We reviewed the output. This does not feel production-ready.',
            'Visual quality and QA confidence are below threshold.',
            'Please revise role coverage and resubmit quickly.'
          ]}
          actionLabel="Text Your Guide"
          onAction={advanceStory}
        />
      );
    }

    if (scene.id === 'messages-pivot') {
      const thread: ChatLine[] = [
        { id: 'l', author: 'player', text: 'client hated it. i am cooked.' },
        {
          id: 'm',
          author: 'friend',
          text: 'nah. your graph was under-scoped. add Designer + Reviewer + Deployment roles.'
        },
        { id: 'n', author: 'friend', text: 'expand hats tree, hire again, rerun. same machine, better topology.' }
      ];

      return (
        <MessagesScene
          thread={thread}
          draft="patching tree now. let’s run this back."
          sendLabel="Send"
          onSend={() => {
            unlockExpandedRoles();
            advanceStory();
          }}
        />
      );
    }

    if (scene.id === 'whiteboard-expand') {
      return (
        <WhiteboardScene
          roles={activeRoles}
          agents={agents}
          isExpanded
          copy="You expand from one role to a full autonomous chain. Authority wiring now spans design, review, and deployment."
          actionLabel="Open RaidGuild Hiring"
          onAction={advanceStory}
        />
      );
    }

    if (scene.id === 'guild-second') {
      const allAssigned = assignedActiveRoles === activeRoles.length;

      return (
        <GuildScene
          roles={activeRoles}
          agents={agents}
          assignmentLog={assignmentLog}
          onAssign={assignRole}
          guidance="Hire for every remaining role, then snap assignments into the whiteboard graph."
          onContinue={advanceStory}
          continueDisabled={!allAssigned}
        />
      );
    }

    if (scene.id === 'machine-second') {
      return (
        <MachineScene
          cycle={2}
          canRun={assignedActiveRoles === activeRoles.length && runwayAfterRun >= 0}
          hasRun={runCount >= 2}
          latestRunSummary={runCount >= 2 ? latestRunSummary : undefined}
          onRun={async () => {
            runProduction();
          }}
          onContinue={advanceStory}
          onLockChange={setIsMachineLocked}
        />
      );
    }

    return (
      <MailScene
        tone="success"
        from="Lina, Event Director"
        subject="Approved: Autonomous relaunch accepted"
        body={[
          'This second submission is exactly what we needed.',
          'Role coverage is clear, quality is strong, and deployment confidence is high.',
          'Congrats. You turned panic into a working machine.'
        ]}
        actionLabel="Play Again"
        onAction={resetTutorial}
      />
    );
  })();

  const appContent =
    currentApp === scene.app ? (
      targetSceneContent
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
          <div className="wallpaper-sticker sticker-one" aria-hidden="true">
            RAID
          </div>
          <div className="wallpaper-sticker sticker-two" aria-hidden="true">
            CHAOS
          </div>

          <StatusBar sceneIndex={storySceneIndex} treasury={treasury} />

          <section className="app-header">
            <p className="app-title">{APP_META[currentApp].label}</p>
            <p className="app-subtitle">{scene.app === currentApp ? getScene(storySceneIndex).subtitle : 'Background app'}</p>
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
              currentApp={currentApp}
              targetApp={scene.app}
              pulseApp={pulseApp}
              onOpen={requestAppSwitch}
              disabled={!canSwitchApps || switchPhase !== 'idle'}
            />

            <button
              className="ghost-action"
              type="button"
              onClick={retreatStory}
              disabled={storySceneIndex === 0 || !canSwitchApps}
            >
              Previous Beat
            </button>
          </footer>
        </div>
      </section>
    </main>
  );
}
