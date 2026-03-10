export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getCorsHeaders(request: Request): Headers {
  const headers = new Headers();
  const origin = request.headers.get('origin');

  if (origin && origin === new URL(request.url).origin) {
    headers.set('access-control-allow-origin', origin);
    headers.set('vary', 'origin');

    headers.set('access-control-allow-methods', 'POST, OPTIONS');
    headers.set('access-control-allow-headers', 'authorization, content-type');
    headers.set('access-control-max-age', '86400');
  }

  return headers;
}

export function json(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, init);
}

export function withCors(request: Request, response: Response): Response {
  const headers = new Headers(response.headers);
  const corsHeaders = getCorsHeaders(request);

  corsHeaders.forEach((value, key) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export function options(request: Request): Response {
  return withCors(request, new Response(null, { status: 204 }));
}

export async function parseOptionalJsonBody<T>(request: Request): Promise<T | null> {
  const rawBody = await request.text();

  if (!rawBody.trim()) {
    return null;
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch {
    throw new HttpError(400, 'Request body must be valid JSON.');
  }
}

export function handleRouteError(request: Request, error: unknown): Response {
  if (error instanceof HttpError) {
    return withCors(request, json({ error: error.message }, { status: error.status }));
  }

  console.error(error);
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const message =
    isDevelopment && error instanceof Error ? error.message : 'Internal server error.';

  return withCors(request, json({ error: message }, { status: 500 }));
}
