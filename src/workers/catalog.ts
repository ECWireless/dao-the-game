import { PIPELINE_STAGE_ORDER, getPipelineStageDefinition } from '../pipeline';
import type { Agent, PipelineStageId } from '../types';

export const WORKER_CATALOG: Agent[] = [
  {
    id: 'agent-01',
    name: 'Rune Mercer',
    handle: 'rune-mercer',
    specialty: 'Design-Faithful Closer',
    roleAffinity: 'Design-faithful frontend systems',
    capabilityVector: {
      design: 62,
      implementation: 90,
      review: 58,
      deployment: 76
    },
    styleProfile: {
      signature: 'Hard-edged brutalist control surfaces that keep the original concept intact.',
      execution: 'Ships approved design direction fast without sanding down its edge.',
      collaboration: 'Works best with explicit design rules and a strong reviewer catching brittle edges.'
    },
    temperament: {
      profile: 'Decisive closer',
      pace: 82,
      resilience: 68,
      teamwork: 57
    },
    traits: ['Build-first', 'Brutalist rails', 'Deadline magnet'],
    bio: 'Best when the concept is already right and the team needs it built fast without losing its edge.',
    accent: '#BD482D',
    shadow: '#6A2818',
    contractCost: 27,
    playerGuidance: {
      strengthLabel: 'Best when the concept is right and needs a fast build',
      pairingHint: 'Pair with a ruthless reviewer',
      riskLabel: 'Needs a reviewer to catch brittle edges',
      shortPitch:
        "I've got this. If the concept already feels right, I can build it fast without sanding off the edge."
    }
  },
  {
    id: 'agent-02',
    name: 'Dorian Ash',
    handle: 'dorian-ash',
    specialty: 'Systems-First Builder',
    roleAffinity: 'Frontend structure and information architecture',
    capabilityVector: {
      design: 71,
      implementation: 92,
      review: 78,
      deployment: 74
    },
    styleProfile: {
      signature: 'Grid-first interface systems with disciplined hierarchy and control-room calm.',
      execution: 'Builds the scaffolding first so ambitious concepts stay legible, stable, and shippable.',
      collaboration: 'Asks for constraints early and turns fuzzy ideas into explicit structure the team can follow.'
    },
    temperament: {
      profile: 'Measured builder',
      pace: 64,
      resilience: 82,
      teamwork: 70
    },
    traits: ['Information hierarchy', 'Control-room grids', 'Constraint-friendly'],
    bio: 'Best when a project needs stronger hierarchy, cleaner structure, and a calmer path to launch.',
    accent: '#6C4C89',
    shadow: '#332244',
    contractCost: 31,
    playerGuidance: {
      strengthLabel: 'Best when the site needs stronger structure and trust',
      pairingHint: 'Pair with a bold designer who needs a steady builder',
      riskLabel: 'Can make a concept feel too controlled without a strong visual lead',
      shortPitch:
        "I'm not the strongest design lead, but I am a good fit when the site needs stronger structure, hierarchy, and trust. Tap my avatar for the full profile."
    }
  },
  {
    id: 'agent-03',
    name: 'Kestrel Vale',
    handle: 'kestrel-vale',
    specialty: 'Skeuomorphic Product Designer',
    roleAffinity: 'Skeuomorphic interaction and product design',
    capabilityVector: {
      design: 88,
      implementation: 68,
      review: 63,
      deployment: 54
    },
    styleProfile: {
      signature: 'Tactile skeuomorphic interfaces with luminous glass, deep controls, and surfaces that feel built to be touched.',
      execution: 'Turns navigation, buttons, and panels into layered product machinery with clear interaction cues and physical logic.',
      collaboration: 'Leaves detailed handoff notes like a product blueprint, down to the bezel, state change, and control weight.'
    },
    temperament: {
      profile: 'Calm systems thinker',
      pace: 62,
      resilience: 79,
      teamwork: 82
    },
    traits: ['Skeuomorphic control rooms', 'Interaction-first', 'Strong handoffs'],
    bio: 'Best when the site needs to feel tactile, navigable, and unmistakably like a real product surface.',
    accent: '#8B6C20',
    shadow: '#534A13',
    contractCost: 25,
    playerGuidance: {
      strengthLabel: 'Best when the site needs tactile product feel and intuitive navigation',
      pairingHint: 'Pair with a builder who preserves detail under pressure',
      riskLabel: 'Needs a stronger finisher for launch polish',
      shortPitch:
        "This is right up my alley. I can make the site feel tactile, intuitive, and much more like a real product."
    }
  },
  {
    id: 'agent-04',
    name: 'Hexa Thorn',
    handle: 'hexa-thorn',
    specialty: 'Brutalist Identity Designer',
    roleAffinity: 'Brutalist identity and visual systems',
    capabilityVector: {
      design: 93,
      implementation: 44,
      review: 56,
      deployment: 38
    },
    styleProfile: {
      signature: 'Brutalist poster systems, oversized type, and hard-edged blocks that read like public signage.',
      execution: 'Delivers a ruthless first-pass visual language fast and expects the team to commit to it.',
      collaboration: 'Plants a visual thesis early and leaves little room for timid revisions or soft compromise.'
    },
    temperament: {
      profile: 'Instinctive stylist',
      pace: 58,
      resilience: 61,
      teamwork: 66
    },
    traits: ['Brutalist posters', 'Fast concepting', 'Public-facing punch'],
    bio: 'Best when the site needs a bold public identity that feels immediate, loud, and impossible to ignore.',
    accent: '#8B3A2E',
    shadow: '#4D1A14',
    contractCost: 22,
    playerGuidance: {
      strengthLabel: 'Best when the site needs a bold identity and unmistakable public presence',
      pairingHint: 'Pair with a builder who can stabilize a strong visual thesis',
      riskLabel: 'Can overpower weaker structure if no one reins the concept in',
      shortPitch:
        "Yeah, I can take this. If you want a bolder identity and more public-facing punch, I'll push it there fast."
    }
  },
  {
    id: 'agent-05',
    name: 'Sable Quill',
    handle: 'sable-quill',
    specialty: 'Launch QA Specialist',
    roleAffinity: 'QA review, trust hardening, and edge-case detection',
    capabilityVector: {
      design: 48,
      implementation: 55,
      review: 94,
      deployment: 69
    },
    styleProfile: {
      signature: 'Finds brittle edges, broken assumptions, and trust-killing cracks hiding inside polished surfaces.',
      execution: 'Builds repro steps, redline notes, and pre-launch corrections before problems go public.',
      collaboration: 'Blunt but exacting when risky work needs a final truth pass.'
    },
    temperament: {
      profile: 'Meticulous skeptic',
      pace: 52,
      resilience: 92,
      teamwork: 74
    },
    traits: ['Edge-case radar', 'Noisy diffs', 'Launch brake'],
    bio: 'Best when a promising build needs trust, correction, and one honest pass before launch.',
    accent: '#6F5C18',
    shadow: '#3A300B',
    contractCost: 24,
    playerGuidance: {
      strengthLabel: 'Best when the team needs trust and edge-case QA before launch',
      pairingHint: 'Pair with a bold designer or fast builder who needs a final truth pass',
      riskLabel: 'Can sand down risky ideas if no one protects the concept',
      shortPitch:
        "I can do the QA pass. If this build is risky, I'll find the brittle parts before the client does."
    }
  },
  {
    id: 'agent-06',
    name: 'Mint Halberd',
    handle: 'mint-halberd',
    specialty: 'Responsive Release Reviewer',
    roleAffinity: 'Responsive QA, release hardening, and rollout',
    capabilityVector: {
      design: 36,
      implementation: 61,
      review: 84,
      deployment: 94
    },
    styleProfile: {
      signature: 'Quiet launch surfaces, narrow-screen rigor, and operational calm under pressure.',
      execution: 'Runs responsive QA and release checklists like ritual until the site holds together on every screen.',
      collaboration: 'Turns launch nerves into actionable checklists and clean rollback-ready communication.'
    },
    temperament: {
      profile: 'Methodical closer',
      pace: 68,
      resilience: 95,
      teamwork: 63
    },
    traits: ['Responsive QA', 'Incident calm', 'Rollback ready'],
    bio: 'Best when the team needs confidence that the site will survive launch conditions and tiny screens alike.',
    accent: '#5D6E2F',
    shadow: '#2E3A18',
    contractCost: 29,
    playerGuidance: {
      strengthLabel: 'Best when the launch needs responsive QA and release hardening',
      pairingHint: 'Pair with a risky designer or fast builder before launch',
      riskLabel: 'Can push the work toward safety if no one protects the concept',
      shortPitch:
        "Happy to take release. I'll harden the launch, check the tiny screens, and make sure this thing survives the rollout."
    }
  },
];

function getStageEntries(agent: Agent): Array<[PipelineStageId, number]> {
  return PIPELINE_STAGE_ORDER.map((stageId) => [stageId, agent.capabilityVector[stageId]]);
}

export function getWorkerStageScoreEntries(
  agent: Agent
): Array<{ stageId: PipelineStageId; label: string; value: number }> {
  return getStageEntries(agent).map(([stageId, value]) => ({
    stageId,
    label: getPipelineStageDefinition(stageId).shortLabel,
    value
  }));
}

export function getWorkerStageScoreSummary(agent: Agent): string {
  return getWorkerStageScoreEntries(agent)
    .map(({ label, value }) => `${label} ${value}`)
    .join(' • ');
}

export function getWorkerCapabilitySummary(agent: Agent, count = 2): string {
  return getStageEntries(agent)
    .sort((left, right) => right[1] - left[1])
    .slice(0, count)
    .map(([stageId, score]) => `${getPipelineStageDefinition(stageId).shortLabel} ${score}`)
    .join(' • ');
}

export function getWorkerPrimaryStageId(agent: Agent): PipelineStageId {
  return getStageEntries(agent).sort((left, right) => right[1] - left[1])[0]?.[0] ?? 'implementation';
}

export function getWorkerAverageCapability(agent: Agent): number {
  const values = getStageEntries(agent).map((entry) => entry[1]);
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function getWorkerWeakestStageId(agent: Agent): PipelineStageId {
  return getStageEntries(agent).sort((left, right) => left[1] - right[1])[0]?.[0] ?? 'implementation';
}

export function getWorkerStrengthLabel(agent: Agent): string {
  if (agent.playerGuidance?.strengthLabel) {
    return agent.playerGuidance.strengthLabel;
  }

  const stageId = getWorkerPrimaryStageId(agent);
  const score = agent.capabilityVector[stageId];
  return `Best for ${getPipelineStageDefinition(stageId).shortLabel.toLowerCase()} (${score})`;
}

export function getWorkerRiskLabel(agent: Agent): string {
  if (agent.playerGuidance?.riskLabel) {
    return agent.playerGuidance.riskLabel;
  }

  const explicitRisk = [...agent.traits].reverse().find((trait) => /^can |^needs /i.test(trait));

  if (explicitRisk) {
    return explicitRisk;
  }

  if (agent.temperament.resilience < 55) {
    return 'Can wobble under pressure';
  }

  if (agent.temperament.teamwork < 60) {
    return 'Needs tighter handoffs';
  }

  const weakestStageId = getWorkerWeakestStageId(agent);
  return `Needs support on ${getPipelineStageDefinition(weakestStageId).shortLabel.toLowerCase()}`;
}

export function getWorkerPairingHint(agent: Agent): string {
  if (agent.playerGuidance?.pairingHint) {
    return agent.playerGuidance.pairingHint;
  }

  const strongestStageId = getWorkerPrimaryStageId(agent);
  const weakestStageId = getWorkerWeakestStageId(agent);

  if (strongestStageId === 'design' && weakestStageId === 'implementation') {
    return 'Pair with a disciplined builder';
  }

  if (strongestStageId === 'implementation' && weakestStageId === 'review') {
    return 'Pair with a ruthless reviewer';
  }

  if (strongestStageId === 'deployment' && weakestStageId === 'design') {
    return 'Pair with a sharper designer';
  }

  if (strongestStageId === 'review' && weakestStageId === 'design') {
    return 'Pair with a stronger visual lead';
  }

  if (agent.temperament.teamwork >= 80) {
    return 'Elevates messy lineups';
  }

  if (agent.temperament.resilience >= 85) {
    return 'Stabilizes risky teams';
  }

  return 'Works best with complementary coverage';
}

export function getWorkerShortPitch(agent: Agent): string {
  if (agent.playerGuidance?.shortPitch) {
    return agent.playerGuidance.shortPitch;
  }

  return `${getWorkerStrengthLabel(agent)}. Tap my avatar for the full profile.`;
}
