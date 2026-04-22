import type { WorkerRegistryEntry } from '../contracts/workers';
import type { RoleTagId, Worker } from '../types';
import { getRoleTagLabel } from './roleTags';
import { BUILTIN_WORKER_REGISTRY } from './registry';

const BUILTIN_BY_ID = new Map(BUILTIN_WORKER_REGISTRY.map((worker) => [worker.id, worker]));

const FIXED_SLOT_BY_ROLE_TAG: Partial<Record<RoleTagId, string>> = {
  'ui-designer': 'worker-03',
  'brand-designer': 'worker-04'
};

const SHARED_SLOT_IDS_BY_ROLE_TAG: Partial<Record<RoleTagId, string[]>> = {
  'frontend-engineer': ['worker-01', 'worker-02'],
  'code-reviewer': ['worker-05', 'worker-06']
};

function getDefaultRoster(currentWorkers: Worker[]): Worker[] {
  if (!currentWorkers.length) {
    return BUILTIN_WORKER_REGISTRY;
  }

  return currentWorkers.map((worker) => BUILTIN_BY_ID.get(worker.id) ?? worker);
}

function adaptRegistryWorkerToSlot(entry: WorkerRegistryEntry, slotBlueprint: Worker): Worker {
  const manifest = entry.live?.manifest;

  if (!manifest) {
    return slotBlueprint;
  }

  const roleTag = manifest.identity.roleTag;
  const slotPresentation = slotBlueprint.presentation;
  const slotGameplay = slotBlueprint.gameplay;

  return {
    ...slotBlueprint,
    registryRecordId: entry.id,
    workerOrigin: entry.workerOrigin,
    manifest,
    registration: {
      status: 'registered',
      erc8004Id: entry.erc8004TokenId,
      ownerAddress: entry.ownerAddress,
      engineerEmail: entry.engineerEmail,
      submittedAt: entry.submittedAt,
      updatedAt: entry.updatedAt
    },
    availability: entry.availability,
    presentation: slotPresentation,
    name: manifest.identity.name,
    handle: manifest.identity.handle,
    roleTag,
    specialty: getRoleTagLabel(roleTag),
    bio: manifest.identity.bio,
    shortPitch: manifest.identity.shortPitch,
    accent: slotPresentation?.accent ?? slotBlueprint.accent,
    shadow: slotPresentation?.shadow ?? slotBlueprint.shadow,
    roleAffinity: slotGameplay.roleAffinity,
    capabilityVector: slotGameplay.capabilityVector,
    styleProfile: slotGameplay.styleProfile,
    temperament: slotGameplay.temperament,
    traits: slotGameplay.traits,
    gameplay: {
      ...slotGameplay,
      playerGuidance: {
        ...slotGameplay.playerGuidance,
        shortPitch: manifest.identity.shortPitch
      }
    }
  };
}

function chooseSlotId(
  roleTag: RoleTagId,
  occupiedSlots: Set<string>
): string | null {
  const fixedSlotId = FIXED_SLOT_BY_ROLE_TAG[roleTag];

  if (fixedSlotId) {
    return occupiedSlots.has(fixedSlotId) ? null : fixedSlotId;
  }

  const sharedSlotIds = SHARED_SLOT_IDS_BY_ROLE_TAG[roleTag] ?? [];
  return sharedSlotIds.find((slotId) => !occupiedSlots.has(slotId)) ?? null;
}

function isEntryRosterEligible(entry: WorkerRegistryEntry): entry is WorkerRegistryEntry & {
  live: NonNullable<WorkerRegistryEntry['live']>;
} {
  return (
    entry.availability === 'active' &&
    Boolean(entry.live?.manifest) &&
    entry.live?.selfTest?.ok !== false
  );
}

export function buildWorkerRosterWithAllowlist(
  currentWorkers: Worker[],
  allowlistRegistryKeys: string[],
  registryWorkers: WorkerRegistryEntry[]
): Worker[] {
  const defaultRoster = getDefaultRoster(currentWorkers);
  const registryByKey = new Map(registryWorkers.map((worker) => [worker.registryKey, worker]));
  const occupiedSlots = new Set<string>();
  const replacements = new Map<string, Worker>();

  for (const registryKey of allowlistRegistryKeys) {
    const entry = registryByKey.get(registryKey);

    if (!entry || !isEntryRosterEligible(entry)) {
      continue;
    }

    const roleTag = entry.live.manifest.identity.roleTag;
    const slotId = chooseSlotId(roleTag, occupiedSlots);

    if (!slotId) {
      continue;
    }

    const slotBlueprint = BUILTIN_BY_ID.get(slotId);

    if (!slotBlueprint) {
      continue;
    }

    replacements.set(slotId, adaptRegistryWorkerToSlot(entry, slotBlueprint));
    occupiedSlots.add(slotId);
  }

  return defaultRoster.map((worker) => replacements.get(worker.id) ?? worker);
}
