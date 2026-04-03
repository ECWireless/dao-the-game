import { readFileSync } from 'node:fs';
import type { Address, Chain } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import type { WorkerNetworksConfig } from '../types';

const CHAIN_BY_KEY = {
  base,
  'base-sepolia': baseSepolia
} as const satisfies Record<WorkerNetworksConfig['registration']['chainKey'], Chain>;

const workerNetworksPath = new URL('../../public/.well-known/dao-the-game/networks.json', import.meta.url);

export const WORKER_NETWORKS = JSON.parse(
  readFileSync(workerNetworksPath, 'utf8')
) as WorkerNetworksConfig;

export const WORKER_REGISTRATION_CHAIN = CHAIN_BY_KEY[WORKER_NETWORKS.registration.chainKey];
export const WORKER_PAYMENT_CHAIN = CHAIN_BY_KEY[WORKER_NETWORKS.payments.chainKey];

export const WORKER_REGISTRATION_CHAIN_ID = WORKER_NETWORKS.registration.chainId;
export const WORKER_PAYMENT_CHAIN_ID = WORKER_NETWORKS.payments.chainId;
export const WORKER_ERC8004_REGISTRY_ADDRESS =
  WORKER_NETWORKS.registration.erc8004RegistryAddress as Address;
