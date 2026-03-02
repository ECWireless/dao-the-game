import type { Agent } from '../../types';

export type GuildMemberProfile = {
  id: string;
  agentId?: string;
  name: string;
  handle: string;
  title: string;
  accent: string;
  shadow: string;
  skin: string;
  hair: string;
  robe: string;
  trim: string;
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
    shadow: '#6A2818',
    skin: '#D5A07D',
    hair: '#2B1712',
    robe: '#7D2616',
    trim: '#E8BF73'
  },
  {
    name: 'Kestrel Vale',
    handle: 'kestrel-vale',
    title: 'interface ranger',
    accent: '#8B6C20',
    shadow: '#534A13',
    skin: '#E2BC9D',
    hair: '#51481A',
    robe: '#534A13',
    trim: '#D8C46A'
  },
  {
    name: 'Hexa Thorn',
    handle: 'hexa-thorn',
    title: 'brand scavenger',
    accent: '#8B3A2E',
    shadow: '#4D1A14',
    skin: '#C58D71',
    hair: '#2F1511',
    robe: '#5E2319',
    trim: '#D59A6F'
  },
  {
    name: 'Sable Quill',
    handle: 'sable-quill',
    title: 'review sentinel',
    accent: '#6F5C18',
    shadow: '#3A300B',
    skin: '#D7B595',
    hair: '#3C3210',
    robe: '#4D4312',
    trim: '#C9B15B'
  },
  {
    name: 'Mint Halberd',
    handle: 'mint-halberd',
    title: 'deploy courier',
    accent: '#5D6E2F',
    shadow: '#2E3A18',
    skin: '#D5A787',
    hair: '#243016',
    robe: '#3B4C1D',
    trim: '#A7C96B'
  },
  {
    name: 'Dorian Ash',
    handle: 'dorian-ash',
    title: 'stack architect',
    accent: '#6C4C89',
    shadow: '#332244',
    skin: '#D7A98D',
    hair: '#2A1B33',
    robe: '#4A3360',
    trim: '#BE9AE6'
  }
];

const DECOR_PROFILES: GuildMemberProfile[] = [
  {
    id: 'quartermaster-nyx',
    name: 'Quartermaster Nyx',
    handle: 'quartermaster-nyx',
    title: 'ops wrangler',
    accent: '#7A3A2C',
    shadow: '#3C1710',
    skin: '#D1A388',
    hair: '#261311',
    robe: '#4D1D15',
    trim: '#B76E47'
  },
  {
    id: 'glint-archive',
    name: 'Glint Archive',
    handle: 'glint-archive',
    title: 'bounty curator',
    accent: '#534A13',
    shadow: '#2F2A0B',
    skin: '#D8B493',
    hair: '#40360E',
    robe: '#413A12',
    trim: '#B8A64A'
  },
  {
    id: 'moss-scrip',
    name: 'Moss Scrip',
    handle: 'moss-scrip',
    title: 'quest poster',
    accent: '#986749',
    shadow: '#4E271A',
    skin: '#C88D6C',
    hair: '#513126',
    robe: '#6D3A28',
    trim: '#C58D5F'
  }
];

export const RAIDGUILD_CHANNELS = [
  '#announcements',
  '#build-quests',
  '#meme-vault',
  '#hiring-board',
  '#client-omens'
] as const;

export const RAIDGUILD_HISTORY: GuildFeedEntry[] = [
  {
    id: 'hist-1',
    memberId: 'quartermaster-nyx',
    text: 'Reminder: if you deploy from tavern WiFi again, at least use a burner wallet.'
  },
  {
    id: 'hist-2',
    memberId: 'glint-archive',
    text: 'Pinned two new bounties and one cursed branding audit. Choose wisely.'
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

function buildCandidateProfiles(agents: Agent[], startIndex: number, count: number) {
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
      agentId: agent.id
    };
  });
}

export function getRaidGuildCandidates(agents: Agent[], count = agents.length): GuildMemberProfile[] {
  return buildCandidateProfiles(agents, 0, count);
}

export function getRaidGuildCandidatesForRole(agents: Agent[], roleId: string, count = 2): GuildMemberProfile[] {
  return buildCandidateProfiles(agents, getRoleCandidateOffset(roleId), count);
}

export function getPrimaryRaidGuildCandidateForRole(agents: Agent[], roleId: string): GuildMemberProfile | undefined {
  return getRaidGuildCandidatesForRole(agents, roleId, 1)[0];
}

export function getRaidGuildRoster(agents: Agent[]): GuildMemberProfile[] {
  return [...DECOR_PROFILES, ...getRaidGuildCandidates(agents)];
}

export function findRaidGuildMember(agents: Agent[], agentId?: string): GuildMemberProfile | undefined {
  if (!agentId) {
    return undefined;
  }

  return getRaidGuildCandidates(agents).find((member) => member.agentId === agentId);
}
