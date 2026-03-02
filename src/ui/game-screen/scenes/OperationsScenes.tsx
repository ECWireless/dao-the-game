import type { StoryApp } from '../../../levels/story';
import type { HatRole, RunResult } from '../../../types';
import { APP_META } from '../constants';

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
