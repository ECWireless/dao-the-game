import { useEffect, useRef, useState } from 'react';

import './player-session-bar.css';

type PlayerSessionBarProps = {
  label: string;
  embeddedWalletAddress?: string | null;
  onReset: () => void;
  onSignOut: () => void;
  isResetting: boolean;
};

export function PlayerSessionBar({
  label,
  embeddedWalletAddress,
  onReset,
  onSignOut,
  isResetting
}: PlayerSessionBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
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

  useEffect(() => {
    if (copyState === 'idle') {
      return;
    }

    const timer = window.setTimeout(() => setCopyState('idle'), 1600);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  const shortEmbeddedWalletAddress = embeddedWalletAddress
    ? `${embeddedWalletAddress.slice(0, 6)}...${embeddedWalletAddress.slice(-4)}`
    : null;

  const handleCopyEmbeddedWallet = async () => {
    if (!embeddedWalletAddress) {
      return;
    }

    try {
      await navigator.clipboard.writeText(embeddedWalletAddress);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  };

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
          {embeddedWalletAddress ? (
            <div className="player-session-copy-card">
              <div className="player-session-copy-copy">
                <span className="player-session-copy-kicker">Embedded wallet</span>
                <span className="player-session-copy-value" title={embeddedWalletAddress}>
                  {shortEmbeddedWalletAddress}
                </span>
              </div>
              <button
                className="player-session-copy-button"
                type="button"
                onClick={handleCopyEmbeddedWallet}
              >
                {copyState === 'copied'
                  ? 'Copied'
                  : copyState === 'error'
                    ? 'Try again'
                    : 'Copy'}
              </button>
            </div>
          ) : null}
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
