import type { WorkerRegistryDetailResponse } from '../../src/contracts/workers';
import { getWorkerRegistryEntryById } from '../_lib/db.js';
import { hydrateWorkerRegistryEntry } from '../_lib/workerRegistry.js';
import { handleRouteError, HttpError, json, options, withCors } from '../_lib/http.js';

export const runtime = 'nodejs';

export const OPTIONS = options;

function getWorkerIdFromRequest(request: Request): string {
  const pathname = new URL(request.url).pathname;
  const id = pathname.split('/').filter(Boolean).at(-1);

  if (!id) {
    throw new HttpError(400, 'A worker id is required.');
  }

  return id;
}

export async function GET(request: Request): Promise<Response> {
  try {
    const workerId = getWorkerIdFromRequest(request);
    const entry = await getWorkerRegistryEntryById(workerId);

    if (!entry) {
      throw new HttpError(404, 'Worker not found.');
    }

    const worker = await hydrateWorkerRegistryEntry(entry);
    const response: WorkerRegistryDetailResponse = { worker };
    return withCors(request, json(response));
  } catch (error) {
    return handleRouteError(request, error);
  }
}
