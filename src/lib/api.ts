import { clientEnv } from '../config';
import type { ArtifactDeployEvent, ArtifactDeployRequest } from '../contracts/artifact';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getApiUrl(path: string): string {
  return `${clientEnv.apiBaseUrl}${path}`;
}

function createAuthorizedJsonRequest(identityToken: string, body?: unknown): RequestInit {
  const headers = new Headers({
    authorization: `Bearer ${identityToken}`
  });

  let requestBody: string | undefined;

  if (body !== undefined) {
    headers.set('content-type', 'application/json');
    requestBody = JSON.stringify(body);
  }

  return {
    method: 'POST',
    headers,
    body: requestBody
  };
}

export async function postApi<TRequest, TResponse>(
  path: string,
  identityToken: string,
  body?: TRequest
): Promise<TResponse> {
  const response = await fetch(getApiUrl(path), createAuthorizedJsonRequest(identityToken, body));

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(response.status, payload?.error ?? 'Request failed.');
  }

  return (await response.json()) as TResponse;
}

export async function deployArtifactWithProgress(
  identityToken: string,
  body: ArtifactDeployRequest,
  onEvent?: (event: ArtifactDeployEvent) => void
): Promise<{ artifact: ArtifactDeployRequest['artifact'] }> {
  const response = await fetch(
    getApiUrl('/api/artifact/deploy'),
    createAuthorizedJsonRequest(identityToken, body)
  );

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(response.status, payload?.error ?? 'Request failed.');
  }

  if (!response.body) {
    throw new ApiError(500, 'Artifact deployment stream was unavailable.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let latestArtifact: ArtifactDeployRequest['artifact'] | null = null;
  let streamError: string | null = null;

  let isDone = false;

  while (!isDone) {
    const { value, done } = await reader.read();
    isDone = done;

    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed) {
        continue;
      }

      const event = JSON.parse(trimmed) as ArtifactDeployEvent;
      onEvent?.(event);

      if (event.type === 'artifact-generated' || event.type === 'artifact-deployed') {
        latestArtifact = event.artifact;
      }

      if (event.type === 'error') {
        streamError = event.error;
      }
    }

  }

  if (streamError) {
    throw new ApiError(500, streamError);
  }

  if (!latestArtifact) {
    throw new ApiError(500, 'Artifact deployment did not return a generated artifact.');
  }

  return { artifact: latestArtifact };
}
