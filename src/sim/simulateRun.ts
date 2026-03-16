import { PIPELINE_STAGE_ORDER, getPipelineStageDefinition, inferPipelineStageId } from '../pipeline';
import type {
  Agent,
  PipelineStageId,
  PipelineStageResult,
  PipelineStageStatus,
  RunPipeline,
  RunResult,
  RunState
} from '../types';
import { evaluateDeployment } from './evaluateDeployment';
import { clamp, createRng, hashSeedParts } from './rng';

type EventTemplate = {
  label: string;
  qualityDelta: number;
  costDelta: number;
  stageId: PipelineStageId;
};

type StageWeights = {
  capability: number;
  pace: number;
  resilience: number;
  teamwork: number;
  qualityMultiplier: number;
  missingDelta: number;
  affinityKeywords: string[];
};

const EVENT_TABLE: EventTemplate[] = [
  {
    label: 'Prompt drift in the design handoff',
    qualityDelta: -10,
    costDelta: 10,
    stageId: 'design'
  },
  {
    label: 'Scope swell during implementation',
    qualityDelta: -6,
    costDelta: 14,
    stageId: 'implementation'
  },
  {
    label: 'Review pass caught a brittle edge case',
    qualityDelta: 4,
    costDelta: 2,
    stageId: 'review'
  },
  {
    label: 'Reusable component breakthrough',
    qualityDelta: 9,
    costDelta: -4,
    stageId: 'implementation'
  },
  {
    label: 'Ops relay cache hit',
    qualityDelta: 6,
    costDelta: -2,
    stageId: 'deployment'
  }
];

const BASE_OPERATIONAL_COST = 36;

const STAGE_OPERATION_COST: Record<PipelineStageId, number> = {
  design: 8,
  implementation: 12,
  review: 6,
  deployment: 10
};

const STAGE_WEIGHTS: Record<PipelineStageId, StageWeights> = {
  design: {
    capability: 0.6,
    pace: 0.08,
    resilience: 0.12,
    teamwork: 0.2,
    qualityMultiplier: 0.3,
    missingDelta: -10,
    affinityKeywords: ['design', 'brand', 'strategy', 'content']
  },
  implementation: {
    capability: 0.58,
    pace: 0.24,
    resilience: 0.12,
    teamwork: 0.06,
    qualityMultiplier: 0.33,
    missingDelta: -12,
    affinityKeywords: ['frontend', 'build', 'engineer', 'architect']
  },
  review: {
    capability: 0.56,
    pace: 0.04,
    resilience: 0.26,
    teamwork: 0.14,
    qualityMultiplier: 0.28,
    missingDelta: -9,
    affinityKeywords: ['qa', 'review', 'tester', 'verifier']
  },
  deployment: {
    capability: 0.56,
    pace: 0.2,
    resilience: 0.18,
    teamwork: 0.06,
    qualityMultiplier: 0.3,
    missingDelta: -11,
    affinityKeywords: ['deploy', 'release', 'operations', 'ops']
  }
};

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildPseudoCid(seed: number): string {
  const rng = createRng(seed);
  const alphabet = 'abcdefghijklmnopqrstuvwxyz234567';
  let cid = 'bafy';

  for (let i = 0; i < 24; i += 1) {
    cid += alphabet[Math.floor(rng.next() * alphabet.length)];
  }

  return cid;
}

function getAssignedAgents(state: RunState): Agent[] {
  const byId = new Map(state.agents.map((agent) => [agent.id, agent]));

  return state.roles
    .map((role) => (role.assignedAgentId ? byId.get(role.assignedAgentId) : undefined))
    .filter((agent): agent is Agent => Boolean(agent));
}

function rollRunEvent(rng: ReturnType<typeof createRng>, resilience: number) {
  const roll = rng.next();
  const template = EVENT_TABLE[Math.floor(roll * EVENT_TABLE.length)] ?? EVENT_TABLE[0];
  const variance = Math.max(2, Math.round((100 - resilience) / 10));
  const jitter = rng.int(-variance, variance);

  return {
    ...template,
    label: `${template.label} (${template.qualityDelta + jitter >= 0 ? '+' : ''}${template.qualityDelta + jitter} quality)`,
    qualityDelta: template.qualityDelta + jitter,
    costDelta: Math.max(0, template.costDelta + Math.max(0, jitter)),
    variance
  };
}

function getStageStatus(score: number, hasCoverage: boolean): PipelineStageStatus {
  if (!hasCoverage || score < 38) {
    return 'blocked';
  }

  if (score >= 78) {
    return 'strong';
  }

  if (score >= 60) {
    return 'steady';
  }

  return 'strained';
}

function buildStageNote(
  stageId: PipelineStageId,
  status: PipelineStageStatus,
  roleName?: string
): string {
  const { shortLabel } = getPipelineStageDefinition(stageId);
  const passName = shortLabel.toLowerCase();

  if (!roleName) {
    return `No ${passName} owner was routed through the machine.`;
  }

  switch (status) {
    case 'strong':
      return `${roleName} carried the ${passName} pass cleanly.`;
    case 'steady':
      return `${roleName} kept the ${passName} pass moving.`;
    case 'strained':
      return `${roleName} cleared the ${passName} pass with visible friction.`;
    case 'blocked':
    default:
      return `${roleName} could not stabilize the ${passName} pass.`;
  }
}

function getStageSeverityRank(status: PipelineStageStatus): number {
  switch (status) {
    case 'blocked':
      return 0;
    case 'strained':
      return 1;
    case 'steady':
      return 2;
    case 'strong':
    default:
      return 3;
  }
}

function compareStagesByWeakness(left: PipelineStageResult, right: PipelineStageResult): number {
  const severityDelta = getStageSeverityRank(left.status) - getStageSeverityRank(right.status);

  if (severityDelta !== 0) {
    return severityDelta;
  }

  const coverageDelta = Number(Boolean(left.assignedAgentId)) - Number(Boolean(right.assignedAgentId));

  if (coverageDelta !== 0) {
    return coverageDelta;
  }

  return left.score - right.score;
}

function compareStagesByStrength(left: PipelineStageResult, right: PipelineStageResult): number {
  return compareStagesByWeakness(right, left);
}

function getRoleByStage(state: RunState): Map<PipelineStageId, RunState['roles'][number]> {
  const roleByStage = new Map<PipelineStageId, RunState['roles'][number]>();

  for (const role of state.roles) {
    const stageId = inferPipelineStageId(role);

    if (!stageId || roleByStage.has(stageId)) {
      continue;
    }

    roleByStage.set(stageId, role);
  }

  return roleByStage;
}

function getDuplicateStageIds(state: RunState): PipelineStageId[] {
  const seen = new Set<PipelineStageId>();
  const duplicates = new Set<PipelineStageId>();

  for (const role of state.roles) {
    const stageId = inferPipelineStageId(role);

    if (!stageId) {
      continue;
    }

    if (seen.has(stageId)) {
      duplicates.add(stageId);
      continue;
    }

    seen.add(stageId);
  }

  return [...duplicates];
}

function matchesStageAffinity(agent: Agent, stageId: PipelineStageId): boolean {
  const affinity = agent.roleAffinity.toLowerCase();

  return STAGE_WEIGHTS[stageId].affinityKeywords.some((keyword) => affinity.includes(keyword));
}

function buildStageResult(
  stageId: PipelineStageId,
  role: RunState['roles'][number] | undefined,
  agent: Agent | undefined,
  event: ReturnType<typeof rollRunEvent>
): PipelineStageResult {
  const definition = getPipelineStageDefinition(stageId);
  const tuning = STAGE_WEIGHTS[stageId];
  const eventLabel = event.stageId === stageId ? event.label : undefined;
  const eventScoreAdjustment = eventLabel ? event.qualityDelta * 2 : 0;

  if (!role || !agent) {
    const score = clamp(18 + eventScoreAdjustment, 0, 100);

    return {
      id: stageId,
      label: definition.label,
      roleId: role?.id,
      roleName: role?.name,
      assignedAgentId: role?.assignedAgentId,
      score,
      qualityDelta: tuning.missingDelta,
      cost: STAGE_OPERATION_COST[stageId] + (role ? 2 : 0) + (eventLabel ? event.costDelta : 0),
      status: getStageStatus(score, false),
      note: buildStageNote(stageId, 'blocked'),
      eventLabel
    };
  }

  const composite =
    agent.capabilityVector[stageId] * tuning.capability +
    agent.temperament.pace * tuning.pace +
    agent.temperament.resilience * tuning.resilience +
    agent.temperament.teamwork * tuning.teamwork;
  const affinityBonus = matchesStageAffinity(agent, stageId) ? 6 : 0;
  const resilienceDrag =
    agent.temperament.resilience < 50
      ? Math.round((50 - agent.temperament.resilience) * 0.16)
      : 0;
  const rawScore = clamp(Math.round(composite + affinityBonus - resilienceDrag), 0, 100);
  const displayScore = clamp(rawScore + eventScoreAdjustment, 0, 100);
  const status = getStageStatus(displayScore, true);

  return {
    id: stageId,
    label: definition.label,
    roleId: role.id,
    roleName: role.name,
    assignedAgentId: role.assignedAgentId,
    operatorAffinity: agent.roleAffinity,
    score: displayScore,
    qualityDelta: Math.round((rawScore - 58) * tuning.qualityMultiplier),
    cost:
      STAGE_OPERATION_COST[stageId] + 2 + agent.contractCost + (eventLabel ? event.costDelta : 0),
    status,
    note: buildStageNote(stageId, status, role.name),
    eventLabel
  };
}

function buildRunPipeline(state: RunState, event: ReturnType<typeof rollRunEvent>): RunPipeline {
  const roleByStage = getRoleByStage(state);
  const agentById = new Map(state.agents.map((agent) => [agent.id, agent]));
  const stages = PIPELINE_STAGE_ORDER.map((stageId) => {
    const role = roleByStage.get(stageId);
    const agent = role?.assignedAgentId ? agentById.get(role.assignedAgentId) : undefined;
    return buildStageResult(stageId, role, agent, event);
  });
  const coveredStages = stages.filter((stage) => Boolean(stage.assignedAgentId));
  const coveredStageCount = coveredStages.length;
  const missingStageCount = stages.length - coveredStageCount;
  const strongestStage = [...stages].sort(compareStagesByStrength)[0];
  const weakestStage = [...stages].sort(compareStagesByWeakness)[0];

  return {
    order: [...PIPELINE_STAGE_ORDER],
    stages,
    coveredStageCount,
    missingStageCount,
    strongestStageId: strongestStage?.id,
    weakestStageId: weakestStage?.id
  };
}

export function simulateRun(state: RunState): RunResult {
  const duplicateStageIds = getDuplicateStageIds(state);
  const assignedAgents = getAssignedAgents(state);
  const avgResilience = average(assignedAgents.map((agent) => agent.temperament.resilience));

  const seed = hashSeedParts(state.seed, assignedAgents.length, Math.round(avgResilience));
  const rng = createRng(seed);
  const event = rollRunEvent(rng, avgResilience);
  const pipeline = buildRunPipeline(state, event);
  const evaluation = evaluateDeployment(state, pipeline);
  const stageInfluence = pipeline.stages.reduce((sum, stage) => sum + stage.qualityDelta, 0);

  const baseScore = state.brief.baseScore;
  const visualIdentityInfluence = Math.round((evaluation.metrics.visualIdentity - 50) * 0.08);
  const launchStabilityInfluence = Math.round((evaluation.metrics.launchStability - 50) * 0.12);
  const communityHypeInfluence = Math.round((evaluation.metrics.communityHype - 50) * 0.07);
  const trustInfluence = Math.round((evaluation.metrics.trust - 50) * 0.11);
  const roleCoverageBonus =
    pipeline.coveredStageCount === PIPELINE_STAGE_ORDER.length
      ? 10
      : -pipeline.missingStageCount * 8;

  const baseCost = BASE_OPERATIONAL_COST + state.roles.length * 2;
  const agentCost = assignedAgents.reduce((sum, agent) => sum + agent.contractCost, 0);
  const eventCost = event.costDelta;
  const totalCost = pipeline.stages.reduce((sum, stage) => sum + stage.cost, 0);

  const runwayAfterRun = state.treasury - totalCost;
  const budgetPenalty = runwayAfterRun < 0 ? Math.min(35, Math.abs(runwayAfterRun)) : 0;

  const totalScore = Math.round(
    baseScore +
      stageInfluence +
      visualIdentityInfluence +
      launchStabilityInfluence +
      communityHypeInfluence +
      trustInfluence +
      roleCoverageBonus +
      event.qualityDelta -
      budgetPenalty
  );

  const qualityScore = clamp(totalScore, 0, 100);
  const passThreshold = state.brief.passThreshold;
  const duplicateStagePenalty = duplicateStageIds.length > 0 ? 18 + duplicateStageIds.length * 6 : 0;
  const finalQualityScore = clamp(qualityScore - duplicateStagePenalty, 0, 100);
  const passed =
    duplicateStageIds.length === 0 && finalQualityScore >= passThreshold && runwayAfterRun >= 0;
  const weakestStage = pipeline.stages.find((stage) => stage.id === pipeline.weakestStageId);
  const duplicateStageLabels = duplicateStageIds.map(
    (stageId) => getPipelineStageDefinition(stageId).shortLabel.toLowerCase()
  );
  const duplicateStageEvent =
    duplicateStageLabels.length > 0
      ? `Machine rejected duplicate stage ownership: ${duplicateStageLabels.join(', ')}`
      : undefined;

  const cid = buildPseudoCid(
    hashSeedParts(
      state.seed,
      finalQualityScore,
      totalCost,
      Math.round(avgResilience),
      event.qualityDelta,
      stageInfluence,
      duplicateStageIds.length
    )
  );

  return {
    qualityScore: finalQualityScore,
    cost: totalCost,
    events: [event.label, weakestStage?.note, duplicateStageEvent].filter(Boolean) as string[],
    cid,
    passed,
    evaluation,
    pipeline,
    diagnostics: {
      seed: state.seed,
      variance: event.variance,
      passThreshold,
      runwayAfterRun,
      assignedRoleCount: assignedAgents.length,
      totalRoleCount: state.roles.length,
      coveredStageCount: pipeline.coveredStageCount,
      totalStageCount: PIPELINE_STAGE_ORDER.length,
      duplicateStageIds,
      costBreakdown: {
        base: baseCost,
        agents: agentCost,
        events: eventCost,
        total: totalCost
      },
      scoreBreakdown: {
        base: baseScore,
        stageInfluence,
        visualIdentityInfluence,
        launchStabilityInfluence,
        communityHypeInfluence,
        trustInfluence,
        roleCoverageBonus,
        eventModifier: event.qualityDelta,
        budgetPenalty: budgetPenalty + duplicateStagePenalty,
        total: finalQualityScore
      }
    }
  };
}
