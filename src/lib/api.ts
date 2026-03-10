import { clientEnv } from '../config';

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

export async function postApi<TRequest, TResponse>(
  path: string,
  identityToken: string,
  body?: TRequest
): Promise<TResponse> {
  const headers = new Headers({
    authorization: `Bearer ${identityToken}`
  });

  let requestBody: string | undefined;

  if (body !== undefined) {
    headers.set('content-type', 'application/json');
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(getApiUrl(path), {
    method: 'POST',
    headers,
    body: requestBody
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(response.status, payload?.error ?? 'Request failed.');
  }

  return (await response.json()) as TResponse;
}
