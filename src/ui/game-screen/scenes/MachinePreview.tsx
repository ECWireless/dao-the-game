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

function getFallbackPreviewUrl(deploymentTone: 'rough' | 'polished'): string {
  return deploymentTone === 'rough'
    ? '/deployments/cycle-one/index.html'
    : '/deployments/cycle-two/index.html';
}

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
  const previewUrl = latestArtifacts?.previewUrl ?? getFallbackPreviewUrl(deploymentTone);
  const latestEvent = latestRun?.events[latestRun.events.length - 1];
  const openLabel = deploymentTone === 'rough' ? 'Open draft deploy' : 'Open launch build';

  return (
    <article className={`deployment-cassette is-ejected is-${deploymentTone}`}>
      <div className="deployment-topline">
        <div>
          <p className="deployment-kicker">Deployment cassette</p>
          <h3>{heroTitle}</h3>
        </div>
        {latestRun ? (
          <span className={`deployment-health ${latestRun.passed ? 'is-pass' : 'is-fail'}`}>
            {latestRun.passed ? 'Ready to Submit' : 'Needs Internal Fixes'}
          </span>
        ) : null}
      </div>

      <div className="deployment-preview-shell">
        <div className="deployment-browser">
          <span className="deployment-browser-dot" />
          <span className="deployment-browser-dot" />
          <span className="deployment-browser-dot" />
          <span className="deployment-browser-address">{heroUrl}</span>
          <a className="deployment-browser-link" href={previewUrl} target="_blank" rel="noreferrer">
            {openLabel}
          </a>
        </div>

        <div className="deployment-frame-shell">
          <iframe
            className="deployment-frame"
            src={previewUrl}
            title={`${heroTitle} deploy preview`}
            loading="lazy"
          />
        </div>
      </div>

      <div className="deployment-artifact-grid">
        <article className="deployment-artifact-card">
          <p>Deployed URL</p>
          <strong>{latestArtifacts?.publicUrl ?? heroUrl}</strong>
        </article>
        <article className="deployment-artifact-card">
          <p>ENS Route</p>
          <strong>{latestArtifacts?.ensName ?? 'pending-route.eth'}</strong>
        </article>
        <article className="deployment-artifact-card">
          <p>Content ID</p>
          <strong>{latestArtifacts?.cid ?? 'pending-upload'}</strong>
        </article>
      </div>

      {capabilityGaps.length > 0 ? (
        <div className="deployment-gaps" aria-label="Missing passes">
          {capabilityGaps.map((gap) => (
            <span key={gap}>{gap}</span>
          ))}
        </div>
      ) : null}

      {latestRun ? (
        <div className="deployment-metrics">
          <p>
            Cost <strong>{formatCredits(latestRun.cost)}</strong>
          </p>
          <p>
            Quality <strong>{latestRun.qualityScore}</strong>
          </p>
          <p>{latestEvent}</p>
        </div>
      ) : null}

      {latestArtifacts?.notes?.length ? (
        <div className="deployment-notes">
          {latestArtifacts.notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
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
