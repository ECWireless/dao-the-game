import { useQuery } from '@tanstack/react-query';
import type { WorkerRegistryDetailResponse } from '../../../contracts/workers';
import { getApi } from '../../../lib/api';
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
  const shouldFetchLiveProfile =
    Boolean(worker?.registration.erc8004Id) &&
    Boolean(worker?.registryRecordId) &&
    !worker?.registryRecordId.startsWith('builtin-');

  const workerDetailQuery = useQuery({
    queryKey: ['worker-detail', worker?.registryRecordId],
    enabled: shouldFetchLiveProfile,
    queryFn: async () =>
      getApi<WorkerRegistryDetailResponse>(`/api/workers/${worker!.registryRecordId}`)
  });

  const liveProfile = workerDetailQuery.data?.worker.live?.profile;
  const processBullets = liveProfile?.summary.processBullets ?? [];
  const isProfileLoading = shouldFetchLiveProfile && workerDetailQuery.isLoading;

  return (
    <div className="guild-member-scrim">
      <section
        className="guild-member-card"
        aria-label={`${member.name} profile`}
        aria-busy={isProfileLoading}
      >
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
            {isProfileLoading ? (
              <div className="guild-member-loading" aria-live="polite">
                <p className="guild-member-note">Pulling worker dossier...</p>
                <div className="guild-member-skeleton guild-member-skeleton-short" />
                <div className="guild-member-skeleton guild-member-skeleton-long" />
                <div className="guild-member-skeleton guild-member-skeleton-medium" />
              </div>
            ) : (
              <>
                <p className="guild-member-note">
                  {liveProfile?.summary.oneLiner ?? member.shortPitch ?? worker.shortPitch}
                </p>
                <p className="guild-member-note">
                  {liveProfile?.summary.bestFit ?? member.bio ?? worker.bio}
                </p>
                {processBullets.length ? (
                  <div className="guild-member-note">
                    <strong>Process</strong>
                    <ul>
                      {processBullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {liveProfile?.summary.avoid ? (
                  <p className="guild-member-note">
                    <strong>Avoid</strong> {liveProfile.summary.avoid}
                  </p>
                ) : null}
              </>
            )}
          </>
        ) : (
          <p className="guild-member-note">Guild regular. Mostly here to keep the server weird.</p>
        )}
      </section>
    </div>
  );
}
