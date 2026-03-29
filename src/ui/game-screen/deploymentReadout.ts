import { getPipelineStageDefinition } from '../../pipeline';
import type { ArtifactBundle, DeploymentMetricId, RunResult } from '../../types';

const METRIC_LABELS: Record<DeploymentMetricId, string> = {
  visualIdentity: 'visual identity',
  launchStability: 'launch stability',
  communityHype: 'community hype',
  trust: 'trust'
};

const PROFILE_LABELS: Record<ArtifactBundle['profileTag'], string> = {
  premium: 'premium',
  flashy: 'flashy',
  stable: 'stable',
  messy: 'messy',
  failed: 'failed'
};

export type DeploymentReadout = {
  leadLine: string;
  cautionLine: string;
  comparison?: {
    headline: string;
    deltaLine: string;
    coverageLine: string;
  };
};

function formatMetricDelta(metricId: DeploymentMetricId, delta: number): string {
  const sign = delta > 0 ? '+' : '';
  return `${METRIC_LABELS[metricId]} ${sign}${delta}`;
}

function buildCoverageLine(previousRun: RunResult, currentRun: RunResult): string {
  const previousCovered = previousRun.pipeline?.coveredStageCount ?? 0;
  const currentCovered = currentRun.pipeline?.coveredStageCount ?? 0;

  if (currentCovered > previousCovered) {
    return `Coverage expanded from ${previousCovered} passes to ${currentCovered}.`;
  }

  const strongestStage = currentRun.pipeline?.strongestStageId;

  if (!strongestStage) {
    return 'The second pass reads more intentional end-to-end.';
  }

  return `${getPipelineStageDefinition(strongestStage).shortLabel} became the clearest point of leverage.`;
}

export function buildDeploymentReadout({
  currentRun,
  currentArtifact,
  previousRun
}: {
  currentRun?: RunResult;
  currentArtifact?: ArtifactBundle;
  previousRun?: RunResult;
}): DeploymentReadout | null {
  if (!currentRun || !currentArtifact || !currentRun.evaluation) {
    return null;
  }

  const topContribution = [...currentRun.evaluation.contributions].sort(
    (left, right) => right.impact - left.impact
  )[0];
  const topSynergy = [...currentRun.evaluation.synergies].sort(
    (left, right) => Math.abs(right.impact) - Math.abs(left.impact)
  )[0];
  const weakestStageId = currentRun.pipeline?.weakestStageId;
  const leadLine = topContribution
    ? `${topContribution.workerName} pushed ${METRIC_LABELS[topContribution.metricId]} hardest: ${topContribution.summary}`
    : `${currentArtifact.siteTitle} resolved as a ${PROFILE_LABELS[currentArtifact.profileTag]} launch.`;
  const cautionLine = topSynergy
    ? topSynergy.summary
    : weakestStageId
      ? `${getPipelineStageDefinition(weakestStageId).shortLabel} remains the softest pass in the chain.`
      : currentRun.events.at(-1) ?? 'The launch still carries tradeoffs.';

  if (!previousRun?.evaluation) {
    return { leadLine, cautionLine };
  }

  const deltas = (
    Object.keys(currentRun.evaluation.metrics) as DeploymentMetricId[]
  ).map((metricId) => ({
    metricId,
    delta: currentRun.evaluation!.metrics[metricId] - previousRun.evaluation!.metrics[metricId]
  }));
  const topDelta = [...deltas].sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta))[0];
  const headline =
    previousRun.evaluation.profileTag !== currentRun.evaluation.profileTag
      ? `Cycle 2 moved the org from ${PROFILE_LABELS[previousRun.evaluation.profileTag]} to ${PROFILE_LABELS[currentRun.evaluation.profileTag]}.`
      : `Cycle 2 reinforced the ${PROFILE_LABELS[currentRun.evaluation.profileTag]} profile instead of repeating cycle 1.`;

  return {
    leadLine,
    cautionLine,
    comparison: {
      headline,
      deltaLine: topDelta
        ? `Biggest shift: ${formatMetricDelta(topDelta.metricId, topDelta.delta)}.`
        : 'The second pass held roughly the same balance.',
      coverageLine: buildCoverageLine(previousRun, currentRun)
    }
  };
}
