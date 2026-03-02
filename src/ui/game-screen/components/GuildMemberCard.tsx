import type { Agent } from '../../../types';
import { GuildMemberAvatar } from './GuildMemberAvatar';
import { type GuildMemberProfile } from '../guildData';
import { formatCredits } from '../utils';

export function GuildMemberCard({
  member,
  agent,
  onClose
}: {
  member: GuildMemberProfile;
  agent?: Agent;
  onClose: () => void;
}) {
  return (
    <div className="guild-member-scrim">
      <section className="guild-member-card" aria-label={`${member.name} profile`}>
        <button className="guild-member-close" type="button" onClick={onClose}>
          Done
        </button>
        <GuildMemberAvatar member={member} />
        <p className="guild-member-name">{member.name}</p>
        <p className="guild-member-handle">@{member.handle}</p>
        <p className="guild-member-title">{member.title}</p>

        {agent ? (
          <div className="guild-stats">
            <div className="guild-stat-row">
              <span>Affinity</span>
              <strong>{agent.roleAffinity}</strong>
            </div>
            <div className="guild-stat-row">
              <span>Creativity</span>
              <strong>{agent.creativity}</strong>
            </div>
            <div className="guild-stat-row">
              <span>Reliability</span>
              <strong>{agent.reliability}</strong>
            </div>
            <div className="guild-stat-row">
              <span>Speed</span>
              <strong>{agent.speed}</strong>
            </div>
            <div className="guild-stat-row">
              <span>Cost</span>
              <strong>{formatCredits(agent.cost)}</strong>
            </div>
          </div>
        ) : (
          <p className="guild-member-note">Guild regular. Mostly here to keep the server weird.</p>
        )}
      </section>
    </div>
  );
}
