import type { ArtifactBundle, RunResult } from '../../../types';
import { formatCredits } from '../utils';

type MachinePreviewProps = {
  deploymentTone: 'rough' | 'polished';
  heroTitle: string;
  heroUrl: string;
  latestRun?: RunResult;
  latestArtifacts?: ArtifactBundle;
  capabilityGaps: string[];
  isReadOnly?: boolean;
  onContinue?: () => void;
};

export function MachinePreview({
  deploymentTone,
  heroTitle,
  heroUrl,
  latestRun,
  latestArtifacts,
  capabilityGaps,
  isReadOnly = false,
  onContinue
}: MachinePreviewProps) {
  const conferenceName = heroTitle
    .replace(/\s+(Autonomous Flagship|DAO Relaunch|Recovery Console)$/u, '')
    .trim();
  const speakerLineup = deploymentTone === 'rough'
    ? ['Lattice Morrow', 'Rune Mercer', 'Vale Ortega']
    : ['Lattice Morrow', 'Aya Nakamoto', 'Rune Mercer'];
  const scheduleBlocks = deploymentTone === 'rough'
    ? [
        { time: '09:00', title: 'Main Stage', detail: 'Protocol keynote and ecosystem updates' },
        { time: '13:30', title: 'Builder Block', detail: 'Fast demos, hack-floor walkthroughs' }
      ]
    : [
        { time: '09:00', title: 'Main Stage', detail: 'Protocol keynotes, treasury strategy, ecosystem state' },
        { time: '12:15', title: 'Side Events', detail: 'Founder dinners, builder lounges, token design clinics' },
        { time: '15:00', title: 'Ship Floor', detail: 'Live demos, grant pitches, client relaunch reveals' }
      ];
  const statCards = deploymentTone === 'rough'
    ? [
        { label: 'Builders', value: '1.2k' },
        { label: 'Tracks', value: '2' },
        { label: 'Side Quests', value: '6' }
      ]
    : [
        { label: 'Builders', value: '3.4k' },
        { label: 'Tracks', value: '5' },
        { label: 'Side Quests', value: '18' }
      ];

  return (
    <article className={`deployment-cassette is-ejected is-${deploymentTone}`}>
      <div className="deployment-topline">
        <div>
          <p className="deployment-kicker">Deployment cassette</p>
          <h3>Creation surfaced</h3>
        </div>
        {latestRun ? (
          <span className={`deployment-health ${latestRun.passed ? 'is-pass' : 'is-fail'}`}>
            {latestRun.passed ? 'Client-ready' : 'Needs another pass'}
          </span>
        ) : null}
      </div>

      <div className="deployment-preview-shell">
        <div className="deployment-browser">
          <span className="deployment-browser-dot" />
          <span className="deployment-browser-dot" />
          <span className="deployment-browser-dot" />
          <span className="deployment-browser-address">{heroUrl}</span>
        </div>

        <div className={`deployment-preview is-${deploymentTone}`}>
          <section className="deployment-hero">
            <p className="deployment-hero-kicker">
              {deploymentTone === 'rough' ? 'Emergency conference rebuild' : 'Web3 conference relaunch'}
            </p>
            <h4>{conferenceName}</h4>
            <p>
              {deploymentTone === 'rough'
                ? 'A real landing page exists now, but it still feels like one sharp builder shipped it alone under time pressure.'
                : 'The relaunch now feels like a polished flagship event page with a clean conference narrative.'}
            </p>
            <div className={`deployment-quality-strip ${deploymentTone === 'polished' ? 'is-polished' : ''}`}>
              {deploymentTone === 'rough' ? (
                <>
                  <span>Live draft</span>
                  <span>No QA pass</span>
                </>
              ) : (
                <>
                  <span>Design approved</span>
                  <span>QA cleared</span>
                  <span>Launch ready</span>
                </>
              )}
            </div>
            <div className="deployment-hero-meta">
              <span>Denver • May 2026</span>
              <span>Wallet-native ticketing</span>
            </div>
            <div className="deployment-hero-actions">
              <span className="is-primary">{deploymentTone === 'rough' ? 'Tickets' : 'Get Tickets'}</span>
              <span>{deploymentTone === 'rough' ? 'Speakers' : 'View Speakers'}</span>
              <span>{deploymentTone === 'rough' ? 'Schedule' : 'Side Events'}</span>
            </div>
          </section>

          <section className="deployment-stat-grid">
            {statCards.map((card) => (
              <article className="deployment-stat-card" key={card.label}>
                <p>{card.label}</p>
                <strong>{card.value}</strong>
              </article>
            ))}
          </section>

          <section className="deployment-content-grid">
            <article className="deployment-feature-card">
              <p className="deployment-section-kicker">Featured speakers</p>
              <div className="deployment-speaker-list">
                {speakerLineup.map((speaker, index) => (
                  <div className="deployment-speaker-row" key={speaker}>
                    <span className={`deployment-speaker-avatar shade-${index + 1}`} aria-hidden="true" />
                    <div>
                      <strong>{speaker}</strong>
                      <span>{index === 0 ? 'Protocol strategy' : index === 1 ? 'Ecosystem growth' : 'Build systems'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="deployment-feature-card">
              <p className="deployment-section-kicker">Event schedule</p>
              <div className="deployment-schedule-list">
                {scheduleBlocks.map((block) => (
                  <div className="deployment-schedule-row" key={`${block.time}-${block.title}`}>
                    <span>{block.time}</span>
                    <div>
                      <strong>{block.title}</strong>
                      <p>{block.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="deployment-utility-row">
            <article className="deployment-panel is-primary">
              <p>Launch quality</p>
              <strong>{latestRun ? `Quality ${latestRun.qualityScore}` : 'Awaiting run'}</strong>
            </article>
            <article className="deployment-panel">
              <p>Ops confidence</p>
              <strong>{latestRun ? (latestRun.passed ? 'Stable' : 'Shaky') : 'Offline'}</strong>
            </article>
            <article className="deployment-panel">
              <p>Client path</p>
              <strong>{latestArtifacts?.ensName ?? 'No domain yet'}</strong>
            </article>
          </section>

          <section className="deployment-footer-band">
            <div className="deployment-tag-row">
              <span>Builder floor</span>
              <span>Tokenized access</span>
              <span>Live demos</span>
            </div>
            {capabilityGaps.length > 0 ? (
              <div className="deployment-gaps" aria-label="Missing passes">
                {capabilityGaps.map((gap) => (
                  <span key={gap}>{gap}</span>
                ))}
              </div>
            ) : null}
          </section>
        </div>
      </div>

      {latestRun ? (
        <div className="deployment-metrics">
          <p>
            Cost <strong>{formatCredits(latestRun.cost)}</strong>
          </p>
          <p>
            Quality <strong>{latestRun.qualityScore}</strong>
          </p>
          <p>{latestRun.events[latestRun.events.length - 1]}</p>
        </div>
      ) : null}

      {!isReadOnly && onContinue ? (
        <button className="primary-action machine-submit-button" type="button" onClick={onContinue}>
          Submit to Client
        </button>
      ) : null}
    </article>
  );
}
