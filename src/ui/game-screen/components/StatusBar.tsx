import { useEffect, useState } from 'react';
import { STORY_SCENE_COUNT } from '../../../levels/story';
import { TUTORIAL_TREASURY } from '../../../levels/tutorial';

type StatusBarProps = {
  sceneIndex: number;
  treasury: number;
};

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

export function StatusBar({ sceneIndex, treasury }: StatusBarProps) {
  const timeLabel = usePhoneTime();
  const normalized = Math.max(0, Math.min(1, treasury / TUTORIAL_TREASURY));
  const batteryPercent = Math.round(normalized * 100);

  return (
    <header className="status-bar">
      <div className="status-time">{timeLabel}</div>
      <div className="status-center">
        <span>
          {sceneIndex + 1}/{STORY_SCENE_COUNT}
        </span>
      </div>
      <div className="status-right">
        <span>{batteryPercent}%</span>
        <span className="battery-pill" aria-hidden="true">
          <span style={{ width: `${batteryPercent}%` }} />
        </span>
      </div>
    </header>
  );
}
