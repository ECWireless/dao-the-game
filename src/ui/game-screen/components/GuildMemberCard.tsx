import type { Worker } from '../../../types';
import { GuildMemberAvatar } from './GuildMemberAvatar';
import { type GuildMemberProfile } from '../guildData';
import { formatUsdc } from '../utils';
import { getWorkerLicenseCost } from '../../../workers/catalog';

export function GuildMemberCard({
  member,
  worker,
  onClose
}: {
  member: GuildMemberProfile;
  worker?: Worker;
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
        {worker ? (
          <p className="guild-member-focus">{member.roleTagLabel ?? 'Registered worker'}</p>
        ) : null}

        {worker ? (
          <>
            <div className="guild-stats">
              <div className="guild-stat-row">
                <span>Per request</span>
                <strong>{formatUsdc(getWorkerLicenseCost(worker))}</strong>
              </div>
            </div>
            <p className="guild-member-note">{member.shortPitch ?? worker.shortPitch}</p>
            <p className="guild-member-note">{member.bio ?? worker.bio}</p>
          </>
        ) : (
          <p className="guild-member-note">Guild regular. Mostly here to keep the server weird.</p>
        )}
      </section>
    </div>
  );
}
