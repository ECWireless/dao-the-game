import type { Agent } from '../../types';
import {
  getWorkerAverageCapability,
  getWorkerCapabilitySummary
} from '../../workers/catalog';

export type GuildMemberProfile = {
  id: string;
  agentId?: string;
  name: string;
  handle: string;
  title: string;
  accent: string;
  shadow: string;
  roleAffinity?: string;
  archetype?: string;
  temperamentProfile?: string;
  capabilitySummary?: string;
};

export type GuildFeedEntry = {
  id: string;
  memberId: string;
  text: string;
};

const DECOR_PROFILES: GuildMemberProfile[] = [
  {
    id: 'quartermaster-nyx',
    name: 'Quartermaster Nyx',
    handle: 'quartermaster-nyx',
    title: 'ops wrangler',
    accent: '#7A3A2C',
    shadow: '#3C1710'
  },
  {
    id: 'glint-archive',
    name: 'Glint Archive',
    handle: 'glint-archive',
    title: 'bounty curator',
    accent: '#534A13',
    shadow: '#2F2A0B'
  },
  {
    id: 'moss-scrip',
    name: 'Moss Scrip',
    handle: 'moss-scrip',
    title: 'quest poster',
    accent: '#986749',
    shadow: '#4E271A'
  }
];

export const RAIDGUILD_CHANNELS = [
  '#announcements',
  '#build-quests',
  '#meme-vault',
  '#hiring-board'
] as const;

export const RAIDGUILD_HISTORY: GuildFeedEntry[] = [
  {
    id: 'hist-1',
    memberId: 'quartermaster-nyx',
    text: 'Reminder: any time you are developing something, use a burner wallet.'
  },
  {
    id: 'hist-2',
    memberId: 'glint-archive',
    text: 'Two interesting bounties arriving soon. First to call dibs gets it.'
  },
  {
    id: 'hist-3',
    memberId: 'moss-scrip',
    text: 'Who changed the guild emoji set to daggers. Again.'
  }
];

function createGuildProfile(agent: Agent, id: string): GuildMemberProfile {
  return {
    id,
    agentId: agent.id,
    name: agent.name,
    handle: agent.handle,
    title: agent.title,
    accent: agent.accent,
    shadow: agent.shadow,
    roleAffinity: agent.roleAffinity,
    archetype: agent.archetype,
    temperamentProfile: agent.temperament.profile,
    capabilitySummary: getWorkerCapabilitySummary(agent)
  };
}

function getRoleStageRank(agent: Agent, roleId: string): number {
  switch (roleId) {
    case 'hat-02':
      return agent.capabilityVector.design;
    case 'hat-03':
      return agent.capabilityVector.review;
    case 'hat-04':
      return agent.capabilityVector.deployment;
    case 'hat-01':
    default:
      return agent.capabilityVector.implementation;
  }
}

function compareRoleCandidates(left: Agent, right: Agent, roleId?: string): number {
  if (roleId) {
    const roleDelta = getRoleStageRank(right, roleId) - getRoleStageRank(left, roleId);

    if (roleDelta !== 0) {
      return roleDelta;
    }
  }

  const averageDelta = getWorkerAverageCapability(right) - getWorkerAverageCapability(left);

  if (averageDelta !== 0) {
    return averageDelta;
  }

  return left.id.localeCompare(right.id);
}

function buildCandidateProfiles(
  agents: Agent[],
  count: number,
  roleId?: string
): GuildMemberProfile[] {
  return [...agents]
    .sort((left, right) => compareRoleCandidates(left, right, roleId))
    .slice(0, Math.min(count, agents.length))
    .map((agent) => createGuildProfile(agent, roleId ? `candidate-${roleId}-${agent.id}` : `candidate-${agent.id}`));
}

export function getRaidGuildCandidates(
  agents: Agent[],
  count = agents.length
): GuildMemberProfile[] {
  return buildCandidateProfiles(agents, count);
}

export function getRaidGuildCandidatesForRole(
  agents: Agent[],
  roleId: string,
  count = 2
): GuildMemberProfile[] {
  return buildCandidateProfiles(agents, count, roleId);
}

export function getPrimaryRaidGuildCandidateForRole(
  agents: Agent[],
  roleId: string
): GuildMemberProfile | undefined {
  return getRaidGuildCandidatesForRole(agents, roleId, 1)[0];
}

export function getRaidGuildRoster(agents: Agent[]): GuildMemberProfile[] {
  return [...DECOR_PROFILES, ...getRaidGuildCandidates(agents)];
}

export function findRaidGuildMember(
  agents: Agent[],
  agentId?: string
): GuildMemberProfile | undefined {
  if (!agentId) {
    return undefined;
  }

  const agent = agents.find((candidate) => candidate.id === agentId);
  return agent ? createGuildProfile(agent, `candidate-${agent.id}`) : undefined;
}
