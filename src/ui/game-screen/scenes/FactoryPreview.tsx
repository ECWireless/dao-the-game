import { useEffect, useState } from 'react';
import type { ArtifactBundle, RunResult } from '../../../types';
import { buildDeploymentReadout } from '../deploymentReadout';
import { formatUsdc } from '../utils';

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
  recoveryStatus?: 'pending' | 'failed' | null;
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
  recoveryStatus = null,
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
  const paymentSummary = latestArtifacts?.paymentSummary;

  useEffect(() => {
    setIsFrameLoading(hasDeployPreview);
  }, [hasDeployPreview, iframeSrc, iframeSrcDoc]);

  return (
    <article className={`deployment-cassette is-ejected is-${deploymentTone}`}>
      <div className="deployment-topline">
        <div className="deployment-title-block">
          <p className="deployment-kicker">Deployment cassette</p>
          <h3>{heroTitle}</h3>
        </div>
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
              <p>{recoveryStatus === 'pending' ? 'Assembly interrupted' : 'Assembly failed'}</p>
              <strong>{generationError}</strong>
              {!isReadOnly && onRetryGeneration ? (
                <button
                  className="secondary-action factory-submit-button"
                  type="button"
                  onClick={() => void onRetryGeneration()}
                  disabled={isRetryingGeneration}
                >
                  {isRetryingGeneration
                    ? 'Retrying...'
                    : recoveryStatus === 'pending'
                      ? 'Re-run assembly'
                      : 'Retry assembly'}
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
          {paymentSummary ? (
            <>
              <article className="deployment-artifact-card">
                <p>Worker payments</p>
                <strong>{formatUsdc(paymentSummary.totalPaid)}</strong>
              </article>
              <article className="deployment-artifact-card">
                <p>Would have paid</p>
                <strong>{formatUsdc(paymentSummary.wouldHavePaid)}</strong>
              </article>
            </>
          ) : null}
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
            Spend <strong>{formatUsdc(latestRun.cost)}</strong>
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

      {paymentSummary ? (
        <div className="deployment-report">
          <p className="deployment-report-kicker">Worker payment summary</p>
          <p>
            {paymentSummary.paidStageCount > 0
              ? `Factory cleared ${formatUsdc(paymentSummary.totalPaid)} on ${paymentSummary.chainName} via ${paymentSummary.protocol} for ${paymentSummary.paidStageCount} paid stage${paymentSummary.paidStageCount === 1 ? '' : 's'}.`
              : `Factory did not clear any paid external stages on this run.`}
          </p>
          <p>
            {paymentSummary.fallbackStageCount > 0
              ? `${paymentSummary.fallbackStageCount} paid stage${paymentSummary.fallbackStageCount === 1 ? '' : 's'} rerouted to free demo workers.`
              : `All non-paid stages stayed free.`}
          </p>
          <div className="deployment-payment-list">
            {paymentSummary.stages.map((stage) => (
              <div key={`${stage.stageId}-${stage.plannedWorkerName}`} className="deployment-payment-row">
                <span>{stage.stageLabel}</span>
                <strong>
                  {stage.status === 'fallback-free'
                    ? `${stage.plannedWorkerName} -> ${stage.executedWorkerName}`
                    : stage.executedWorkerName}
                  {' • '}
                  {stage.status === 'paid'
                    ? formatUsdc(stage.amount)
                    : stage.kind === 'paid-external'
                      ? `Free fallback (would have been ${formatUsdc(stage.amount)})`
                      : 'Free'}
                </strong>
                <p>{stage.note}</p>
              </div>
            ))}
          </div>
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
