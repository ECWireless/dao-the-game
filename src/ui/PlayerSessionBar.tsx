import { useEffect, useRef, useState } from 'react';

import './player-session-bar.css';

type PlayerSessionBarProps = {
  label: string;
  onReset: () => void;
  onSignOut: () => void;
  isResetting: boolean;
};

export function PlayerSessionBar({
  label,
  onReset,
  onSignOut,
  isResetting
}: PlayerSessionBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="player-session-bar">
      <button
        className={`player-session-trigger ${isOpen ? 'is-open' : ''}`}
        type="button"
        aria-label={isOpen ? 'Close player menu' : 'Open player menu'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>
      {isOpen ? (
        <div className="player-session-menu">
          <p className="player-session-label">{label}</p>
          <div className="player-session-actions">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onReset();
              }}
              disabled={isResetting}
            >
              {isResetting ? 'Resetting...' : 'Reset demo'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onSignOut();
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
