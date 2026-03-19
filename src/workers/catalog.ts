import { PIPELINE_STAGE_ORDER, getPipelineStageDefinition } from '../pipeline';
import type { Agent, PipelineStageId } from '../types';

export const WORKER_CATALOG: Agent[] = [
  {
    id: 'agent-01',
    name: 'Rune Mercer',
    handle: 'rune-mercer',
    title: 'frontend delver',
    archetype: 'Systems Shipwright',
    roleAffinity: 'Interface systems',
    capabilityVector: {
      design: 62,
      implementation: 90,
      review: 58,
      deployment: 76
    },
    styleProfile: {
      signature: 'Hard-edged control surfaces with brutalist restraint and zero decorative mercy.',
      execution: 'Turns design direction into rigid, reusable front-end rails under pressure.',
      collaboration: 'Prefers tight handoffs, short feedback loops, and a crisp design contract.'
    },
    temperament: {
      profile: 'Decisive closer',
      pace: 82,
      resilience: 68,
      teamwork: 57
    },
    traits: ['Build-first', 'Brutalist rails', 'Deadline magnet'],
    bio: 'Turns vague product asks into working surfaces before the room has finished panicking.',
    accent: '#BD482D',
    shadow: '#6A2818',
    contractCost: 27
  },
  {
    id: 'agent-02',
    name: 'Kestrel Vale',
    handle: 'kestrel-vale',
    title: 'interface ranger',
    archetype: 'Experience Cartographer',
    roleAffinity: 'Flow and interaction design',
    capabilityVector: {
      design: 88,
      implementation: 68,
      review: 63,
      deployment: 54
    },
    styleProfile: {
      signature: 'Tactile skeuomorphic control rooms, luminous glass, and surfaces that beg to be touched.',
      execution: 'Turns navigation, buttons, and panels into layered product machinery.',
      collaboration: 'Leaves handoff notes like a product blueprint, down to the bezel and button state.'
    },
    temperament: {
      profile: 'Calm systems thinker',
      pace: 62,
      resilience: 79,
      teamwork: 82
    },
    traits: ['Skeuomorphic control rooms', 'Player empathy', 'Strong handoffs'],
    bio: 'Makes products feel tactile and navigable even when the underlying system is trying to fight back.',
    accent: '#8B6C20',
    shadow: '#534A13',
    contractCost: 25
  },
  {
    id: 'agent-03',
    name: 'Hexa Thorn',
    handle: 'hexa-thorn',
    title: 'brand scavenger',
    archetype: 'Identity Scavenger',
    roleAffinity: 'Identity and mood systems',
    capabilityVector: {
      design: 93,
      implementation: 44,
      review: 56,
      deployment: 38
    },
    styleProfile: {
      signature: 'Brutalist poster systems, oversized type, and hard-edged blocks that read like public signage.',
      execution: 'Delivers a ruthless first-pass visual language fast and expects the rest of the team to commit.',
      collaboration: 'Throws down a visual thesis early and leaves little room for timid revisions.'
    },
    temperament: {
      profile: 'Instinctive stylist',
      pace: 58,
      resilience: 61,
      teamwork: 66
    },
    traits: ['Brutalist posters', 'Fast concepting', 'Can overreach'],
    bio: 'Great at making something feel loud, inevitable, and publicly legible before anyone has fully decided what it is.',
    accent: '#8B3A2E',
    shadow: '#4D1A14',
    contractCost: 22
  },
  {
    id: 'agent-04',
    name: 'Sable Quill',
    handle: 'sable-quill',
    title: 'review sentinel',
    archetype: 'Failure Hunter',
    roleAffinity: 'QA and edge-case detection',
    capabilityVector: {
      design: 48,
      implementation: 55,
      review: 94,
      deployment: 69
    },
    styleProfile: {
      signature: 'Finds the crack in every glossy surface.',
      execution: 'Builds tidy repro steps and redline notes.',
      collaboration: 'Blunt but precise when the work needs correction.'
    },
    temperament: {
      profile: 'Meticulous skeptic',
      pace: 52,
      resilience: 92,
      teamwork: 74
    },
    traits: ['Edge-case radar', 'Noisy diffs', 'Launch brake'],
    bio: 'The person you want in the room right before launch and nowhere near your mood board.',
    accent: '#6F5C18',
    shadow: '#3A300B',
    contractCost: 24
  },
  {
    id: 'agent-05',
    name: 'Mint Halberd',
    handle: 'mint-halberd',
    title: 'deploy courier',
    archetype: 'Release Operator',
    roleAffinity: 'Launch hardening and rollout',
    capabilityVector: {
      design: 36,
      implementation: 61,
      review: 72,
      deployment: 96
    },
    styleProfile: {
      signature: 'Quiet launches with boring dashboards.',
      execution: 'Runs checklists like ritual.',
      collaboration: 'Keeps comms terse when the clock is hot.'
    },
    temperament: {
      profile: 'Methodical closer',
      pace: 68,
      resilience: 95,
      teamwork: 63
    },
    traits: ['Checklist brain', 'Incident calm', 'Rollback ready'],
    bio: 'Turns “we think it should work” into “we know what happens if it does not.”',
    accent: '#5D6E2F',
    shadow: '#2E3A18',
    contractCost: 29
  },
  {
    id: 'agent-06',
    name: 'Dorian Ash',
    handle: 'dorian-ash',
    title: 'stack architect',
    archetype: 'Systems Architect',
    roleAffinity: 'Technical framing and build systems',
    capabilityVector: {
      design: 71,
      implementation: 92,
      review: 78,
      deployment: 74
    },
    styleProfile: {
      signature: 'Grid-first system architecture with disciplined hierarchy and control-room calm.',
      execution: 'Builds foundations before polish and turns aesthetics into coherent scaffolds.',
      collaboration: 'Likes early constraints, direct questions, and explicit design rules.'
    },
    temperament: {
      profile: 'Measured builder',
      pace: 64,
      resilience: 82,
      teamwork: 70
    },
    traits: ['Architecture first', 'Control-room grids', 'Constraint-friendly'],
    bio: 'Rarely the loudest person on a project, but usually the one who made it shippable.',
    accent: '#6C4C89',
    shadow: '#332244',
    contractCost: 31
  },
  {
    id: 'agent-07',
    name: 'Ione Vector',
    handle: 'ione-vector',
    title: 'protocol illustrator',
    archetype: 'Generative Visualist',
    roleAffinity: 'Visual systems and generative art',
    capabilityVector: {
      design: 91,
      implementation: 57,
      review: 49,
      deployment: 42
    },
    styleProfile: {
      signature: 'Festival-scale gradients, liquid chrome, and generative spectacle with exhibition energy.',
      execution: 'Builds visual worlds that feel like a launch event swallowed the city.',
      collaboration: 'Needs a stronger finisher once the spectacle lands.'
    },
    temperament: {
      profile: 'Mercurial visionary',
      pace: 71,
      resilience: 48,
      teamwork: 58
    },
    traits: ['Festival spectacle', 'High ceiling', 'Can drift'],
    bio: 'Makes things that people remember, then dares the rest of the team to stabilize the afterimage.',
    accent: '#4A6FB1',
    shadow: '#243860',
    contractCost: 23
  },
  {
    id: 'agent-08',
    name: 'Calder Pike',
    handle: 'calder-pike',
    title: 'ops signaler',
    archetype: 'Operator-Analyst',
    roleAffinity: 'Monitoring and release telemetry',
    capabilityVector: {
      design: 44,
      implementation: 63,
      review: 81,
      deployment: 88
    },
    styleProfile: {
      signature: 'Operational clarity over theatrics.',
      execution: 'Likes instrumentation before launch.',
      collaboration: 'Translates chaos into checklists.'
    },
    temperament: {
      profile: 'Steady operator',
      pace: 66,
      resilience: 89,
      teamwork: 76
    },
    traits: ['Metrics-minded', 'Postmortem memory', 'Quiet under fire'],
    bio: 'Not glamorous, but the sort of operator who makes the rest of the team look disciplined.',
    accent: '#4F7A74',
    shadow: '#27403C',
    contractCost: 28
  },
  {
    id: 'agent-09',
    name: 'Nera Coil',
    handle: 'nera-coil',
    title: 'token mechanic',
    archetype: 'Economic Systems Tinkerer',
    roleAffinity: 'Incentive design and token logic',
    capabilityVector: {
      design: 68,
      implementation: 74,
      review: 66,
      deployment: 59
    },
    styleProfile: {
      signature: 'Utility-first systems with a taste for risk.',
      execution: 'Good at weird constraints and parameter tuning.',
      collaboration: 'Likes debating tradeoffs in the open.'
    },
    temperament: {
      profile: 'Restless optimizer',
      pace: 74,
      resilience: 62,
      teamwork: 69
    },
    traits: ['Systems tuning', 'Tradeoff fluent', 'Can overcomplicate'],
    bio: 'The kind of systems thinker who can rescue a launch or talk everyone into one more layer.',
    accent: '#7A4C88',
    shadow: '#3D2546',
    contractCost: 26
  },
  {
    id: 'agent-10',
    name: 'Omen Wren',
    handle: 'omen-wren',
    title: 'community operator',
    archetype: 'Narrative Signal Amplifier',
    roleAffinity: 'Launch narrative and community ops',
    capabilityVector: {
      design: 77,
      implementation: 49,
      review: 54,
      deployment: 83
    },
    styleProfile: {
      signature: 'Turns cold launches into scenes people want to join.',
      execution: 'Excellent at launch framing and cadence.',
      collaboration: 'Pulls momentum out of thin air.'
    },
    temperament: {
      profile: 'Electric orchestrator',
      pace: 86,
      resilience: 64,
      teamwork: 91
    },
    traits: ['Hype engine', 'Rapid coordination', 'Needs guardrails'],
    bio: 'Can make a launch feel alive fast, provided someone else keeps the floor from catching fire.',
    accent: '#C06B2E',
    shadow: '#643513',
    contractCost: 24
  }
];

function getStageEntries(agent: Agent): Array<[PipelineStageId, number]> {
  return PIPELINE_STAGE_ORDER.map((stageId) => [stageId, agent.capabilityVector[stageId]]);
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
