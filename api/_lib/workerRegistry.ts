import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
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
} from '../../src/lib/workerNetworks';
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
const BLOCKED_HOSTNAMES = new Set(['localhost', 'metadata', 'metadata.google.internal']);
const BLOCKED_HOSTNAME_SUFFIXES = ['.localhost', '.local', '.internal'];

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

function normalizeHostForChecks(hostname: string): string {
  return hostname
    .replace(/^\[|\]$/gu, '')
    .replace(/\.$/u, '')
    .toLowerCase();
}

function isBlockedHostname(hostname: string): boolean {
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return true;
  }

  if (BLOCKED_HOSTNAME_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) {
    return true;
  }

  return !isIP(hostname) && !hostname.includes('.');
}

function isBlockedIpv4(address: string): boolean {
  const octets = address.split('.').map((part) => Number.parseInt(part, 10));

  if (octets.length !== 4 || octets.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return true;
  }

  const [a, b, c, d] = octets;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224 ||
    (a === 255 && b === 255 && c === 255 && d === 255)
  );
}

function isBlockedIpv6(address: string): boolean {
  const normalized = normalizeHostForChecks(address).split('%')[0];

  if (normalized === '::' || normalized === '::1') {
    return true;
  }

  if (normalized.startsWith('::ffff:')) {
    const mappedIpv4 = normalized.slice('::ffff:'.length);
    return isIP(mappedIpv4) === 4 ? isBlockedIpv4(mappedIpv4) : true;
  }

  return (
    normalized.startsWith('fc') || normalized.startsWith('fd') || /^fe[89ab]/u.test(normalized)
  );
}

function isBlockedAddress(address: string): boolean {
  const normalized = normalizeHostForChecks(address);
  const family = isIP(normalized);

  if (family === 4) {
    return isBlockedIpv4(normalized);
  }

  if (family === 6) {
    return isBlockedIpv6(normalized);
  }

  return true;
}

async function assertPublicWorkerHost(hostname: string): Promise<void> {
  const normalizedHostname = normalizeHostForChecks(hostname);

  if (isBlockedHostname(normalizedHostname)) {
    throw new HttpError(400, 'workerOrigin must use a public internet hostname.');
  }

  if (isIP(normalizedHostname)) {
    if (isBlockedAddress(normalizedHostname)) {
      throw new HttpError(400, 'workerOrigin must not target a private or local address.');
    }

    return;
  }

  let resolvedAddresses: Array<{ address: string; family: number }>;

  try {
    resolvedAddresses = await lookup(normalizedHostname, { all: true, verbatim: true });
  } catch {
    throw new HttpError(400, 'workerOrigin hostname could not be resolved.');
  }

  if (!resolvedAddresses.length) {
    throw new HttpError(400, 'workerOrigin hostname could not be resolved.');
  }

  if (resolvedAddresses.some((result) => isBlockedAddress(result.address))) {
    throw new HttpError(400, 'workerOrigin must resolve only to public internet addresses.');
  }
}

export async function normalizeWorkerOrigin(value: string): Promise<string> {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new HttpError(400, 'workerOrigin must be a valid URL.');
  }

  if (parsed.protocol !== 'https:') {
    throw new HttpError(400, 'workerOrigin must use https.');
  }

  if (parsed.pathname !== '/' && parsed.pathname !== '') {
    throw new HttpError(400, 'workerOrigin must be a bare origin without a path.');
  }

  if (parsed.search || parsed.hash) {
    throw new HttpError(400, 'workerOrigin must not include query params or fragments.');
  }

  await assertPublicWorkerHost(parsed.hostname);

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

export async function fetchWorkerLiveMetadata(
  workerOrigin: string
): Promise<WorkerRegistryLiveMetadata> {
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
  entry: WorkerRegistryEntryRecord
): Promise<WorkerRegistryEntry> {
  try {
    const live = await fetchWorkerLiveMetadata(entry.workerOrigin);
    return { ...entry, live, liveError: null };
  } catch (error) {
    const liveError = error instanceof Error ? error.message : 'Failed to fetch worker metadata.';
    return { ...entry, liveError };
  }
}
