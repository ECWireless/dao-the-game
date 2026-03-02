import { useEffect, useRef, useState } from 'react';
import type { StoryApp } from '../../../levels/story';
import type { ChatLine } from '../types';

export type MessageNotification = {
  appName: string;
  title: string;
  preview: string;
  icon?: StoryApp;
  onOpen: () => void;
};

type TransitionLineState = {
  animate: boolean;
  delayMs: number;
};

type TransitionBatch = {
  key: string;
  lineStates: Record<string, TransitionLineState>;
};

type MessagesSceneProps = {
  thread: ChatLine[];
  contactName?: string;
  contactStatus?: string;
  draft?: string;
  sendLabel?: string;
  onSend?: () => void;
  footerActionLabel?: string;
  onFooterAction?: () => void;
  initialThreadDelayMs?: number;
  disableEntryAnimation?: boolean;
};

function ChatBubble({
  line,
  delayMs = 0,
  animate = true
}: {
  line: ChatLine;
  delayMs?: number;
  animate?: boolean;
}) {
  return (
    <article
      className={`chat-bubble from-${line.author}`}
      style={
        animate
          ? { animationDelay: `${delayMs}ms` }
          : { animation: 'none', opacity: 1, transform: 'none' }
      }
      aria-label={`${line.author} message`}
    >
      <p>{line.text}</p>
    </article>
  );
}

export function NotificationBanner({ notification }: { notification: MessageNotification }) {
  const icon = notification.icon ?? 'mail';

  return (
    <button className="iphone-notification" type="button" onClick={notification.onOpen}>
      <span className="iphone-notification-icon" aria-hidden="true">
        {icon === 'messages' ? (
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M6.3 7.4a2 2 0 0 1 2-2h7.4a2 2 0 0 1 2 2v5.6a2 2 0 0 1-2 2h-4l-2.8 2.4c-.5.4-1.2 0-.9-.6l.8-1.8H8.3a2 2 0 0 1-2-2V7.4Z"
              fill="currentColor"
              opacity="0.94"
            />
          </svg>
        ) : icon === 'whiteboard' ? (
          <svg viewBox="0 0 24 24" fill="none">
            <rect x="5.2" y="4.8" width="13.6" height="14.4" rx="2.1" fill="currentColor" opacity="0.94" />
            <path d="M8.4 9.2h7.2M8.4 12h5.1M8.4 14.8h6.1" stroke="rgb(255 255 255 / 0.92)" strokeLinecap="round" strokeWidth="1.4" />
          </svg>
        ) : icon === 'guild' ? (
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M9.2 5.5 7 18.5M16.9 5.5l-2.2 13M5 9.2h14M4.1 14.8h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
          </svg>
        ) : icon === 'machine' ? (
          <svg viewBox="0 0 24 24" fill="none">
            <rect x="5.4" y="6.1" width="13.2" height="11.8" rx="2.3" fill="currentColor" opacity="0.94" />
            <path d="M9.1 10.1h5.8M9.1 13.9h3.6" stroke="rgb(255 255 255 / 0.9)" strokeLinecap="round" strokeWidth="1.5" />
            <path d="M3.8 9.5h1.8M3.8 14.5h1.8M18.4 9.5h1.8M18.4 14.5h1.8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none">
            <rect
              x="4.5"
              y="6.5"
              width="15"
              height="11"
              rx="2.2"
              fill="currentColor"
              opacity="0.92"
            />
            <path
              d="m6.4 8.4 5.1 4.1a.8.8 0 0 0 1 0l5.1-4.1"
              stroke="rgb(255 255 255 / 0.9)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.6"
            />
          </svg>
        )}
      </span>
      <span className="iphone-notification-copy">
        <span className="iphone-notification-meta">
          <span>{notification.appName}</span>
          <span>now</span>
        </span>
        <span className="iphone-notification-title">{notification.title}</span>
        <span className="iphone-notification-preview">{notification.preview}</span>
      </span>
    </button>
  );
}

export function MessagesScene({
  thread,
  contactName = 'murmur',
  contactStatus = 'online',
  draft,
  sendLabel,
  onSend,
  footerActionLabel,
  onFooterAction,
  initialThreadDelayMs = 0,
  disableEntryAnimation = false
}: MessagesSceneProps) {
  const [isSending, setIsSending] = useState(false);
  const [visibleDraft, setVisibleDraft] = useState('');
  const sendTimerRef = useRef<number | null>(null);
  const draftTimerRef = useRef<number | null>(null);
  const draftStartTimerRef = useRef<number | null>(null);
  const previousThreadIdsRef = useRef<string[]>([]);
  const transitionBatchRef = useRef<TransitionBatch>({
    key: '',
    lineStates: {}
  });
  const pendingSentTextRef = useRef<string | null>(null);
  const isDraftReady = !draft || visibleDraft === draft;
  const hasFooter = Boolean((draft && onSend) || (footerActionLabel && onFooterAction));
  const threadIds = thread.map((line) => line.id);
  const threadKey = threadIds.join('|');
  if (transitionBatchRef.current.key !== threadKey) {
    const previousThreadIds = previousThreadIdsRef.current;
    const pendingSentText = pendingSentTextRef.current;
    const newLines = thread.filter((line) => !previousThreadIds.includes(line.id));
    const isInitialBatch = previousThreadIds.length === 0;
    const pendingSentLineIndex = newLines.findIndex(
      (line) => line.author === 'player' && Boolean(pendingSentText) && line.text === pendingSentText
    );
    const lineStates = Object.fromEntries(
      newLines.map((line, index) => {
        const isPendingSentLine =
          line.author === 'player' && Boolean(pendingSentText) && line.text === pendingSentText;
        const delayMs =
          pendingSentLineIndex !== -1 && index > pendingSentLineIndex
            ? 820 + (index - pendingSentLineIndex - 1) * 150
            : index * 95;
        const effectiveDelayMs =
          isInitialBatch && initialThreadDelayMs > 0 ? delayMs + initialThreadDelayMs : delayMs;

        return [
          line.id,
          {
            animate: !disableEntryAnimation && !isPendingSentLine,
            delayMs: isPendingSentLine ? 0 : effectiveDelayMs
          }
        ];
      })
    );

    transitionBatchRef.current = {
      key: threadKey,
      lineStates
    };
    previousThreadIdsRef.current = threadIds;
  }

  const lineStates = transitionBatchRef.current.lineStates;
  const pendingSentText = pendingSentTextRef.current;
  const threadHasPendingSentLine = Boolean(
    pendingSentText &&
      thread.some((line) => line.author === 'player' && line.text === pendingSentText)
  );
  const latestAnimatedDelayMs = Object.values(lineStates).reduce(
    (latestDelay, lineState) =>
      lineState.animate ? Math.max(latestDelay, lineState.delayMs) : latestDelay,
    0
  );

  useEffect(() => {
    return () => {
      if (sendTimerRef.current !== null) {
        window.clearTimeout(sendTimerRef.current);
      }

      if (draftTimerRef.current !== null) {
        window.clearInterval(draftTimerRef.current);
      }

      if (draftStartTimerRef.current !== null) {
        window.clearTimeout(draftStartTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!draft || !threadHasPendingSentLine || !isSending) {
      return;
    }

    pendingSentTextRef.current = null;
    setIsSending(false);
  }, [draft, isSending, threadHasPendingSentLine]);

  useEffect(() => {
    if (!draft) {
      setVisibleDraft('');
      return;
    }

    setVisibleDraft('');
    const draftStartDelayMs = Math.max(180, latestAnimatedDelayMs + 420);

    draftStartTimerRef.current = window.setTimeout(() => {
      draftStartTimerRef.current = null;

      let index = 0;
      draftTimerRef.current = window.setInterval(() => {
        index += 1;
        setVisibleDraft(draft.slice(0, index));

        if (index >= draft.length && draftTimerRef.current !== null) {
          window.clearInterval(draftTimerRef.current);
          draftTimerRef.current = null;
        }
      }, 26);
    }, draftStartDelayMs);

    return () => {
      if (draftStartTimerRef.current !== null) {
        window.clearTimeout(draftStartTimerRef.current);
        draftStartTimerRef.current = null;
      }

      if (draftTimerRef.current !== null) {
        window.clearInterval(draftTimerRef.current);
        draftTimerRef.current = null;
      }
    };
  }, [draft, latestAnimatedDelayMs]);

  const handleSend = () => {
    if (!draft || !onSend || isSending || !isDraftReady) {
      return;
    }

    setIsSending(true);
    pendingSentTextRef.current = draft;
    sendTimerRef.current = window.setTimeout(() => {
      sendTimerRef.current = null;
      onSend();
    }, 520);
  };

  return (
    <section className="scene-body messages-scene">
      <header className="messages-contact-bar">
        <span className="messages-contact-avatar" aria-hidden="true">
          <span className="messages-avatar-shell" />
          <span className="messages-avatar-face" />
          <span className="messages-avatar-eye eye-left" />
          <span className="messages-avatar-eye eye-right" />
        </span>
        <div className="messages-contact-copy">
          <p className="messages-contact-name">{contactName}</p>
          <p className="messages-contact-status">{contactStatus}</p>
        </div>
      </header>

      <div className="chat-thread">
        {thread.map((line) => {
          const lineState = lineStates[line.id];

          return (
            <ChatBubble
              key={line.id}
              line={line}
              delayMs={lineState?.delayMs ?? 0}
              animate={lineState?.animate ?? false}
            />
          );
        })}
        {isSending && draft && !threadHasPendingSentLine ? (
          <article
            className="chat-bubble from-player is-sending-bubble"
            aria-label="Sending message"
          >
            <p>{draft}</p>
          </article>
        ) : null}
      </div>

      {hasFooter ? (
        <footer className="messages-footer">
          {draft && onSend && !isSending ? (
            <div className="draft-row">
              <p className={`draft-preview ${!isDraftReady ? 'is-typing' : ''}`}>{visibleDraft}</p>
              <button
                className="primary-action"
                type="button"
                onClick={handleSend}
                disabled={isSending || !isDraftReady}
              >
                {sendLabel ?? 'Send'}
              </button>
            </div>
          ) : null}

          {footerActionLabel && onFooterAction ? (
            <button className="primary-action" type="button" onClick={onFooterAction}>
              {footerActionLabel}
            </button>
          ) : null}
        </footer>
      ) : null}
    </section>
  );
}
