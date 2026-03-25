import { useEffect, useMemo, useRef, useState } from 'react';
import type { Agent, HatRole } from '../../../types';
import fullLogo from '../../../assets/raidguild-full.svg';
import { GuildMemberAvatar } from '../components/GuildMemberAvatar';
import { GuildMemberCard } from '../components/GuildMemberCard';
import { getRaidGuildCandidates, getRaidGuildRoster, RAIDGUILD_CHANNELS, RAIDGUILD_HISTORY } from '../guildData';
import { GuildSecondCycleScene } from './GuildSecondCycleScene';

type AssignmentLogEntry = {
  id: string;
  message: string;
};

export type GuildSceneProps = {
  studioName?: string;
  roles: HatRole[];
  agents: Agent[];
  assignmentLog: AssignmentLogEntry[];
  onAssign?: (roleId: string, agentId: string) => void;
  onContinue?: () => void;
  continueDisabled?: boolean;
  isReadOnly?: boolean;
};

function FirstCycleGuildScene({ studioName, roles, agents, onContinue, isReadOnly = false }: GuildSceneProps) {
  const role = roles[0];
  const roster = useMemo(() => getRaidGuildRoster(agents), [agents]);
  const candidates = useMemo(() => getRaidGuildCandidates(agents, 2), [agents]);
  const [postStage, setPostStage] = useState(isReadOnly ? 3 : 0);
  const [isPostingSequenceActive, setIsPostingSequenceActive] = useState(false);
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);
  const feedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isReadOnly) {
      setPostStage(3);
      setIsPostingSequenceActive(false);
    }
  }, [isReadOnly]);

  useEffect(() => {
    if (!isPostingSequenceActive || isReadOnly) {
      return;
    }

    setPostStage(0);

    const postTimer = window.setTimeout(() => {
      setPostStage(1);
    }, 260);
    const firstReplyTimer = window.setTimeout(() => {
      setPostStage(2);
    }, 1500);
    const secondReplyTimer = window.setTimeout(() => {
      setPostStage(3);
      setIsPostingSequenceActive(false);
    }, 2800);

    return () => {
      window.clearTimeout(postTimer);
      window.clearTimeout(firstReplyTimer);
      window.clearTimeout(secondReplyTimer);
    };
  }, [isPostingSequenceActive, isReadOnly]);

  useEffect(() => {
    if (isReadOnly || postStage < 1 || !feedRef.current) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      feedRef.current?.scrollTo({
        top: feedRef.current.scrollHeight,
        behavior: 'smooth'
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [isReadOnly, postStage]);

  const datePreview = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date());
  const visibleChannels = RAIDGUILD_CHANNELS.filter((channel) => channel !== '#hiring-board');
  const openMember = roster.find((member) => member.id === openMemberId);
  const openAgent = openMember?.agentId ? agents.find((agent) => agent.id === openMember.agentId) : undefined;
  const studioLabel = studioName || 'Unnamed Studio';
  const studioGlyph = studioLabel.trim().charAt(0).toUpperCase() || 'S';
  const hasPosted = postStage >= 1;
  const firstReplyVisible = postStage >= 2;
  const secondReplyVisible = postStage >= 3;
  const isSequencePending = isPostingSequenceActive && postStage === 0;
  const showSyncAction = secondReplyVisible && Boolean(onContinue);

  return (
    <section className="scene-body guild-discord-scene">
      <header className="guild-mobile-topbar">
        <div className="guild-topbar-copy">
          <span className="guild-channel-hash" aria-hidden="true">
            #
          </span>
          <div>
            <p className="guild-topbar-channel">hiring-board</p>
            <p className="guild-topbar-server">RaidGuild</p>
          </div>
        </div>
        <button className="guild-toolbar-button" type="button" disabled aria-label="Search channel">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="5.4" stroke="currentColor" strokeWidth="1.8" />
            <path d="m15.2 15.2 3.5 3.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          </svg>
        </button>
      </header>

      <div className="guild-feed" aria-label="RaidGuild channel" ref={feedRef}>
        <article className="guild-system-card">
          <img src={fullLogo} alt="RaidGuild" className="guild-wordmark" />
          <p className="guild-system-title">Server channels</p>
          <p className="guild-system-text">{visibleChannels.join(' • ')}</p>
        </article>

        {RAIDGUILD_HISTORY.map((entry) => {
          const member = roster.find((item) => item.id === entry.memberId);

          if (!member) {
            return null;
          }

          return (
            <article key={entry.id} className="guild-feed-entry">
              <button className="guild-avatar-button" type="button" onClick={() => setOpenMemberId(member.id)}>
                <GuildMemberAvatar member={member} />
              </button>
              <div className="guild-feed-copy">
                <p className="guild-feed-name">
                  {member.name}
                  <span>@{member.handle}</span>
                </p>
                <p className="guild-feed-text">{entry.text}</p>
              </div>
            </article>
          );
        })}

        <div className="guild-date-divider">
          <span>{datePreview}</span>
        </div>

        {hasPosted ? (
          <>
            <article className={`guild-feed-entry is-self-post ${!isReadOnly && postStage === 1 ? 'is-entering' : ''}`}>
              <span className="guild-poster-avatar" aria-hidden="true">
                {studioGlyph}
              </span>
              <div className="guild-feed-copy">
                <p className="guild-feed-name">
                  {studioLabel}
                  <span>today at 8:50 AM</span>
                </p>
                <div className="guild-brief-embed">
                  <p className="guild-brief-kicker">Role Brief</p>
                  <h2>{role.name}</h2>
                  <p>Need someone to rebuild a conference site fast, clean, and production-safe.</p>
                  <ul>
                    <li>Responsive front-end build</li>
                    <li>Clear visual implementation</li>
                    <li>Fast turnaround</li>
                  </ul>
                </div>
              </div>
            </article>

            {candidates.map((candidate, index) => {
              if ((index === 0 && !firstReplyVisible) || (index === 1 && !secondReplyVisible)) {
                return null;
              }

              return (
                <article
                  key={candidate.id}
                  className={`guild-feed-entry is-candidate ${!isReadOnly && postStage === index + 2 ? 'is-entering' : ''}`}
                >
                  <button className="guild-avatar-button" type="button" onClick={() => setOpenMemberId(candidate.id)}>
                    <GuildMemberAvatar member={candidate} />
                  </button>
                  <div className="guild-feed-copy">
                    <p className="guild-feed-name">
                      {candidate.name}
                      <span>@{candidate.handle}</span>
                    </p>
                    <p className="guild-feed-text">{candidate.shortPitch}</p>
                  </div>
                </article>
              );
            })}
          </>
        ) : (
          <article className="guild-draft-hint">
            <p>Your `Frontend Engineer` brief is queued in the composer.</p>
          </article>
        )}
      </div>

      <footer className="guild-composer">
        <button className="guild-compose-button" type="button" disabled aria-label="Add attachment">
          +
        </button>
        <div className={`guild-compose-field ${!hasPosted || isSequencePending ? 'is-filled' : ''}`}>
          <span>
            {!hasPosted && !isSequencePending
              ? 'Frontend Engineer brief ready to post'
              : isSequencePending
                ? 'Posting to #hiring-board...'
                : 'Message #hiring-board'}
          </span>
        </div>
        {!isReadOnly ? (
          !hasPosted ? (
            <button
              className="guild-send-button"
              type="button"
              disabled={isPostingSequenceActive}
              onClick={() => setIsPostingSequenceActive(true)}
            >
              {isPostingSequenceActive ? 'Posting' : 'Post'}
            </button>
          ) : showSyncAction ? (
            <button className="guild-send-button is-sync" type="button" onClick={onContinue}>
              Send to Board
            </button>
          ) : (
            <button className="guild-compose-button is-muted" type="button" disabled aria-label="Voice message">
              •
            </button>
          )
        ) : (
          <button className="guild-compose-button is-muted" type="button" disabled aria-label="Voice message">
            •
          </button>
        )}
      </footer>

      {openMember ? <GuildMemberCard member={openMember} agent={openAgent} onClose={() => setOpenMemberId(null)} /> : null}
    </section>
  );
}

export function GuildScene(props: GuildSceneProps) {
  if (props.roles.length !== 1) {
    return <GuildSecondCycleScene {...props} />;
  }

  return <FirstCycleGuildScene {...props} />;
}
