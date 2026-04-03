import type { Address, Chain } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import type { WorkerNetworksConfig } from '../types';
import workerNetworksJson from '../../public/.well-known/dao-the-game/networks.json';

const CHAIN_BY_KEY = {
  base,
  'base-sepolia': baseSepolia
} as const satisfies Record<WorkerNetworksConfig['registration']['chainKey'], Chain>;

export const WORKER_NETWORKS = workerNetworksJson as WorkerNetworksConfig;

export const WORKER_REGISTRATION_CHAIN = CHAIN_BY_KEY[WORKER_NETWORKS.registration.chainKey];
export const WORKER_PAYMENT_CHAIN = CHAIN_BY_KEY[WORKER_NETWORKS.payments.chainKey];

export const WORKER_REGISTRATION_CHAIN_ID = WORKER_NETWORKS.registration.chainId;
export const WORKER_PAYMENT_CHAIN_ID = WORKER_NETWORKS.payments.chainId;
export const WORKER_ERC8004_REGISTRY_ADDRESS =
  WORKER_NETWORKS.registration.erc8004RegistryAddress as Address;
