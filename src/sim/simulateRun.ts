import type { Agent, RunResult, RunState } from '../types';
import { clamp, createRng, hashSeedParts } from './rng';

type EventTemplate = {
  label: string;
  qualityDelta: number;
  costDelta: number;
};

const EVENT_TABLE: EventTemplate[] = [
  {
    label: 'Prompt drift in design handoff',
    qualityDelta: -10,
    costDelta: 10
  },
  {
    label: 'Scope swell from late client asks',
    qualityDelta: -6,
    costDelta: 14
  },
  {
    label: 'Clean execution window',
    qualityDelta: 5,
    costDelta: 0
  },
  {
    label: 'Reusable component breakthrough',
    qualityDelta: 9,
    costDelta: -4
  },
  {
    label: 'Ops relay cache hit',
    qualityDelta: 6,
    costDelta: -2
  }
];

const BASE_OPERATIONAL_COST = 36;

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

function rollRunEvent(rng: ReturnType<typeof createRng>, reliability: number) {
  const roll = rng.next();
  const template = EVENT_TABLE[Math.floor(roll * EVENT_TABLE.length)] ?? EVENT_TABLE[0];
  const variance = Math.max(2, Math.round((100 - reliability) / 10));
  const jitter = rng.int(-variance, variance);

  const qualityDelta = template.qualityDelta + jitter;
  const costDelta = Math.max(0, template.costDelta + Math.max(0, jitter));

  return {
    label: `${template.label} (${qualityDelta >= 0 ? '+' : ''}${qualityDelta} quality)`,
    qualityDelta,
    costDelta,
    variance
  };
}

export function simulateRun(state: RunState): RunResult {
  const assignedAgents = getAssignedAgents(state);
  const missingRoles = state.roles.length - assignedAgents.length;

  const avgCreativity = average(assignedAgents.map((agent) => agent.creativity));
  const avgReliability = average(assignedAgents.map((agent) => agent.reliability));
  const avgSpeed = average(assignedAgents.map((agent) => agent.speed));

  const seed = hashSeedParts(state.seed, assignedAgents.length, Math.round(avgReliability));
  const rng = createRng(seed);
  const event = rollRunEvent(rng, avgReliability);

  const baseScore = state.brief.baseScore;
  const creativityInfluence = Math.round((avgCreativity - 50) * 0.55);
  const speedInfluence = Math.round((avgSpeed - 50) * 0.35);
  const roleCoverageBonus = assignedAgents.length === state.roles.length ? 14 : -missingRoles * 10;
  const reliabilityPenalty = Math.round(Math.max(0, 62 - avgReliability) * 0.8 + missingRoles * 4);

  const baseCost = BASE_OPERATIONAL_COST + state.roles.length * 2;
  const agentCost = assignedAgents.reduce((sum, agent) => sum + agent.cost, 0);
  const eventCost = event.costDelta;
  const totalCost = baseCost + agentCost + eventCost;

  const runwayAfterRun = state.treasury - totalCost;
  const budgetPenalty = runwayAfterRun < 0 ? Math.min(35, Math.abs(runwayAfterRun)) : 0;

  const totalScore = Math.round(
    baseScore +
      creativityInfluence +
      speedInfluence +
      roleCoverageBonus +
      event.qualityDelta -
      reliabilityPenalty -
      budgetPenalty
  );

  const qualityScore = clamp(totalScore, 0, 100);
  const passThreshold = state.brief.passThreshold;
  const passed = qualityScore >= passThreshold && runwayAfterRun >= 0;

  const cid = buildPseudoCid(
    hashSeedParts(state.seed, qualityScore, totalCost, Math.round(avgReliability), event.qualityDelta)
  );

  return {
    qualityScore,
    cost: totalCost,
    events: [event.label],
    cid,
    passed,
    diagnostics: {
      seed: state.seed,
      variance: event.variance,
      passThreshold,
      runwayAfterRun,
      assignedRoleCount: assignedAgents.length,
      totalRoleCount: state.roles.length,
      costBreakdown: {
        base: baseCost,
        agents: agentCost,
        events: eventCost,
        total: totalCost
      },
      scoreBreakdown: {
        base: baseScore,
        creativityInfluence,
        speedInfluence,
        reliabilityPenalty,
        roleCoverageBonus,
        eventModifier: event.qualityDelta,
        budgetPenalty,
        total: qualityScore
      }
    }
  };
}
