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

export function FactoryGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M5.1 19V9.8c0-.9.7-1.6 1.6-1.6h1.6c.3 0 .5-.2.5-.5V6.4c0-.8.7-1.5 1.5-1.5h1.3c.8 0 1.5.7 1.5 1.5v6.2h1.2V7.4c0-.8.7-1.5 1.5-1.5H17c.8 0 1.5.7 1.5 1.5v2.9c0 .3.3.5.6.5l-.1 8.2H5.1Z"
        fill="currentColor"
        opacity="0.98"
      />
      <path d="M12.7 19v-5.1h6.3" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.25" />
      <rect x="14.4" y="12.8" width="1.75" height="1.75" rx="0.18" fill="rgb(242 246 249 / 0.95)" />
      <rect x="17" y="12.8" width="1.75" height="1.75" rx="0.18" fill="rgb(242 246 249 / 0.95)" />
      <rect x="14.4" y="15.4" width="1.75" height="1.75" rx="0.18" fill="rgb(242 246 249 / 0.95)" />
      <rect x="17" y="15.4" width="1.75" height="1.75" rx="0.18" fill="rgb(242 246 249 / 0.95)" />
    </svg>
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
    case 'factory':
      return <FactoryGlyph />;
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
