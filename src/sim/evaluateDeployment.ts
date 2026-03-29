import type {
  Worker,
  ArtifactType,
  DeploymentContribution,
  DeploymentEvaluation,
  DeploymentMetricId,
  DeploymentMetrics,
  DeploymentProfileTag,
  DeploymentSynergyNote,
  PipelineStageId,
  RunPipeline,
  RunState
} from '../types';
import { clamp } from './rng';

type TeamAssignment = {
  stageId: PipelineStageId;
  roleId?: string;
  roleName?: string;
  agent: Worker;
  stageScore: number;
};

const DEPLOYMENT_METRIC_IDS: DeploymentMetricId[] = [
  'visualIdentity',
  'launchStability',
  'communityHype',
  'trust'
];

export const DEPLOYMENT_METRIC_LABELS: Record<DeploymentMetricId, string> = {
  visualIdentity: 'Visual identity',
  launchStability: 'Launch stability',
  communityHype: 'Community hype',
  trust: 'Trust'
};

const ARTIFACT_METRIC_WEIGHTS: Record<ArtifactType, Record<DeploymentMetricId, number>> = {
  'conference-site': {
    visualIdentity: 0.28,
    launchStability: 0.31,
    communityHype: 0.17,
    trust: 0.24
  }
};

const VISUAL_KEYWORDS = [
  'visual',
  'graphic',
  'identity',
  'design',
  'motif',
  'aesthetic',
  'brand',
  'generative',
  'memorable',
  'spectacle'
];

const OPERATIONS_KEYWORDS = [
  'checklist',
  'instrumentation',
  'telemetry',
  'rollback',
  'release',
  'ops',
  'deploy',
  'hardening',
  'monitoring',
  'repro'
];

const COMMUNITY_KEYWORDS = [
  'community',
  'narrative',
  'momentum',
  'launch',
  'people',
  'coordination',
  'hype',
  'scene',
  'empathy'
];

const SYSTEMS_KEYWORDS = [
  'system',
  'architecture',
  'scaffold',
  'constraint',
  'utility',
  'parameter',
  'build',
  'technical',
  'framework',
  'tradeoff'
];

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getBlueprintText(agent: Worker): string {
  return [
    agent.name,
    agent.specialty,
    agent.roleAffinity,
    ...agent.traits,
    agent.styleProfile.signature,
    agent.styleProfile.execution,
    agent.styleProfile.collaboration,
    agent.bio
  ]
    .join(' ')
    .toLowerCase();
}

function getKeywordSignal(agent: Worker, keywords: string[]): number {
  const text = getBlueprintText(agent);
  const matches = keywords.filter((keyword) => text.includes(keyword)).length;

  return clamp(18 + matches * 12, 0, 100);
}

function getAgentMetricScore(agent: Worker, metricId: DeploymentMetricId): number {
  const visualSignal = getKeywordSignal(agent, VISUAL_KEYWORDS);
  const operationsSignal = getKeywordSignal(agent, OPERATIONS_KEYWORDS);
  const communitySignal = getKeywordSignal(agent, COMMUNITY_KEYWORDS);
  const systemsSignal = getKeywordSignal(agent, SYSTEMS_KEYWORDS);

  switch (metricId) {
    case 'visualIdentity':
      return clamp(
        Math.round(
          agent.capabilityVector.design * 0.48 +
            agent.capabilityVector.implementation * 0.1 +
            agent.temperament.teamwork * 0.08 +
            visualSignal * 0.24 +
            communitySignal * 0.1
        ),
        0,
        100
      );
    case 'launchStability':
      return clamp(
        Math.round(
          agent.capabilityVector.implementation * 0.2 +
            agent.capabilityVector.review * 0.18 +
            agent.capabilityVector.deployment * 0.24 +
            agent.temperament.resilience * 0.24 +
            agent.temperament.teamwork * 0.06 +
            operationsSignal * 0.08
        ),
        0,
        100
      );
    case 'communityHype':
      return clamp(
        Math.round(
          agent.capabilityVector.design * 0.22 +
            agent.capabilityVector.deployment * 0.12 +
            agent.temperament.pace * 0.18 +
            agent.temperament.teamwork * 0.12 +
            visualSignal * 0.16 +
            communitySignal * 0.2
        ),
        0,
        100
      );
    case 'trust':
    default:
      return clamp(
        Math.round(
          agent.capabilityVector.review * 0.24 +
            agent.capabilityVector.deployment * 0.14 +
            agent.temperament.resilience * 0.24 +
            agent.temperament.teamwork * 0.14 +
            operationsSignal * 0.1 +
            systemsSignal * 0.14
        ),
        0,
        100
      );
  }
}

function buildStageMap(pipeline: RunPipeline): Record<PipelineStageId, number> {
  return pipeline.stages.reduce(
    (map, stage) => ({
      ...map,
      [stage.id]: stage.score
    }),
    {
      design: 0,
      implementation: 0,
      review: 0,
      deployment: 0
    } satisfies Record<PipelineStageId, number>
  );
}

function getAssignments(state: RunState, pipeline: RunPipeline): TeamAssignment[] {
  const agentById = new Map(state.workers.map((agent) => [agent.id, agent]));

  const assignments: TeamAssignment[] = [];

  for (const stage of pipeline.stages) {
    const agent = stage.assignedWorkerId ? agentById.get(stage.assignedWorkerId) : undefined;

    if (!agent) {
      continue;
    }

    assignments.push({
      stageId: stage.id,
      roleId: stage.roleId,
      roleName: stage.roleName,
      agent,
      stageScore: stage.score
    });
  }

  return assignments;
}

function getStageWeightedMetricBase(
  metricId: DeploymentMetricId,
  stageScores: Record<PipelineStageId, number>
): number {
  switch (metricId) {
    case 'visualIdentity':
      return stageScores.design * 0.72 + stageScores.implementation * 0.28;
    case 'launchStability':
      return (
        stageScores.implementation * 0.32 +
        stageScores.review * 0.28 +
        stageScores.deployment * 0.4
      );
    case 'communityHype':
      return (
        stageScores.design * 0.54 +
        stageScores.implementation * 0.16 +
        stageScores.deployment * 0.3
      );
    case 'trust':
    default:
      return (
        stageScores.implementation * 0.18 +
        stageScores.review * 0.48 +
        stageScores.deployment * 0.34
      );
  }
}

function getMetricReason(agent: Worker, metricId: DeploymentMetricId): string {
  switch (metricId) {
    case 'visualIdentity':
      return agent.styleProfile.signature.toLowerCase();
    case 'launchStability':
      return agent.styleProfile.execution.toLowerCase();
    case 'communityHype':
      return agent.styleProfile.collaboration.toLowerCase();
    case 'trust':
    default:
      return agent.traits[0]?.toLowerCase() ?? agent.specialty.toLowerCase();
  }
}

function getMetricIdsSorted(metrics: DeploymentMetrics): DeploymentMetricId[] {
  return [...DEPLOYMENT_METRIC_IDS].sort((left, right) => metrics[right] - metrics[left]);
}

function buildProfileHeadline(profileTag: DeploymentProfileTag): string {
  switch (profileTag) {
    case 'premium':
      return 'The team produced a premium launch profile with strong discipline end-to-end.';
    case 'flashy':
      return 'The team can generate buzz fast, but the launch still reads volatile.';
    case 'stable':
      return 'The team produced a stable launch profile with calm operational footing.';
    case 'failed':
      return 'The current team profile points toward a failed launch.';
    case 'messy':
    default:
      return 'The team produced an uneven launch profile with visible tradeoffs.';
  }
}

function deriveProfileTag(
  metrics: DeploymentMetrics,
  pipeline: RunPipeline,
  artifactType: ArtifactType
): DeploymentProfileTag {
  const weightedAverage = DEPLOYMENT_METRIC_IDS.reduce(
    (sum, metricId) => sum + metrics[metricId] * ARTIFACT_METRIC_WEIGHTS[artifactType][metricId],
    0
  );
  const lowestMetric = Math.min(...DEPLOYMENT_METRIC_IDS.map((metricId) => metrics[metricId]));

  if (
    weightedAverage < 48 ||
    pipeline.missingStageCount >= 2 ||
    metrics.launchStability < 42 ||
    metrics.trust < 42
  ) {
    return 'failed';
  }

  if (weightedAverage >= 78 && lowestMetric >= 64) {
    return 'premium';
  }

  if (
    metrics.visualIdentity >= 78 &&
    metrics.communityHype >= 72 &&
    (metrics.launchStability < 66 || metrics.trust < 62)
  ) {
    return 'flashy';
  }

  if (metrics.launchStability >= 74 && metrics.trust >= 72) {
    return 'stable';
  }

  return 'messy';
}

function pushMetricDelta(
  deltas: DeploymentMetrics,
  metricId: DeploymentMetricId,
  delta: number
) {
  deltas[metricId] += delta;
}

function applySynergyRules(
  assignments: TeamAssignment[],
  metricScoresByAgent: Map<string, DeploymentMetrics>
): { deltas: DeploymentMetrics; notes: DeploymentSynergyNote[] } {
  const deltas: DeploymentMetrics = {
    visualIdentity: 0,
    launchStability: 0,
    communityHype: 0,
    trust: 0
  };
  const notes: DeploymentSynergyNote[] = [];
  const designLead = assignments.find((assignment) => assignment.stageId === 'design');
  const implementationLead = assignments.find((assignment) => assignment.stageId === 'implementation');
  const reviewLead = assignments.find((assignment) => assignment.stageId === 'review');
  const deploymentLead = assignments.find((assignment) => assignment.stageId === 'deployment');
  const volatileLead = assignments.find(
    (assignment) =>
      assignment.agent.temperament.pace >= 75 && assignment.agent.temperament.resilience < 55
  );
  const overreachingLead = assignments.find((assignment) =>
    assignment.agent.traits.some((trait) =>
      ['overreach', 'overcomplicate', 'needs guardrails', 'can drift'].some((keyword) =>
        trait.toLowerCase().includes(keyword)
      )
    )
  );

  if (
    reviewLead &&
    deploymentLead &&
    reviewLead.agent.temperament.resilience >= 75 &&
    deploymentLead.agent.temperament.resilience >= 75
  ) {
    pushMetricDelta(deltas, 'launchStability', 6);
    pushMetricDelta(deltas, 'trust', 8);
    notes.push({
      type: 'synergy',
      metricId: 'trust',
      impact: 8,
      relatedWorkerIds: [reviewLead.agent.id, deploymentLead.agent.id],
      summary: `${reviewLead.agent.name} and ${deploymentLead.agent.name} hardened the release edge-to-edge.`
    });
  }

  if (
    designLead &&
    implementationLead &&
    designLead.agent.capabilityVector.design >= 80 &&
    implementationLead.agent.capabilityVector.implementation >= 80 &&
    average([designLead.agent.temperament.teamwork, implementationLead.agent.temperament.teamwork]) >= 65
  ) {
    pushMetricDelta(deltas, 'visualIdentity', 7);
    pushMetricDelta(deltas, 'launchStability', 4);
    notes.push({
      type: 'synergy',
      metricId: 'visualIdentity',
      impact: 7,
      relatedWorkerIds: [designLead.agent.id, implementationLead.agent.id],
      summary: `${designLead.agent.name} and ${implementationLead.agent.name} kept the concept-to-build handoff unusually clean.`
    });
  }

  if (
    deploymentLead &&
    assignments.some(
      (assignment) => (metricScoresByAgent.get(assignment.agent.id)?.communityHype ?? 0) >= 72
    )
  ) {
    const hypeLead =
      [...assignments].sort(
        (left, right) =>
          (metricScoresByAgent.get(right.agent.id)?.communityHype ?? 0) -
          (metricScoresByAgent.get(left.agent.id)?.communityHype ?? 0)
      )[0] ?? deploymentLead;

    if (hypeLead.agent.id !== deploymentLead.agent.id || hypeLead.agent.temperament.teamwork >= 70) {
      pushMetricDelta(deltas, 'communityHype', 6);
      notes.push({
        type: 'synergy',
        metricId: 'communityHype',
        impact: 6,
        relatedWorkerIds: [hypeLead.agent.id, deploymentLead.agent.id],
        summary: `${hypeLead.agent.name} gave the launch momentum while ${deploymentLead.agent.name} kept the rollout intact.`
      });
    }
  }

  if (volatileLead && (!reviewLead || reviewLead.agent.capabilityVector.review < 70)) {
    pushMetricDelta(deltas, 'trust', -8);
    pushMetricDelta(deltas, 'launchStability', -5);
    notes.push({
      type: 'tension',
      metricId: 'trust',
      impact: -8,
      relatedWorkerIds: [volatileLead.agent.id],
      summary: `${volatileLead.agent.name} raised the ceiling, but the team lacked enough guardrails to make that feel safe.`
    });
  }

  if (overreachingLead && (!reviewLead || reviewLead.stageScore < 70)) {
    pushMetricDelta(deltas, 'launchStability', -6);
    notes.push({
      type: 'tension',
      metricId: 'launchStability',
      impact: -6,
      relatedWorkerIds: [overreachingLead.agent.id],
      summary: `${overreachingLead.agent.name} pushed the system harder than the current review layer could comfortably absorb.`
    });
  }

  return { deltas, notes };
}

function buildContributions(
  assignments: TeamAssignment[],
  metricScoresByAgent: Map<string, DeploymentMetrics>,
  weakestMetricId: DeploymentMetricId
): DeploymentContribution[] {
  const contributions: DeploymentContribution[] = [];

  for (const metricId of DEPLOYMENT_METRIC_IDS) {
    const ranked = [...assignments].sort(
      (left, right) =>
        (metricScoresByAgent.get(right.agent.id)?.[metricId] ?? 0) -
        (metricScoresByAgent.get(left.agent.id)?.[metricId] ?? 0)
    );
    const leader = ranked[0];

    if (!leader) {
      continue;
    }

    const leaderScore = metricScoresByAgent.get(leader.agent.id)?.[metricId] ?? 0;
    contributions.push({
      workerId: leader.agent.id,
      workerName: leader.agent.name,
      metricId,
      impact: Math.max(3, Math.round((leaderScore - 50) * 0.25)),
      summary: `${leader.agent.name} lifted ${DEPLOYMENT_METRIC_LABELS[metricId].toLowerCase()} through ${getMetricReason(
        leader.agent,
        metricId
      )}`
    });
  }

  const weakestRanked = [...assignments].sort(
    (left, right) =>
      (metricScoresByAgent.get(left.agent.id)?.[weakestMetricId] ?? 0) -
      (metricScoresByAgent.get(right.agent.id)?.[weakestMetricId] ?? 0)
  );
  const laggingAgent = weakestRanked[0];
  const laggingScore = laggingAgent
    ? metricScoresByAgent.get(laggingAgent.agent.id)?.[weakestMetricId] ?? 0
    : undefined;

  if (laggingAgent && laggingScore !== undefined && laggingScore < 52) {
    contributions.push({
      workerId: laggingAgent.agent.id,
      workerName: laggingAgent.agent.name,
      metricId: weakestMetricId,
      impact: -Math.max(3, Math.round((52 - laggingScore) * 0.3)),
      summary: `${laggingAgent.agent.name} left ${DEPLOYMENT_METRIC_LABELS[
        weakestMetricId
      ].toLowerCase()} exposed under this lineup.`
    });
  }

  return contributions
    .sort((left, right) => Math.abs(right.impact) - Math.abs(left.impact))
    .slice(0, 6);
}

export function evaluateDeployment(state: RunState, pipeline: RunPipeline): DeploymentEvaluation {
  const artifactType = state.brief.artifactType;
  const stageScores = buildStageMap(pipeline);
  const assignments = getAssignments(state, pipeline);
  const metricScoresByAgent = new Map<string, DeploymentMetrics>(
    assignments.map((assignment) => [
      assignment.agent.id,
      {
        visualIdentity: getAgentMetricScore(assignment.agent, 'visualIdentity'),
        launchStability: getAgentMetricScore(assignment.agent, 'launchStability'),
        communityHype: getAgentMetricScore(assignment.agent, 'communityHype'),
        trust: getAgentMetricScore(assignment.agent, 'trust')
      }
    ])
  );

  const baseMetrics = DEPLOYMENT_METRIC_IDS.reduce(
    (result, metricId) => {
      const teamBase = average(
        assignments.map((assignment) => metricScoresByAgent.get(assignment.agent.id)?.[metricId] ?? 0)
      );
      const stageBase = getStageWeightedMetricBase(metricId, stageScores);

      result[metricId] = clamp(Math.round(stageBase * 0.58 + teamBase * 0.42), 0, 100);
      return result;
    },
    {
      visualIdentity: 0,
      launchStability: 0,
      communityHype: 0,
      trust: 0
    } satisfies DeploymentMetrics
  );

  const { deltas, notes } = applySynergyRules(assignments, metricScoresByAgent);
  const metrics: DeploymentMetrics = DEPLOYMENT_METRIC_IDS.reduce(
    (result, metricId) => {
      result[metricId] = clamp(baseMetrics[metricId] + deltas[metricId], 0, 100);
      return result;
    },
    {
      visualIdentity: 0,
      launchStability: 0,
      communityHype: 0,
      trust: 0
    } satisfies DeploymentMetrics
  );

  const [strongestMetricId, weakestMetricId] = (() => {
    const ordered = getMetricIdsSorted(metrics);
    return [ordered[0] ?? 'visualIdentity', ordered.at(-1) ?? 'trust'] as const;
  })();
  const profileTag = deriveProfileTag(metrics, pipeline, artifactType);
  const contributions = buildContributions(assignments, metricScoresByAgent, weakestMetricId);

  return {
    artifactType,
    profileTag,
    headline: buildProfileHeadline(profileTag),
    strongestMetricId,
    weakestMetricId,
    metrics,
    contributions,
    synergies: notes
  };
}
