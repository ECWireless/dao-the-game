import { useEffect, useState } from 'react';
import type { ArtifactBundle, RunResult } from '../../../types';
import { buildDeploymentReadout } from '../deploymentReadout';
import { formatCredits } from '../utils';

const DEPLOYMENT_PROFILE_LABELS = {
  premium: 'Premium launch',
  flashy: 'Flashy launch',
  stable: 'Stable launch',
  messy: 'Messy launch',
  failed: 'Failed launch'
} as const;

type FactoryPreviewProps = {
  deploymentTone: 'rough' | 'polished';
  heroTitle: string;
  heroUrl: string;
  cycle?: 1 | 2;
  latestRun?: RunResult;
  latestArtifacts?: ArtifactBundle;
  previousRun?: RunResult;
  generationError?: string | null;
  capabilityGaps: string[];
  isReadOnly?: boolean;
  onRetryGeneration?: () => void | Promise<void>;
  isRetryingGeneration?: boolean;
  onContinue?: () => void;
};

export function FactoryPreview({
  deploymentTone,
  heroTitle,
  heroUrl,
  cycle = 1,
  latestRun,
  latestArtifacts,
  previousRun,
  generationError = null,
  capabilityGaps,
  isReadOnly = false,
  onRetryGeneration,
  isRetryingGeneration = false,
  onContinue
}: FactoryPreviewProps) {
  const [isFrameLoading, setIsFrameLoading] = useState(false);
  const previewUrl = latestArtifacts?.previewUrl;
  const iframeSrc = latestArtifacts?.siteDocument ? undefined : previewUrl;
  const iframeSrcDoc = latestArtifacts?.siteDocument;
  const hasDeployPreview = Boolean(iframeSrc || iframeSrcDoc);
  const latestEvent = latestRun?.events.at(-1);
  const openLabel = latestArtifacts?.previewUrl ? 'Open deployed site' : null;
  const deploymentProfile = latestRun?.evaluation;
  const deploymentReadout = buildDeploymentReadout({
    currentRun: latestRun,
    currentArtifact: latestArtifacts,
    previousRun: cycle === 2 ? previousRun : undefined
  });

  useEffect(() => {
    setIsFrameLoading(hasDeployPreview);
  }, [hasDeployPreview, iframeSrc, iframeSrcDoc]);

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
          {previewUrl && openLabel ? (
            <a className="deployment-browser-link" href={previewUrl} target="_blank" rel="noreferrer">
              {openLabel}
            </a>
          ) : null}
        </div>

        <div className="deployment-frame-shell">
          {hasDeployPreview ? (
            <>
              <iframe
                className="deployment-frame"
                src={iframeSrc}
                srcDoc={iframeSrcDoc}
                sandbox=""
                title={`${heroTitle} deploy preview`}
                loading="lazy"
                onLoad={() => setIsFrameLoading(false)}
              />
              {isFrameLoading ? (
                <div className="deployment-frame-loading" aria-hidden="true">
                  <span />
                  <p>Loading preview</p>
                </div>
              ) : null}
            </>
          ) : generationError ? (
            <div className="deployment-frame deployment-frame-placeholder">
              <p>Artifact generation failed</p>
              <strong>{generationError}</strong>
              {!isReadOnly && onRetryGeneration ? (
                <button
                  className="secondary-action factory-submit-button"
                  type="button"
                  onClick={() => void onRetryGeneration()}
                  disabled={isRetryingGeneration}
                >
                  {isRetryingGeneration ? 'Retrying...' : 'Retry generation'}
                </button>
              ) : null}
            </div>
          ) : (
            <div className="deployment-frame deployment-frame-placeholder">
              <p>Deploy preview pending</p>
              <strong>Run this cycle to assemble a site.</strong>
            </div>
          )}
        </div>
      </div>

      {latestArtifacts ? (
        <div className="deployment-artifact-grid">
          <article className="deployment-artifact-card">
            <p>Deployed URL</p>
            <strong>{latestArtifacts.publicUrl ?? heroUrl}</strong>
          </article>
        </div>
      ) : null}

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

      {deploymentProfile ? (
        <div className="deployment-profile">
          <p className="deployment-profile-copy">
            Profile{' '}
            <strong>{DEPLOYMENT_PROFILE_LABELS[deploymentProfile.profileTag]}</strong>
          </p>
          <p className="deployment-profile-copy">{deploymentProfile.headline}</p>
        </div>
      ) : null}

      {deploymentReadout ? (
        <div className="deployment-report">
          <p className="deployment-report-kicker">Assembly report</p>
          <p>{deploymentReadout.leadLine}</p>
          <p>{deploymentReadout.cautionLine}</p>
          {deploymentReadout.comparison ? (
            <div className="deployment-comparison">
              <p>{deploymentReadout.comparison.headline}</p>
              <p>{deploymentReadout.comparison.deltaLine}</p>
              <p>{deploymentReadout.comparison.coverageLine}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {latestArtifacts?.notes?.length ? (
        <div className="deployment-notes">
          {latestArtifacts.notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </div>
      ) : null}

      {!isReadOnly && onContinue && latestArtifacts ? (
        <button className="primary-action factory-submit-button" type="button" onClick={onContinue}>
          Submit to Client
        </button>
      ) : null}
    </article>
  );
}
