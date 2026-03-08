import type { Agent } from '../../types';
import { getRoleAffinityLabel } from '../../roleAffinity';

export type GuildMemberProfile = {
  id: string;
  agentId?: string;
  name: string;
  handle: string;
  title: string;
  affinityLabel?: string;
  accent: string;
  shadow: string;
};

export type GuildFeedEntry = {
  id: string;
  memberId: string;
  text: string;
};

const CANDIDATE_PRESETS: Omit<GuildMemberProfile, 'id' | 'agentId'>[] = [
  {
    name: 'Rune Mercer',
    handle: 'rune-mercer',
    title: 'frontend delver',
    accent: '#BD482D',
    shadow: '#6A2818'
  },
  {
    name: 'Kestrel Vale',
    handle: 'kestrel-vale',
    title: 'interface ranger',
    accent: '#8B6C20',
    shadow: '#534A13'
  },
  {
    name: 'Hexa Thorn',
    handle: 'hexa-thorn',
    title: 'brand scavenger',
    accent: '#8B3A2E',
    shadow: '#4D1A14'
  },
  {
    name: 'Sable Quill',
    handle: 'sable-quill',
    title: 'review sentinel',
    accent: '#6F5C18',
    shadow: '#3A300B'
  },
  {
    name: 'Mint Halberd',
    handle: 'mint-halberd',
    title: 'deploy courier',
    accent: '#5D6E2F',
    shadow: '#2E3A18'
  },
  {
    name: 'Dorian Ash',
    handle: 'dorian-ash',
    title: 'stack architect',
    accent: '#6C4C89',
    shadow: '#332244'
  }
];

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

function getRoleCandidateOffset(roleId: string) {
  switch (roleId) {
    case 'hat-02':
      return 2;
    case 'hat-03':
      return 4;
    case 'hat-04':
      return 1;
    case 'hat-01':
    default:
      return 0;
  }
}

function buildCandidateProfiles(
  agents: Agent[],
  startIndex: number,
  count: number,
  roleId?: string
): GuildMemberProfile[] {
  if (agents.length === 0) {
    return [];
  }

  return Array.from({ length: Math.min(count, agents.length) }, (_, index) => {
    const agentIndex = (startIndex + index) % agents.length;
    const agent = agents[agentIndex];
    const preset = CANDIDATE_PRESETS[(startIndex + index) % CANDIDATE_PRESETS.length];

    return {
      ...preset,
      id: `candidate-${startIndex}-${agent.id}`,
      agentId: agent.id,
      affinityLabel: roleId ? getRoleAffinityLabel(roleId, index) : undefined
    };
  });
}

export function getRaidGuildCandidates(
  agents: Agent[],
  count = agents.length
): GuildMemberProfile[] {
  return buildCandidateProfiles(agents, 0, count, 'hat-01');
}

export function getRaidGuildCandidatesForRole(
  agents: Agent[],
  roleId: string,
  count = 2
): GuildMemberProfile[] {
  return buildCandidateProfiles(agents, getRoleCandidateOffset(roleId), count, roleId);
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

  return getRaidGuildCandidates(agents).find((member) => member.agentId === agentId);
}
