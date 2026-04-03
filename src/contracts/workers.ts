import type { WorkerManifest, WorkerProfile, WorkerSelfTestResponse } from '../types';

export type WorkerRegistryEntryRecord = {
  id: string;
  registryKey: string;
  workerOrigin: string;
  erc8004TokenId: string;
  agentCardUri: string;
  registrationChainId: number;
  paymentChainId: number;
  ownerAddress: string;
  engineerEmail: string | null;
  availability: 'active' | 'paused';
  submittedAt: string;
  updatedAt: string;
};

export type WorkerRegistryLiveMetadata = {
  manifest: WorkerManifest;
  profile: WorkerProfile;
  selfTest: WorkerSelfTestResponse;
};

export type WorkerRegistryEntry = WorkerRegistryEntryRecord & {
  live?: WorkerRegistryLiveMetadata;
  liveError?: string | null;
};

export type WorkerRegistrySubmitRequest = {
  workerOrigin: string;
  erc8004TokenId: string;
  agentCardUri: string;
  engineerEmail?: string | null;
};

export type WorkerRegistrySubmitResponse = {
  worker: WorkerRegistryEntry;
};

export type WorkerRegistryListResponse = {
  workers: WorkerRegistryEntry[];
};

export type WorkerRegistryDetailResponse = {
  worker: WorkerRegistryEntry;
};
