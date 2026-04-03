import type {
  WorkerRegistryEntry,
  WorkerRegistryListResponse,
  WorkerRegistrySubmitResponse
} from '../src/contracts/workers';
import {
  WORKER_PAYMENT_CHAIN_ID,
  WORKER_REGISTRATION_CHAIN_ID
} from '../src/lib/workerNetworks.js';
import {
  listWorkerRegistryEntries,
  upsertWorkerRegistryEntry
} from './_lib/db.js';
import {
  fetchWorkerLiveMetadata,
  hydrateWorkerRegistryEntry,
  normalizeWorkerOrigin,
  parseWorkerRegistrySubmitRequest,
  verifyErc8004Registration
} from './_lib/workerRegistry.js';
import { handleRouteError, json, options, parseOptionalJsonBody, withCors } from './_lib/http.js';

export const runtime = 'nodejs';

export const OPTIONS = options;

const HYDRATION_BATCH_SIZE = 5;

function shouldHydrateWorkers(request: Request): boolean {
  const hydrate = new URL(request.url).searchParams.get('hydrate');
  return hydrate === '1' || hydrate === 'true';
}

async function hydrateWorkersInBatches(
  entries: Awaited<ReturnType<typeof listWorkerRegistryEntries>>
): Promise<WorkerRegistryEntry[]> {
  const hydratedWorkers: WorkerRegistryEntry[] = [];

  for (let index = 0; index < entries.length; index += HYDRATION_BATCH_SIZE) {
    const batch = entries.slice(index, index + HYDRATION_BATCH_SIZE);
    const hydratedBatch = await Promise.all(batch.map(hydrateWorkerRegistryEntry));
    hydratedWorkers.push(...hydratedBatch);
  }

  return hydratedWorkers;
}

export async function GET(request: Request): Promise<Response> {
  try {
    const entries = await listWorkerRegistryEntries();
    const workers = shouldHydrateWorkers(request) ? await hydrateWorkersInBatches(entries) : entries;
    const response: WorkerRegistryListResponse = { workers };
    return withCors(request, json(response));
  } catch (error) {
    return handleRouteError(request, error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await parseOptionalJsonBody<unknown>(request);
    const parsed = parseWorkerRegistrySubmitRequest(body);
    const workerOrigin = await normalizeWorkerOrigin(parsed.workerOrigin);

    const [live, registration] = await Promise.all([
      fetchWorkerLiveMetadata(workerOrigin),
      verifyErc8004Registration({
        erc8004TokenId: parsed.erc8004TokenId,
        agentCardUri: parsed.agentCardUri
      })
    ]);

    const entry = await upsertWorkerRegistryEntry({
      workerOrigin,
      erc8004TokenId: parsed.erc8004TokenId,
      agentCardUri: parsed.agentCardUri,
      registrationChainId: WORKER_REGISTRATION_CHAIN_ID,
      paymentChainId: WORKER_PAYMENT_CHAIN_ID,
      ownerAddress: registration.ownerAddress,
      engineerEmail: parsed.engineerEmail ?? null
    });

    const response: WorkerRegistrySubmitResponse = {
      worker: {
        ...entry,
        live,
        liveError: null
      }
    };

    return withCors(request, json(response, { status: 201 }));
  } catch (error) {
    return handleRouteError(request, error);
  }
}
