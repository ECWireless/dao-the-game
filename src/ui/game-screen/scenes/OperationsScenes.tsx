import { useEffect, useState } from 'react';
import type { StoryApp } from '../../../levels/story';
import type { Agent, HatRole, RunResult } from '../../../types';
import { APP_META, RUN_PHASES } from '../constants';
import type { AssignmentLogEntry, RunSummary } from '../types';
import { formatCredits } from '../utils';

type GuildSceneProps = {
  studioName?: string;
  roles: HatRole[];
  agents: Agent[];
  assignmentLog: AssignmentLogEntry[];
  onAssign?: (roleId: string, agentId: string) => void;
  onContinue?: () => void;
  continueDisabled?: boolean;
  guidance: string;
  isReadOnly?: boolean;
};

type MachineSceneProps = {
  studioName?: string;
  cycle: 1 | 2;
  canRun: boolean;
  hasRun: boolean;
  latestRunSummary?: RunSummary;
  onRun?: () => Promise<void>;
  onContinue?: () => void;
  onLockChange?: (isLocked: boolean) => void;
  isReadOnly?: boolean;
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

export function GuildScene({
  studioName,
  roles,
  agents,
  assignmentLog,
  onAssign,
  onContinue,
  continueDisabled = false,
  guidance,
  isReadOnly = false
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
      <p className="eyebrow">Posting As: {studioName || 'Unnamed Studio'}</p>

      <div className="role-tabs" role="tablist" aria-label="Select role to hire for">
        {roles.map((role) => (
          <button
            key={role.id}
            className={`role-tab ${selectedRole?.id === role.id ? 'is-active' : ''}`}
            type="button"
            role="tab"
            aria-selected={selectedRole?.id === role.id}
            disabled={isReadOnly}
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
              disabled={isReadOnly || !selectedRole || !onAssign}
              onClick={() => selectedRole && onAssign?.(selectedRole.id, agent.id)}
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

      {!isReadOnly && onContinue ? (
        <button className="primary-action" type="button" disabled={continueDisabled} onClick={onContinue}>
          Return to Machine
        </button>
      ) : null}
    </section>
  );
}

export function MachineScene({
  studioName,
  cycle,
  canRun,
  hasRun,
  latestRunSummary,
  onRun,
  onContinue,
  onLockChange,
  isReadOnly = false
}: MachineSceneProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(-1);

  useEffect(() => {
    onLockChange?.(isRunning);

    return () => {
      onLockChange?.(false);
    };
  }, [isRunning, onLockChange]);

  useEffect(() => {
    if (!isRunning || isReadOnly) {
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
  }, [isReadOnly, isRunning]);

  useEffect(() => {
    if (!isRunning || isReadOnly || phaseIndex < RUN_PHASES.length - 1 || !onRun) {
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
  }, [isReadOnly, isRunning, onRun, phaseIndex]);

  return (
    <section className="scene-body machine-scene">
      <p className="scene-copy">
        {cycle === 1
          ? 'Cycle one: one role only. Expect unstable output and client backlash.'
          : 'Cycle two: expanded role graph online. Running confidence rebuild.'}
      </p>
      <p className="eyebrow">Studio Runtime: {studioName || 'Unnamed Studio'}</p>

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

      {!hasRun && !isReadOnly ? (
        <button
          className="primary-action"
          type="button"
          disabled={!canRun || isRunning || !onRun}
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
          {!isReadOnly && onContinue ? (
            <button className="primary-action" type="button" onClick={onContinue}>
              Submit to Client
            </button>
          ) : null}
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
