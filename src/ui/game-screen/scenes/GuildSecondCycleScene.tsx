import { useEffect, useMemo, useRef, useState } from 'react';
import type { Agent, HatRole } from '../../../types';
import fullLogo from '../../../assets/raidguild-full.svg';
import { GuildMemberAvatar } from '../components/GuildMemberAvatar';
import { GuildMemberCard } from '../components/GuildMemberCard';
import {
  getRaidGuildCandidates,
  getRaidGuildCandidatesForRole,
  getRaidGuildRoster,
  RAIDGUILD_CHANNELS,
  RAIDGUILD_HISTORY,
  type GuildMemberProfile
} from '../guildData';
import { formatCredits } from '../utils';
type GuildSecondCycleSceneProps = {
  studioName?: string;
  roles: HatRole[];
  agents: Agent[];
  onContinue?: () => void;
  continueDisabled?: boolean;
  isReadOnly?: boolean;
};
type RoleSequence = {
  role: HatRole;
  brief: string;
  bullets: string[];
  replies: string[];
  candidates: GuildMemberProfile[];
};
function buildRoleBrief(roleName: string) {
  if (roleName.includes('Design')) {
    return {
      brief:
        'Need a fast design pass that makes the conference feel intentional instead of barely surviving.',
      bullets: ['Visual hierarchy', 'Clear event branding', 'Still works under deadline'],
      replies: [
        'I can fix the visual pass. Better hierarchy, cleaner hero, less panic showing through.',
        'I can sharpen the brand layer and keep the dev handoff sane.'
      ]
    };
  }
  if (roleName.includes('Review')) {
    return {
      brief: 'Need a ruthless QA sweep before this goes back in front of the client.',
      bullets: ['Phone checks', 'Broken state sweep', 'Embarrassment prevention'],
      replies: [
        'I can sweep the whole build and find the weird breakage before it reaches the client.',
        'I do launch triage. I can smoke-test this fast and leave clean notes.'
      ]
    };
  }
  if (roleName.includes('Deploy')) {
    return {
      brief: 'Need a release closer who can harden the handoff and keep the rollout calm.',
      bullets: ['Launch checklist', 'Stable rollout', 'Clean handoff'],
      replies: [
        'I can take release hardening and keep the handoff clean.',
        'I can own the deploy edge-cases and get it over the line.'
      ]
    };
  }
  return {
    brief: 'Need another fast specialist to tighten the next branch before the resubmission.',
    bullets: ['Fast turnaround', 'Clean handoff', 'Client-safe revision'],
    replies: [
      `I can take ${roleName.toLowerCase()}.`,
      `I can cover ${roleName.toLowerCase()} and keep it moving.`
    ]
  };
}
export function GuildSecondCycleScene({
  studioName,
  roles,
  agents,
  onContinue,
  continueDisabled = false,
  isReadOnly = false
}: GuildSecondCycleSceneProps) {
  const roster = useMemo(() => getRaidGuildRoster(agents), [agents]);
  const firstCycleCandidates = useMemo(() => getRaidGuildCandidates(agents, 2), [agents]);
  const roleSequences = useMemo<RoleSequence[]>(
    () =>
      roles.map((role) => {
        const details = buildRoleBrief(role.name);
        return {
          role,
          brief: details.brief,
          bullets: details.bullets,
          replies: details.replies,
          candidates: getRaidGuildCandidatesForRole(agents, role.id, 2)
        };
      }),
    [agents, roles]
  );
  const totalSequenceEvents = roleSequences.length * 3;
  const [visibleEventCount, setVisibleEventCount] = useState(isReadOnly ? totalSequenceEvents : 0);
  const [postingRoleIndex, setPostingRoleIndex] = useState<number | null>(null);
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);
  const feedRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (isReadOnly) {
      setVisibleEventCount(totalSequenceEvents);
      setPostingRoleIndex(null);
    }
  }, [isReadOnly, totalSequenceEvents]);
  useEffect(() => {
    if (postingRoleIndex === null || isReadOnly) {
      return;
    }
    const baseCount = postingRoleIndex * 3;
    setVisibleEventCount(baseCount);
    const postTimer = window.setTimeout(() => {
      setVisibleEventCount(baseCount + 1);
    }, 260);
    const firstReplyTimer = window.setTimeout(() => {
      setVisibleEventCount(baseCount + 2);
    }, 1500);
    const secondReplyTimer = window.setTimeout(() => {
      setVisibleEventCount(baseCount + 3);
      setPostingRoleIndex(null);
    }, 2850);
    return () => {
      window.clearTimeout(postTimer);
      window.clearTimeout(firstReplyTimer);
      window.clearTimeout(secondReplyTimer);
    };
  }, [isReadOnly, postingRoleIndex]);
  useEffect(() => {
    if (!feedRef.current) {
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
  }, [visibleEventCount]);
  const visibleRoleBoundary = Math.floor(visibleEventCount / 3);
  const canPostNextRole =
    !isReadOnly &&
    postingRoleIndex === null &&
    visibleEventCount < totalSequenceEvents &&
    visibleEventCount % 3 === 0;
  const nextRoleIndex = canPostNextRole ? visibleRoleBoundary : -1;
  const nextRole = nextRoleIndex >= 0 ? roleSequences[nextRoleIndex] : undefined;
  const allResponsesVisible = totalSequenceEvents > 0 && visibleEventCount >= totalSequenceEvents;
  const showSendToBoard = allResponsesVisible && !continueDisabled && Boolean(onContinue);
  const studioLabel = studioName || 'Unnamed Studio';
  const studioGlyph = studioLabel.trim().charAt(0).toUpperCase() || 'S';
  const datePreview = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date()
  );
  const visibleChannels = RAIDGUILD_CHANNELS.filter((channel) => channel !== '#hiring-board');
  const quartermaster = roster.find((member) => member.id === 'quartermaster-nyx');
  const openMember =
    roster.find((member) => member.id === openMemberId) ??
    roleSequences
      .flatMap((sequence) => sequence.candidates)
      .find((member) => member.id === openMemberId);
  const openAgent = openMember?.agentId
    ? agents.find((agent) => agent.id === openMember.agentId)
    : undefined;
  const handleStartPosting = () => {
    if (!canPostNextRole || nextRoleIndex < 0) {
      return;
    }
    setPostingRoleIndex(nextRoleIndex);
  };
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
            <path
              d="m15.2 15.2 3.5 3.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.8"
            />
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
              <button
                className="guild-avatar-button"
                type="button"
                onClick={() => setOpenMemberId(member.id)}
              >
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
        <article className="guild-feed-entry is-self-post">
          <span className="guild-poster-avatar" aria-hidden="true">
            {studioGlyph}
          </span>
          <div className="guild-feed-copy">
            <p className="guild-feed-name">
              {studioLabel}
              <span>earlier</span>
            </p>
            <div className="guild-brief-embed">
              <p className="guild-brief-kicker">Role Brief</p>
              <h2>Web Developer</h2>
              <p>Need someone to rebuild a conference site fast, clean, and production-safe.</p>
              <ul>
                <li>Responsive front-end build</li>
                <li>Clear visual implementation</li>
                <li>Fast turnaround</li>
              </ul>
            </div>
          </div>
        </article>
        {firstCycleCandidates.map((candidate, index) => {
          const agent = candidate.agentId
            ? agents.find((item) => item.id === candidate.agentId)
            : undefined;
          if (!agent) {
            return null;
          }
          const replyText =
            index === 0
              ? 'I can handle the site build. Fast pass, clean UI, no drama.'
              : 'I can take this too. Frontend polish, deploy handoff, done.';
          return (
            <article key={`first-cycle-${candidate.id}`} className="guild-feed-entry is-candidate">
              <button
                className="guild-avatar-button"
                type="button"
                onClick={() => setOpenMemberId(candidate.id)}
              >
                <GuildMemberAvatar member={candidate} />
              </button>
              <div className="guild-feed-copy">
                <p className="guild-feed-name">
                  {candidate.name}
                  <span>@{candidate.handle}</span>
                </p>
                <p className="guild-feed-submeta">
                  {candidate.title} • rel {agent.reliability} • cost {formatCredits(agent.cost)}
                </p>
                <p className="guild-feed-text">{replyText}</p>
              </div>
            </article>
          );
        })}
        {roleSequences.length > 0 ? (
          <div className="guild-date-divider">
            <span>{datePreview}</span>
          </div>
        ) : null}
        {quartermaster && roleSequences.length > 0 ? (
          <article className="guild-feed-entry">
            <button
              className="guild-avatar-button"
              type="button"
              onClick={() => setOpenMemberId(quartermaster.id)}
            >
              <GuildMemberAvatar member={quartermaster} />
            </button>
            <div className="guild-feed-copy">
              <p className="guild-feed-name">
                {quartermaster.name}
                <span>@{quartermaster.handle}</span>
              </p>
              <p className="guild-feed-text">any other work need filling?</p>
            </div>
          </article>
        ) : null}
        {roleSequences.map((sequence, roleIndex) => {
          const baseCount = roleIndex * 3;
          const showPost = visibleEventCount > baseCount;
          const showFirstReply = visibleEventCount > baseCount + 1;
          const showSecondReply = visibleEventCount > baseCount + 2;
          const isPostEntering = !isReadOnly && visibleEventCount === baseCount + 1;
          const isFirstReplyEntering = !isReadOnly && visibleEventCount === baseCount + 2;
          const isSecondReplyEntering = !isReadOnly && visibleEventCount === baseCount + 3;
          if (!showPost) {
            return null;
          }
          return (
            <div key={sequence.role.id} className="guild-sequence-block">
              <article
                className={`guild-feed-entry is-self-post ${isPostEntering ? 'is-entering' : ''}`}
              >
                <span className="guild-poster-avatar" aria-hidden="true">
                  {studioGlyph}
                </span>
                <div className="guild-feed-copy">
                  <p className="guild-feed-name">
                    {studioLabel}
                    <span>new opening</span>
                  </p>
                  <div className="guild-brief-embed">
                    <p className="guild-brief-kicker">Role Brief</p>
                    <h2>{sequence.role.name}</h2>
                    <p>{sequence.brief}</p>
                    <ul>
                      {sequence.bullets.map((bullet) => (
                        <li key={`${sequence.role.id}-${bullet}`}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
              {sequence.candidates.map((candidate, candidateIndex) => {
                const agent = candidate.agentId
                  ? agents.find((item) => item.id === candidate.agentId)
                  : undefined;
                if (!agent) {
                  return null;
                }
                if (
                  (candidateIndex === 0 && !showFirstReply) ||
                  (candidateIndex === 1 && !showSecondReply)
                ) {
                  return null;
                }
                const isEntering =
                  candidateIndex === 0 ? isFirstReplyEntering : isSecondReplyEntering;
                return (
                  <article
                    key={`${sequence.role.id}-${candidate.id}`}
                    className={`guild-feed-entry is-candidate ${isEntering ? 'is-entering' : ''}`}
                  >
                    <button
                      className="guild-avatar-button"
                      type="button"
                      onClick={() => setOpenMemberId(candidate.id)}
                    >
                      <GuildMemberAvatar member={candidate} />
                    </button>
                    <div className="guild-feed-copy">
                      <p className="guild-feed-name">
                        {candidate.name}
                        <span>@{candidate.handle}</span>
                      </p>
                      <p className="guild-feed-submeta">
                        {candidate.title} • rel {agent.reliability} • cost{' '}
                        {formatCredits(agent.cost)}
                      </p>
                      <p className="guild-feed-text">
                        {sequence.replies[candidateIndex] ?? sequence.replies[0]}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          );
        })}
        {!isReadOnly && !allResponsesVisible && postingRoleIndex === null && nextRole ? (
          <article className="guild-draft-hint">
            <p>Your `{nextRole.role.name}` brief is queued in the composer.</p>
          </article>
        ) : null}
      </div>
      <footer className="guild-composer">
        <button className="guild-compose-button" type="button" disabled aria-label="Add attachment">
          +
        </button>
        <div
          className={`guild-compose-field ${canPostNextRole || postingRoleIndex !== null || showSendToBoard ? 'is-filled' : ''}`}
        >
          <span>
            {showSendToBoard
              ? 'Designer and QA applicants are ready to import back into the board.'
              : postingRoleIndex !== null
                ? `Posting ${roleSequences[postingRoleIndex]?.role.name ?? 'brief'} to #hiring-board...`
                : nextRole
                  ? `${nextRole.role.name} brief ready to post`
                  : 'Message #hiring-board'}
          </span>
        </div>
        {!isReadOnly && canPostNextRole ? (
          <button className="guild-send-button" type="button" onClick={handleStartPosting}>
            Post
          </button>
        ) : showSendToBoard ? (
          <button className="guild-send-button is-sync" type="button" onClick={onContinue}>
            Send to Board
          </button>
        ) : (
          <button
            className="guild-compose-button is-muted"
            type="button"
            disabled
            aria-label="Voice message"
          >
            •
          </button>
        )}
      </footer>
      {openMember ? (
        <GuildMemberCard
          member={openMember}
          agent={openAgent}
          onClose={() => setOpenMemberId(null)}
        />
      ) : null}
    </section>
  );
}
