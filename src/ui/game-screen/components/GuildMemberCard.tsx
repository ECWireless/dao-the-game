import type { Agent } from '../../../types';
import { GuildMemberAvatar } from './GuildMemberAvatar';
import { type GuildMemberProfile } from '../guildData';
import { formatCredits } from '../utils';
import { getWorkerCapabilitySummary } from '../../../workers/catalog';

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
          <>
            <div className="guild-stats">
              <div className="guild-stat-row">
                <span>Archetype</span>
                <strong>{agent.archetype}</strong>
              </div>
              <div className="guild-stat-row">
                <span>Affinity</span>
                <strong>{member.roleAffinity ?? agent.roleAffinity}</strong>
              </div>
              <div className="guild-stat-row">
                <span>Capabilities</span>
                <strong>{getWorkerCapabilitySummary(agent)}</strong>
              </div>
              <div className="guild-stat-row">
                <span>Temperament</span>
                <strong>{agent.temperament.profile}</strong>
              </div>
              <div className="guild-stat-row">
                <span>Style</span>
                <strong>{agent.styleProfile.signature}</strong>
              </div>
              <div className="guild-stat-row">
                <span>Traits</span>
                <strong>{agent.traits.join(' • ')}</strong>
              </div>
              <div className="guild-stat-row">
                <span>Contract</span>
                <strong>{formatCredits(agent.contractCost)}</strong>
              </div>
            </div>
            <p className="guild-member-note">{agent.bio}</p>
          </>
        ) : (
          <p className="guild-member-note">Guild regular. Mostly here to keep the server weird.</p>
        )}
      </section>
    </div>
  );
}
