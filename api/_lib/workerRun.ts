import { z } from 'zod';
import type { WorkerHandoff, WorkerRunRequest, WorkerRunResponse } from '../../src/types.js';
import { HttpError } from './http.js';

const WORKER_RUN_TIMEOUT_MS = 55_000;
const MAX_WORKER_RUN_RESPONSE_BYTES = 512 * 1024;

const WorkerContentTypeSchema = z.enum(['text/plain', 'text/html', 'application/json']);

const WorkerHandoffSchema: z.ZodType<WorkerHandoff> = z
  .object({
    summary: z.string().min(1),
    contentType: WorkerContentTypeSchema,
    content: z.string().min(1),
    notes: z.array(z.string().min(1)).optional()
  })
  .strict();

const WorkerRunResponseSchema: z.ZodType<WorkerRunResponse> = z.union([
  z
    .object({
      specVersion: z.literal('dao-the-game.run-response.v1'),
      ok: z.literal(true),
      handoff: WorkerHandoffSchema
    })
    .strict(),
  z
    .object({
      specVersion: z.literal('dao-the-game.run-response.v1'),
      ok: z.literal(false),
      error: z
        .object({
          code: z.string().min(1),
          message: z.string().min(1)
        })
        .strict()
    })
    .strict()
]);

function parseContentLength(response: Response): number | null {
  const rawContentLength = response.headers.get('content-length');

  if (!rawContentLength) {
    return null;
  }

  const contentLength = Number.parseInt(rawContentLength, 10);
  return Number.isFinite(contentLength) && contentLength >= 0 ? contentLength : null;
}

async function readJsonBodyWithLimit(response: Response): Promise<unknown> {
  const contentLength = parseContentLength(response);

  if (contentLength !== null && contentLength > MAX_WORKER_RUN_RESPONSE_BYTES) {
    throw new HttpError(502, 'Worker run response is too large.');
  }

  if (!response.body) {
    throw new HttpError(502, 'Worker run returned an empty response body.');
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
        throw new HttpError(502, 'Worker run returned an invalid response body.');
      }

      totalBytes += value.byteLength;

      if (totalBytes > MAX_WORKER_RUN_RESPONSE_BYTES) {
        throw new HttpError(502, 'Worker run response is too large.');
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
    throw new HttpError(502, 'Worker run must return valid JSON.');
  }
}

function buildWorkerRunUrl(workerOrigin: string): string {
  return new URL('/.well-known/dao-the-game/run', `${workerOrigin}/`).toString();
}

export async function runExternalWorker(
  workerOrigin: string,
  body: WorkerRunRequest
): Promise<WorkerRunResponse> {
  const response = await fetch(buildWorkerRunUrl(workerOrigin), {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json'
    },
    body: JSON.stringify(body),
    redirect: 'error',
    signal: AbortSignal.timeout(WORKER_RUN_TIMEOUT_MS)
  });

  if (!response.ok) {
    throw new HttpError(502, `Worker run failed with status ${response.status}.`);
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.toLowerCase().includes('application/json')) {
    throw new HttpError(502, 'Worker run must return application/json.');
  }

  const payload = await readJsonBodyWithLimit(response);
  const parsed = WorkerRunResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new HttpError(502, 'Worker run response does not match the DAO the Game contract.');
  }

  return parsed.data;
}
