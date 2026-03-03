import type { CSSProperties } from 'react';
import type { StoryApp } from '../../../levels/story';
import { APP_META } from '../constants';
import { DockTile } from './DockVisuals';

type AppDockProps = {
  availableApps: StoryApp[];
  currentApp: StoryApp;
  targetApp: StoryApp;
  pulseApp: StoryApp | null;
  installingApp: StoryApp | null;
  onOpen: (app: StoryApp) => void;
  disabled: boolean;
};

export function AppDock({
  availableApps,
  currentApp,
  targetApp,
  pulseApp,
  installingApp,
  onOpen,
  disabled
}: AppDockProps) {
  return (
    <nav
      className="app-dock"
      style={{ '--dock-count': `${Math.max(availableApps.length, 1)}` } as CSSProperties}
      aria-label="App Dock"
    >
      {availableApps.map((app) => {
        const isCurrent = currentApp === app;
        const isTarget = targetApp === app;
        const isPulse = pulseApp === app;
        const isInstalling = installingApp === app;

        return (
          <button
            key={app}
            className={[
              'dock-app',
              isCurrent ? 'is-current' : '',
              isPulse ? 'is-pulse' : '',
              isInstalling ? 'is-installing' : ''
            ]
              .filter(Boolean)
              .join(' ')}
            type="button"
            onClick={() => onOpen(app)}
            disabled={disabled}
            aria-label={`Open ${APP_META[app].label}`}
          >
            <DockTile app={app} isInstalling={isInstalling} isTarget={isTarget} />
          </button>
        );
      })}
    </nav>
  );
}
