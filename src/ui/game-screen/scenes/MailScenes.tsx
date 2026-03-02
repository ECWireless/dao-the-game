type MailTone = 'panic' | 'fail' | 'success';

type MailSceneProps = {
  tone: MailTone;
  from: string;
  subject: string;
  body: string[];
  draft?: string;
  sendLabel?: string;
  onSend?: () => void;
  isPrimaryActionDisabled?: boolean;
  actionLabel?: string;
  onAction?: () => void;
};

type MailInboxStoryItem = {
  sender: string;
  subject: string;
  preview: string;
  timestamp: string;
  onOpen: () => void;
};

type MailInboxSceneProps = {
  storyItem?: MailInboxStoryItem;
};

type InboxItem = {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  timestamp: string;
  starred?: boolean;
  unread?: boolean;
  onOpen?: () => void;
};

const INBOX_ITEMS: InboxItem[] = [
  {
    id: 'coupon',
    sender: 'Snack Orbit',
    subject: 'You left artisanal gummies in your cart',
    preview: 'The algorithm is worried about you and has escalated to coupons.',
    timestamp: '8:12'
  },
  {
    id: 'landlord',
    sender: 'Building Portal',
    subject: 'Laundry room closed for mysterious foam event',
    preview: 'Please do not investigate. Maintenance already regrets everything.',
    timestamp: '7:48'
  },
  {
    id: 'guild',
    sender: 'RaidGuild Weekly',
    subject: 'Five invoices, one goblin, zero context',
    preview: 'This week in the server: contracts, memes, and a suspicious spreadsheet.',
    timestamp: 'Thu'
  },
  {
    id: 'game',
    sender: 'Patch Notes',
    subject: 'Balance update: raccoon class nerfed again',
    preview: 'Developers insist the trash-can build was "warping the meta."',
    timestamp: 'Wed',
    starred: true
  },
  {
    id: 'bank',
    sender: 'Copperline Credit',
    subject: 'Your account survived another week',
    preview: 'No action required. We simply wanted to make this sound dramatic.',
    timestamp: 'Tue'
  }
];

function MailIcon({ kind }: { kind: 'menu' | 'search' | 'archive' | 'delete' | 'more' | 'compose' }) {
  switch (kind) {
    case 'menu':
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M5 7.5h14M5 12h14M5 16.5h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
      );
    case 'search':
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="5.6" stroke="currentColor" strokeWidth="1.8" />
          <path d="m15.4 15.4 3.6 3.6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
      );
    case 'archive':
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M5 7.3h14v10.2a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 17.5V7.3Z" stroke="currentColor" strokeWidth="1.6" />
          <path d="M4 5.5h16v2.7H4z" fill="currentColor" />
          <path d="M9.3 12h5.4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
        </svg>
      );
    case 'delete':
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M8.2 7V5.7A1.2 1.2 0 0 1 9.4 4.5h5.2a1.2 1.2 0 0 1 1.2 1.2V7" stroke="currentColor" strokeWidth="1.6" />
          <path d="M5.5 7h13M7.6 7l.8 10.1a1.2 1.2 0 0 0 1.2 1.1h4.8a1.2 1.2 0 0 0 1.2-1.1L16.4 7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
        </svg>
      );
    case 'compose':
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="m7 16.8 1-3.9L15.8 5a1.6 1.6 0 0 1 2.2 0l1 1a1.6 1.6 0 0 1 0 2.2l-7.9 7.8L7 16.8Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
          <path d="M13.7 7.1 17 10.4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="6.8" r="1.5" fill="currentColor" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="12" cy="17.2" r="1.5" fill="currentColor" />
        </svg>
      );
  }
}

function getInitials(sender: string) {
  const parts = sender.split(/[\s,]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '?';
  const second = parts[1]?.[0] ?? '';
  return `${first}${second}`.toUpperCase();
}

function InboxRow({ item, story = false }: { item: InboxItem; story?: boolean }) {
  const content = (
    <>
      <span className={`mail-row-avatar ${story ? 'is-story' : ''}`} aria-hidden="true">
        {getInitials(item.sender)}
      </span>
      <span className="mail-row-copy">
        <span className={`mail-row-sender ${item.unread ? 'is-unread' : ''}`}>{item.sender}</span>
        <span className={`mail-row-subject ${item.unread ? 'is-unread' : ''}`}>{item.subject}</span>
        <span className="mail-row-preview">{item.preview}</span>
      </span>
      <span className="mail-row-meta">
        <span className={`mail-row-time ${item.unread ? 'is-unread' : ''}`}>{item.timestamp}</span>
        {item.starred ? <span className="mail-row-star">★</span> : null}
        {item.unread ? <span className="mail-row-dot" /> : null}
      </span>
    </>
  );

  if (item.onOpen) {
    return (
      <button className={`mail-row ${story ? 'is-story' : ''}`} type="button" onClick={item.onOpen}>
        {content}
      </button>
    );
  }

  return <article className="mail-row">{content}</article>;
}

function MailSearchHeader() {
  return (
    <header className="mail-search-header">
      <span className="mail-header-icon" aria-hidden="true">
        <MailIcon kind="menu" />
      </span>

      <div className="mail-search-pill" aria-label="Search in mail">
        <span className="mail-search-icon" aria-hidden="true">
          <MailIcon kind="search" />
        </span>
        <span>Search in mail</span>
      </div>

      <span className="mail-account-avatar" aria-hidden="true">
        E
      </span>
    </header>
  );
}

export function MailInboxScene({ storyItem }: MailInboxSceneProps) {
  const items = storyItem
    ? [
        {
          id: 'story',
          sender: storyItem.sender,
          subject: storyItem.subject,
          preview: storyItem.preview,
          timestamp: storyItem.timestamp,
          unread: true,
          onOpen: storyItem.onOpen
        },
        ...INBOX_ITEMS
      ]
    : INBOX_ITEMS;

  return (
    <section className="scene-body mail-scene mail-inbox-scene">
      <MailSearchHeader />
      <section className="mail-list" aria-label="Inbox">
        <p className="mail-list-label">Primary</p>
        {items.map((item, index) => (
          <InboxRow key={item.id} item={item} story={Boolean(storyItem) && index === 0} />
        ))}
      </section>

      <span className="mail-compose-fab" aria-hidden="true">
        <MailIcon kind="compose" />
      </span>
    </section>
  );
}

export function MailScene({
  tone,
  from,
  subject,
  body,
  draft,
  sendLabel = 'Send',
  onSend,
  isPrimaryActionDisabled = false,
  actionLabel,
  onAction
}: MailSceneProps) {
  const primaryAction =
    draft && (onSend || isPrimaryActionDisabled)
      ? { label: sendLabel, onClick: onSend, disabled: isPrimaryActionDisabled }
      : null;
  const secondaryAction = actionLabel && onAction ? { label: actionLabel, onClick: onAction } : null;

  return (
    <section className={`scene-body mail-scene mail-detail-scene tone-${tone}`}>
      <MailSearchHeader />

      <section className="mail-detail-toolbar" aria-label="Mail actions">
        <span className="mail-toolbar-icon" aria-hidden="true">
          <MailIcon kind="archive" />
        </span>
        <span className="mail-toolbar-icon" aria-hidden="true">
          <MailIcon kind="delete" />
        </span>
        <span className="mail-toolbar-icon" aria-hidden="true">
          <MailIcon kind="more" />
        </span>
      </section>

      <article className="mail-detail-card">
        <div className="mail-detail-subject-row">
          <h2>{subject}</h2>
          <span className="mail-detail-badge">Inbox</span>
        </div>

        <div className="mail-detail-from-row">
          <span className="mail-row-avatar is-story" aria-hidden="true">
            {getInitials(from)}
          </span>
          <div className="mail-detail-from-copy">
            <p className="mail-detail-from-name">{from}</p>
            <p className="mail-detail-from-meta">to me</p>
          </div>
          <p className="mail-detail-time">just now</p>
        </div>

        <div className="mail-detail-body">
          {body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>

      {primaryAction ? (
        <button
          className="mail-reply-action"
          type="button"
          disabled={primaryAction.disabled}
          onClick={primaryAction.disabled ? undefined : primaryAction.onClick}
        >
          <span className="mail-reply-label">Reply</span>
          <span className="mail-reply-copy">{draft}</span>
          <span className="mail-reply-send">{primaryAction.label}</span>
        </button>
      ) : null}

      {secondaryAction ? (
        <button className="mail-secondary-action" type="button" onClick={secondaryAction.onClick}>
          {secondaryAction.label}
        </button>
      ) : null}
    </section>
  );
}
