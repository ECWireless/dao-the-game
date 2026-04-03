import { readFileSync } from 'node:fs';
import type { Address, Chain } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { z } from 'zod';
import type { WorkerNetworksConfig } from '../types';

const CHAIN_BY_KEY = {
  base,
  'base-sepolia': baseSepolia
} as const satisfies Record<WorkerNetworksConfig['registration']['chainKey'], Chain>;

const workerNetworksPath = new URL('../../public/.well-known/dao-the-game/networks.json', import.meta.url);

const WorkerChainConfigSchema = z
  .object({
    chainKey: z.enum(['base-sepolia', 'base']),
    chainId: z.number().int().positive(),
    chainName: z.string().min(1),
    nativeSymbol: z.literal('ETH')
  })
  .strict();

const WorkerNetworksConfigSchema = z
  .object({
    specVersion: z.literal('dao-the-game.networks.v1'),
    phase: z.enum(['testing', 'production']),
    registration: WorkerChainConfigSchema.extend({
      erc8004RegistryAddress: z.string().min(1)
    }).strict(),
    payments: WorkerChainConfigSchema.extend({
      asset: z.literal('USDC'),
      protocol: z.literal('x402')
    }).strict(),
    notes: z.array(z.string().min(1))
  })
  .strict();

function loadWorkerNetworksConfig(): WorkerNetworksConfig {
  const resolvedPath = workerNetworksPath.pathname;
  let rawConfig = '';

  try {
    rawConfig = readFileSync(workerNetworksPath, 'utf8');
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read worker networks config at ${resolvedPath}: ${detail}`);
  }

  let parsedConfig: unknown;

  try {
    parsedConfig = JSON.parse(rawConfig) as unknown;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse worker networks config at ${resolvedPath}: ${detail}`);
  }

  const validatedConfig = WorkerNetworksConfigSchema.safeParse(parsedConfig);

  if (!validatedConfig.success) {
    throw new Error(
      `Invalid worker networks config at ${resolvedPath}: ${validatedConfig.error.message}`
    );
  }

  return validatedConfig.data;
}

export const WORKER_NETWORKS = loadWorkerNetworksConfig();

export const WORKER_REGISTRATION_CHAIN = CHAIN_BY_KEY[WORKER_NETWORKS.registration.chainKey];
export const WORKER_PAYMENT_CHAIN = CHAIN_BY_KEY[WORKER_NETWORKS.payments.chainKey];

export const WORKER_REGISTRATION_CHAIN_ID = WORKER_NETWORKS.registration.chainId;
export const WORKER_PAYMENT_CHAIN_ID = WORKER_NETWORKS.payments.chainId;
export const WORKER_ERC8004_REGISTRY_ADDRESS =
  WORKER_NETWORKS.registration.erc8004RegistryAddress as Address;
