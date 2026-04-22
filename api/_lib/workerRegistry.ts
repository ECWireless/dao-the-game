import { z } from 'zod';
import { createPublicClient, http } from 'viem';
import type {
  WorkerRegistryEntry,
  WorkerRegistryEntryRecord,
  WorkerRegistryLiveMetadata,
  WorkerRegistrySubmitRequest
} from '../../src/contracts/workers';
import {
  WORKER_ERC8004_REGISTRY_ADDRESS,
  WORKER_REGISTRATION_CHAIN,
  WORKER_REGISTRATION_CHAIN_ID
} from '../../src/lib/workerNetworks.js';
import { HttpError } from './http.js';

const erc8004PublicClient = createPublicClient({
  chain: WORKER_REGISTRATION_CHAIN,
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

const RoleTagSchema = z.enum([
  'ui-designer',
  'brand-designer',
  'frontend-engineer',
  'code-reviewer'
]);

const WorkerManifestSchema = z
  .object({
    specVersion: z.literal('dao-the-game.worker.v1'),
    identity: z
      .object({
        name: z.string().min(1),
        handle: z.string().min(1),
        roleTag: RoleTagSchema,
        avatarUrl: z.string().min(1).optional(),
        bio: z.string().min(1),
        shortPitch: z.string().min(1)
      })
      .strict(),
    pricing: z
      .object({
        asset: z.literal('USDC'),
        amount: z.string().regex(/^(0|[1-9]\d*)(\.\d+)?$/u),
        chargeModel: z.literal('per_request_attempt')
      })
      .strict()
  })
  .strict();

const WorkerProfileSchema = z
  .object({
    specVersion: z.literal('dao-the-game.profile.v1'),
    identity: z
      .object({
        name: z.string().min(1),
        roleTag: RoleTagSchema
      })
      .strict(),
    summary: z
      .object({
        oneLiner: z.string().min(1),
        bestFit: z.string().min(1),
        processBullets: z.tuple([z.string().min(1), z.string().min(1)]).rest(z.string().min(1)),
        avoid: z.string().min(1).optional()
      })
      .strict()
  })
  .strict();

const WorkerSelfTestSchema = z
  .object({
    specVersion: z.literal('dao-the-game.self-test.v1'),
    ok: z.boolean(),
    worker: z
      .object({
        name: z.string().min(1),
        roleTag: RoleTagSchema
      })
      .strict(),
    checks: z
      .object({
        manifestReachable: z.boolean(),
        profileReachable: z.boolean(),
        runReachable: z.boolean()
      })
      .strict(),
    preview: z
      .object({
        url: z.string().url().optional(),
        summary: z.string().min(1).optional()
      })
      .strict()
      .optional(),
    notes: z.array(z.string().min(1)).optional()
  })
  .strict();

const WorkerRegistrySubmitRequestSchema = z.object({
  workerOrigin: z.string().min(1),
  erc8004TokenId: z.string().regex(/^\d+$/u),
  agentCardUri: z.string().min(1),
  engineerEmail: z.string().email().nullable().optional()
});

const WORKER_FETCH_TIMEOUT_MS = 5000;
const MAX_WORKER_RESPONSE_BYTES = 256 * 1024;

export type WorkerRegistryHydrationMode = 'manifest' | 'full';

function parseContentLength(response: Response): number | null {
  const rawContentLength = response.headers.get('content-length');

  if (!rawContentLength) {
    return null;
  }

  const contentLength = Number.parseInt(rawContentLength, 10);
  return Number.isFinite(contentLength) && contentLength >= 0 ? contentLength : null;
}

async function readJsonBodyWithLimit(response: Response, label: string): Promise<unknown> {
  const contentLength = parseContentLength(response);

  if (contentLength !== null && contentLength > MAX_WORKER_RESPONSE_BYTES) {
    throw new HttpError(400, `${label} response is too large.`);
  }

  if (!response.body) {
    throw new HttpError(400, `${label} returned an empty response body.`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let rawBody = '';
  let done = false;

  try {
    while (!done) {
      const readResult = await reader.read();
      done = readResult.done;

      if (done) {
        break;
      }

      const value = readResult.value;

      if (!value) {
        throw new HttpError(400, `${label} returned an invalid response body.`);
      }

      totalBytes += value.byteLength;

      if (totalBytes > MAX_WORKER_RESPONSE_BYTES) {
        throw new HttpError(400, `${label} response is too large.`);
      }

      rawBody += decoder.decode(value, { stream: true });
    }

    rawBody += decoder.decode();
  } catch (error) {
    try {
      await reader.cancel();
    } catch {
      // ignore cancel failures while surfacing the original fetch error
    }

    throw error;
  } finally {
    reader.releaseLock();
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    throw new HttpError(400, `${label} must return valid JSON.`);
  }
}

async function fetchJson<T>(url: string, schema: z.ZodSchema<T>, label: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json'
    },
    redirect: 'error',
    signal: AbortSignal.timeout(WORKER_FETCH_TIMEOUT_MS)
  });

  if (!response.ok) {
    throw new HttpError(400, `${label} is not reachable at ${url}.`);
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.toLowerCase().includes('application/json')) {
    throw new HttpError(400, `${label} must return application/json.`);
  }

  const payload = await readJsonBodyWithLimit(response, label);
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    throw new HttpError(400, `${label} does not match the DAO the Game contract.`);
  }

  return parsed.data;
}

function buildWorkerUrl(workerOrigin: string, path: string): string {
  return new URL(path, `${workerOrigin}/`).toString();
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

export async function fetchWorkerManifestMetadata(
  workerOrigin: string
): Promise<Pick<WorkerRegistryLiveMetadata, 'manifest' | 'selfTest'>> {
  const [manifest, selfTest] = await Promise.all([
    fetchJson(
      buildWorkerUrl(workerOrigin, '/.well-known/dao-the-game/manifest.json'),
      WorkerManifestSchema,
      'manifest.json'
    ),
    fetchJson(
      buildWorkerUrl(workerOrigin, '/.well-known/dao-the-game/self-test'),
      WorkerSelfTestSchema,
      'self-test'
    )
  ]);

  if (
    manifest.identity.name !== selfTest.worker.name ||
    manifest.identity.roleTag !== selfTest.worker.roleTag
  ) {
    throw new HttpError(400, 'Worker manifest and self-test identity fields must agree.');
  }

  if (!selfTest.ok) {
    throw new HttpError(400, 'Worker self-test must report ok: true.');
  }

  if (
    !selfTest.checks.manifestReachable ||
    !selfTest.checks.profileReachable ||
    !selfTest.checks.runReachable
  ) {
    throw new HttpError(
      400,
      'Worker self-test must report manifest, profile, and run as reachable.'
    );
  }

  return {
    manifest,
    selfTest
  };
}

export async function fetchWorkerLiveMetadata(
  workerOrigin: string
): Promise<WorkerRegistryLiveMetadata> {
  const [{ manifest, selfTest }, profile] = await Promise.all([
    fetchWorkerManifestMetadata(workerOrigin),
    fetchJson(
      buildWorkerUrl(workerOrigin, '/.well-known/dao-the-game/profile.json'),
      WorkerProfileSchema,
      'profile.json'
    )
  ]);

  if (
    manifest.identity.name !== profile.identity.name ||
    manifest.identity.roleTag !== profile.identity.roleTag
  ) {
    throw new HttpError(400, 'Worker manifest, profile, and self-test identity fields must agree.');
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
        address: WORKER_ERC8004_REGISTRY_ADDRESS,
        abi: erc8004RegistryAbi,
        functionName: 'ownerOf',
        args: [tokenId]
      }),
      erc8004PublicClient.readContract({
        address: WORKER_ERC8004_REGISTRY_ADDRESS,
        abi: erc8004RegistryAbi,
        functionName: 'tokenURI',
        args: [tokenId]
      })
    ]);
  } catch {
    throw new HttpError(
      400,
      `ERC-8004 token could not be verified on registration chain ${WORKER_REGISTRATION_CHAIN_ID}.`
    );
  }

  if (tokenUri !== input.agentCardUri) {
    throw new HttpError(
      400,
      'Submitted agentCardUri does not match the onchain ERC-8004 token URI.'
    );
  }

  return { ownerAddress };
}

export async function hydrateWorkerRegistryEntry(
  entry: WorkerRegistryEntryRecord,
  mode: WorkerRegistryHydrationMode = 'full'
): Promise<WorkerRegistryEntry> {
  try {
    const live =
      mode === 'manifest'
        ? await fetchWorkerManifestMetadata(entry.workerOrigin)
        : await fetchWorkerLiveMetadata(entry.workerOrigin);
    return { ...entry, live, liveError: null };
  } catch (error) {
    const liveError = error instanceof Error ? error.message : 'Failed to fetch worker metadata.';
    return { ...entry, liveError };
  }
}
