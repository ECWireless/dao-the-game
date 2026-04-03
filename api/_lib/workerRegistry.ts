import { z } from 'zod';
import { createPublicClient, http, type Address } from 'viem';
import { baseSepolia } from 'viem/chains';
import type {
  WorkerRegistryEntry,
  WorkerRegistryEntryRecord,
  WorkerRegistryLiveMetadata,
  WorkerRegistrySubmitRequest
} from '../../src/contracts/workers';
import { HttpError } from './http.js';

const ERC_8004_TESTNET_REGISTRY_ADDRESS = '0x8004A818BFB912233c491871b3d84c89A494BD9e' as Address;
export const WORKER_REGISTRATION_CHAIN_ID = baseSepolia.id;
export const WORKER_PAYMENT_CHAIN_ID = baseSepolia.id;

const erc8004PublicClient = createPublicClient({
  chain: baseSepolia,
  transport: http()
});

const erc8004RegistryAbi = [
  {
    type: 'function',
    name: 'ownerOf',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: 'owner', type: 'address' }]
  },
  {
    type: 'function',
    name: 'tokenURI',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: 'uri', type: 'string' }]
  }
] as const;

const RoleTagSchema = z.enum(['ui-designer', 'brand-designer', 'frontend-engineer', 'code-reviewer']);

const WorkerManifestSchema = z.object({
  specVersion: z.literal('dao-the-game.worker.v1'),
  identity: z.object({
    name: z.string().min(1),
    handle: z.string().min(1),
    roleTag: RoleTagSchema,
    bio: z.string().min(1),
    shortPitch: z.string().min(1)
  }),
  pricing: z.object({
    asset: z.literal('USDC'),
    amount: z.string().regex(/^(0|[1-9]\d*)(\.\d+)?$/u),
    chargeModel: z.literal('per_request_attempt')
  })
});

const WorkerProfileSchema = z.object({
  specVersion: z.literal('dao-the-game.profile.v1'),
  identity: z.object({
    name: z.string().min(1),
    roleTag: RoleTagSchema
  }),
  summary: z.object({
    oneLiner: z.string().min(1),
    bestFit: z.string().min(1),
    processBullets: z.tuple([z.string().min(1), z.string().min(1)]).rest(z.string().min(1)),
    avoid: z.string().min(1).optional()
  })
});

const WorkerSelfTestSchema = z.object({
  specVersion: z.literal('dao-the-game.self-test.v1'),
  ok: z.boolean(),
  worker: z.object({
    name: z.string().min(1),
    roleTag: RoleTagSchema
  }),
  checks: z.object({
    manifestReachable: z.boolean(),
    profileReachable: z.boolean(),
    runReachable: z.boolean()
  }),
  preview: z
    .object({
      url: z.string().url().optional(),
      summary: z.string().min(1).optional()
    })
    .optional(),
  notes: z.array(z.string().min(1)).optional()
});

const WorkerRegistrySubmitRequestSchema = z.object({
  workerOrigin: z.string().min(1),
  erc8004TokenId: z.string().regex(/^\d+$/u),
  agentCardUri: z.string().min(1),
  engineerEmail: z.string().email().nullable().optional()
});

async function fetchJson<T>(url: string, schema: z.ZodSchema<T>, label: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new HttpError(400, `${label} is not reachable at ${url}.`);
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.toLowerCase().includes('application/json')) {
    throw new HttpError(400, `${label} must return application/json.`);
  }

  const payload = await response.json();
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    throw new HttpError(400, `${label} does not match the DAO the Game contract.`);
  }

  return parsed.data;
}

function buildWorkerUrl(workerOrigin: string, path: string): string {
  return new URL(path, `${workerOrigin}/`).toString();
}

export function normalizeWorkerOrigin(value: string): string {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new HttpError(400, 'workerOrigin must be a valid URL.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new HttpError(400, 'workerOrigin must use http or https.');
  }

  if (parsed.pathname !== '/' && parsed.pathname !== '') {
    throw new HttpError(400, 'workerOrigin must be a bare origin without a path.');
  }

  if (parsed.search || parsed.hash) {
    throw new HttpError(400, 'workerOrigin must not include query params or fragments.');
  }

  return parsed.origin;
}

export function parseWorkerRegistrySubmitRequest(body: unknown): WorkerRegistrySubmitRequest {
  const parsed = WorkerRegistrySubmitRequestSchema.safeParse(body);

  if (!parsed.success) {
    throw new HttpError(400, 'A valid worker registry payload is required.');
  }

  return {
    ...parsed.data,
    engineerEmail: parsed.data.engineerEmail ?? null
  };
}

export async function fetchWorkerLiveMetadata(workerOrigin: string): Promise<WorkerRegistryLiveMetadata> {
  const [manifest, profile, selfTest] = await Promise.all([
    fetchJson(
      buildWorkerUrl(workerOrigin, '/.well-known/dao-the-game/manifest.json'),
      WorkerManifestSchema,
      'manifest.json'
    ),
    fetchJson(
      buildWorkerUrl(workerOrigin, '/.well-known/dao-the-game/profile.json'),
      WorkerProfileSchema,
      'profile.json'
    ),
    fetchJson(
      buildWorkerUrl(workerOrigin, '/.well-known/dao-the-game/self-test'),
      WorkerSelfTestSchema,
      'self-test'
    )
  ]);

  if (
    manifest.identity.name !== profile.identity.name ||
    manifest.identity.name !== selfTest.worker.name ||
    manifest.identity.roleTag !== profile.identity.roleTag ||
    manifest.identity.roleTag !== selfTest.worker.roleTag
  ) {
    throw new HttpError(400, 'Worker manifest, profile, and self-test identity fields must agree.');
  }

  if (!selfTest.ok) {
    throw new HttpError(400, 'Worker self-test must report ok: true.');
  }

  if (!selfTest.checks.manifestReachable || !selfTest.checks.profileReachable || !selfTest.checks.runReachable) {
    throw new HttpError(400, 'Worker self-test must report manifest, profile, and run as reachable.');
  }

  return {
    manifest,
    profile,
    selfTest
  };
}

export async function verifyErc8004Registration(input: {
  erc8004TokenId: string;
  agentCardUri: string;
}): Promise<{ ownerAddress: string }> {
  const tokenId = BigInt(input.erc8004TokenId);

  let ownerAddress: string;
  let tokenUri: string;

  try {
    [ownerAddress, tokenUri] = await Promise.all([
      erc8004PublicClient.readContract({
        address: ERC_8004_TESTNET_REGISTRY_ADDRESS,
        abi: erc8004RegistryAbi,
        functionName: 'ownerOf',
        args: [tokenId]
      }),
      erc8004PublicClient.readContract({
        address: ERC_8004_TESTNET_REGISTRY_ADDRESS,
        abi: erc8004RegistryAbi,
        functionName: 'tokenURI',
        args: [tokenId]
      })
    ]);
  } catch {
    throw new HttpError(400, 'ERC-8004 token could not be verified on Base Sepolia.');
  }

  if (tokenUri !== input.agentCardUri) {
    throw new HttpError(400, 'Submitted agentCardUri does not match the onchain ERC-8004 token URI.');
  }

  return { ownerAddress };
}

export async function hydrateWorkerRegistryEntry(entry: WorkerRegistryEntryRecord): Promise<WorkerRegistryEntry> {
  try {
    const live = await fetchWorkerLiveMetadata(entry.workerOrigin);
    return { ...entry, live, liveError: null };
  } catch (error) {
    const liveError = error instanceof Error ? error.message : 'Failed to fetch worker metadata.';
    return { ...entry, liveError };
  }
}
