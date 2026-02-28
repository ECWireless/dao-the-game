import { useEffect, useMemo, useState } from 'react';
import type { StoryApp } from '../../../levels/story';
import type { Agent, HatRole, RunResult } from '../../../types';
import { APP_META, RUN_PHASES } from '../constants';
import type { AssignmentLogEntry, RunSummary } from '../types';
import { formatCredits, formatRoleAssignment } from '../utils';

type WhiteboardSceneProps = {
  roles: HatRole[];
  agents: Agent[];
  copy: string;
  actionLabel: string;
  onAction: () => void;
  isExpanded: boolean;
};

type GuildSceneProps = {
  roles: HatRole[];
  agents: Agent[];
  assignmentLog: AssignmentLogEntry[];
  onAssign: (roleId: string, agentId: string) => void;
  onContinue: () => void;
  continueDisabled: boolean;
  guidance: string;
};

type MachineSceneProps = {
  cycle: 1 | 2;
  canRun: boolean;
  hasRun: boolean;
  latestRunSummary?: RunSummary;
  onRun: () => Promise<void>;
  onContinue: () => void;
  onLockChange: (isLocked: boolean) => void;
};

type DormantAppPanelProps = {
  app: StoryApp;
  targetApp: StoryApp;
  onReturn: () => void;
  activeRoles: HatRole[];
  assignedRoles: number;
  runCount: number;
  latestRun?: RunResult;
};

const DORMANT_TITLES: Record<StoryApp, string> = {
  messages: 'Guide thread is quiet right now.',
  mail: 'Inbox is waiting for the next update.',
  whiteboard: 'Blueprint remains pinned.',
  guild: 'Guild chat is idling between hires.',
  machine: 'Machine controls are on standby.'
};

export function WhiteboardScene({ roles, agents, copy, actionLabel, onAction, isExpanded }: WhiteboardSceneProps) {
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

export function GuildScene({
  roles,
  agents,
  assignmentLog,
  onAssign,
  onContinue,
  continueDisabled,
  guidance
}: GuildSceneProps) {
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

export function MachineScene({ cycle, canRun, hasRun, latestRunSummary, onRun, onContinue, onLockChange }: MachineSceneProps) {
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
          <p>
            Quality {latestRunSummary.qualityScore} | Cost {formatCredits(latestRunSummary.cost)}
          </p>
          <p>{latestRunSummary.events[latestRunSummary.events.length - 1]}</p>
          <button className="primary-action" type="button" onClick={onContinue}>
            Submit to Client
          </button>
        </article>
      ) : null}
    </section>
  );
}

export function DormantAppPanel({
  app,
  targetApp,
  onReturn,
  activeRoles,
  assignedRoles,
  runCount,
  latestRun
}: DormantAppPanelProps) {
  return (
    <section className="scene-body dormant-scene">
      <p className="scene-copy">{DORMANT_TITLES[app]}</p>
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
