import type { HatRole, Worker } from '../../types';
import {
  getWorkerAccent,
  getWorkerAverageCapability,
  getWorkerBio,
  getWorkerHandle,
  getWorkerRoleAffinity,
  getWorkerRoleTagId,
  getWorkerRoleTagLabel,
  getWorkerShadow,
  getWorkerShortPitch,
  getWorkerName
} from '../../workers/catalog';

export type GuildMemberProfile = {
  id: string;
  workerId?: string;
  name: string;
  handle: string;
  accent: string;
  shadow: string;
  roleAffinity?: string;
  roleTagLabel?: string;
  bio?: string;
  shortPitch?: string;
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
    accent: '#7A3A2C',
    shadow: '#3C1710'
  },
  {
    id: 'glint-archive',
    name: 'Glint Archive',
    handle: 'glint-archive',
    accent: '#534A13',
    shadow: '#2F2A0B'
  },
  {
    id: 'moss-scrip',
    name: 'Moss Scrip',
    handle: 'moss-scrip',
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

function createGuildProfile(worker: Worker, id: string): GuildMemberProfile {
  return {
    id,
    workerId: worker.id,
    name: getWorkerName(worker),
    handle: getWorkerHandle(worker),
    accent: getWorkerAccent(worker),
    shadow: getWorkerShadow(worker),
    roleAffinity: getWorkerRoleAffinity(worker),
    roleTagLabel: getWorkerRoleTagLabel(worker),
    bio: getWorkerBio(worker),
    shortPitch: getWorkerShortPitch(worker)
  };
}

function getRoleStageRank(worker: Worker, roleId: string): number {
  switch (roleId) {
    case 'hat-02':
      return worker.gameplay.capabilityVector.design;
    case 'hat-03':
      return worker.gameplay.capabilityVector.review;
    case 'hat-04':
      return worker.gameplay.capabilityVector.deployment;
    case 'hat-01':
    default:
      return worker.gameplay.capabilityVector.implementation;
  }
}

function matchesAllowedRoleTags(worker: Worker, role?: Pick<HatRole, 'metadata'>): boolean {
  const allowedRoleTagIds = role?.metadata?.allowedRoleTagIds;

  if (!allowedRoleTagIds?.length) {
    return true;
  }

  return allowedRoleTagIds.includes(getWorkerRoleTagId(worker));
}

function compareRoleCandidates(left: Worker, right: Worker, role?: Pick<HatRole, 'id'>): number {
  if (role?.id) {
    const roleDelta = getRoleStageRank(right, role.id) - getRoleStageRank(left, role.id);

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
  workers: Worker[],
  count: number,
  role?: Pick<HatRole, 'id' | 'metadata'>
): GuildMemberProfile[] {
  const eligibleWorkers = role ? workers.filter((worker) => matchesAllowedRoleTags(worker, role)) : workers;

  return [...eligibleWorkers]
    .sort((left, right) => compareRoleCandidates(left, right, role))
    .slice(0, Math.min(count, eligibleWorkers.length))
    .map((worker) =>
      createGuildProfile(worker, role?.id ? `candidate-${role.id}-${worker.id}` : `candidate-${worker.id}`)
    );
}

export function getRaidGuildCandidates(
  workers: Worker[],
  count = workers.length
): GuildMemberProfile[] {
  return buildCandidateProfiles(workers, count);
}

export function getRaidGuildCandidatesForRole(
  workers: Worker[],
  role: Pick<HatRole, 'id' | 'metadata'>,
  count = 2
): GuildMemberProfile[] {
  return buildCandidateProfiles(workers, count, role);
}

export function getPrimaryRaidGuildCandidateForRole(
  workers: Worker[],
  role: Pick<HatRole, 'id' | 'metadata'>
): GuildMemberProfile | undefined {
  return getRaidGuildCandidatesForRole(workers, role, 1)[0];
}

export function getRaidGuildRoster(workers: Worker[]): GuildMemberProfile[] {
  return [...DECOR_PROFILES, ...getRaidGuildCandidates(workers)];
}

export function findRaidGuildMember(
  workers: Worker[],
  workerId?: string
): GuildMemberProfile | undefined {
  if (!workerId) {
    return undefined;
  }

  const worker = workers.find((candidate) => candidate.id === workerId);
  return worker ? createGuildProfile(worker, `candidate-${worker.id}`) : undefined;
}
