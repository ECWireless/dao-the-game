import type { StoryApp } from '../../../levels/story';
import guildSymbol from '../../../assets/raidguild-symbol.svg';
import { APP_META } from '../constants';

function InstallWheel() {
  return (
    <span className="dock-install-wheel">
      <svg viewBox="0 0 36 36">
        <circle className="dock-install-track" cx="18" cy="18" r="15.5" />
        <circle className="dock-install-progress" cx="18" cy="18" r="15.5" />
      </svg>
    </span>
  );
}

function AppGlyph({ app }: { app: StoryApp }) {
  switch (app) {
    case 'messages':
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M6.5 6.5h11a2 2 0 0 1 2 2v5.8a2 2 0 0 1-2 2H11l-3.9 3v-3H6.5a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2Z"
            fill="currentColor"
            opacity="0.92"
          />
        </svg>
      );
    case 'mail':
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="4.5" y="6.5" width="15" height="11" rx="2.2" fill="currentColor" opacity="0.92" />
          <path
            d="m6.4 8.4 5.1 4.1a.8.8 0 0 0 1 0l5.1-4.1"
            stroke="rgb(255 255 255 / 0.86)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
        </svg>
      );
    case 'whiteboard':
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="5" y="5.5" width="14" height="13" rx="2.2" fill="currentColor" opacity="0.18" />
          <rect x="7" y="8" width="10" height="1.6" rx="0.8" fill="currentColor" />
          <rect x="7" y="11.2" width="7" height="1.6" rx="0.8" fill="currentColor" />
          <rect x="7" y="14.4" width="8.4" height="1.6" rx="0.8" fill="currentColor" />
        </svg>
      );
    case 'guild':
      return <img src={guildSymbol} alt="" />;
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="5.2" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 3.8v2.2M12 18v2.2M20.2 12H18M6 12H3.8M17.7 6.3l-1.6 1.6M7.9 16.1l-1.6 1.6M17.7 17.7l-1.6-1.6M7.9 7.9 6.3 6.3"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
        </svg>
      );
  }
}

function AppIcon({ app, isInstalling }: { app: StoryApp; isInstalling: boolean }) {
  return (
    <span className={`dock-icon dock-icon-${app}`} aria-hidden="true">
      <AppGlyph app={app} />
      {isInstalling ? <InstallWheel /> : null}
    </span>
  );
}

export function DockTile({
  app,
  isInstalling,
  isTarget
}: {
  app: StoryApp;
  isInstalling: boolean;
  isTarget: boolean;
}) {
  return (
    <>
      <AppIcon app={app} isInstalling={isInstalling} />
      <span className="dock-label">{APP_META[app].label}</span>
      {isTarget ? <span className="dock-badge" aria-hidden="true" /> : null}
    </>
  );
}
