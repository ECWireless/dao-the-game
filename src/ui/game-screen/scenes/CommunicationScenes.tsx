import type { ChatLine } from '../types';

type MessagesSceneProps = {
  thread: ChatLine[];
  draft?: string;
  sendLabel?: string;
  onSend?: () => void;
  footerActionLabel?: string;
  onFooterAction?: () => void;
  showNotification?: boolean;
};

type MailSceneProps = {
  from: string;
  subject: string;
  body: string[];
  draft?: string;
  sendLabel?: string;
  onSend?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  tone: 'panic' | 'fail' | 'success';
};

function ChatBubble({ line, order }: { line: ChatLine; order: number }) {
  return (
    <article
      className={`chat-bubble from-${line.author}`}
      style={{ animationDelay: `${order * 95}ms` }}
      aria-label={`${line.author} message`}
    >
      <p>{line.text}</p>
    </article>
  );
}

export function MessagesScene({
  thread,
  draft,
  sendLabel,
  onSend,
  footerActionLabel,
  onFooterAction,
  showNotification
}: MessagesSceneProps) {
  return (
    <section className="scene-body messages-scene">
      <div className="chat-thread">
        {thread.map((line, index) => (
          <ChatBubble key={line.id} line={line} order={index} />
        ))}
      </div>

      {showNotification ? (
        <aside className="notification-drop" role="status">
          New Email: "URGENT REBRAND REQUEST"
        </aside>
      ) : null}

      {draft && onSend ? (
        <div className="draft-row">
          <p className="draft-preview">{draft}</p>
          <button className="primary-action" type="button" onClick={onSend}>
            {sendLabel ?? 'Send'}
          </button>
        </div>
      ) : null}

      {footerActionLabel && onFooterAction ? (
        <button className="primary-action" type="button" onClick={onFooterAction}>
          {footerActionLabel}
        </button>
      ) : null}
    </section>
  );
}

export function MailScene({
  from,
  subject,
  body,
  draft,
  sendLabel,
  onSend,
  actionLabel,
  onAction,
  tone
}: MailSceneProps) {
  return (
    <section className="scene-body mail-scene">
      <article className={`mail-card tone-${tone}`}>
        <p className="eyebrow">From: {from}</p>
        <h2>{subject}</h2>
        <div className="mail-copy">
          {body.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </article>

      {draft && onSend ? (
        <div className="draft-row">
          <p className="draft-preview">{draft}</p>
          <button className="primary-action" type="button" onClick={onSend}>
            {sendLabel ?? 'Send Reply'}
          </button>
        </div>
      ) : null}

      {actionLabel && onAction ? (
        <button className="primary-action" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}
