import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { HttpError } from './http.js';

const BLOCKED_HOSTNAMES = new Set(['localhost', 'metadata', 'metadata.google.internal']);
const BLOCKED_HOSTNAME_SUFFIXES = ['.localhost', '.local', '.internal'];

type WorkerOriginValidationOptions = {
  errorStatus?: number;
  label?: string;
};

function normalizeHostForChecks(hostname: string): string {
  return hostname
    .replace(/^\[|\]$/gu, '')
    .replace(/\.$/u, '')
    .toLowerCase();
}

function buildOriginError(
  message: string,
  { errorStatus = 400, label = 'workerOrigin' }: WorkerOriginValidationOptions = {}
): HttpError {
  return new HttpError(errorStatus, `${label} ${message}`);
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

async function assertPublicWorkerHost(
  hostname: string,
  options?: WorkerOriginValidationOptions
): Promise<void> {
  const normalizedHostname = normalizeHostForChecks(hostname);

  if (isBlockedHostname(normalizedHostname)) {
    throw buildOriginError('must use a public internet hostname.', options);
  }

  if (isIP(normalizedHostname)) {
    if (isBlockedAddress(normalizedHostname)) {
      throw buildOriginError('must not target a private or local address.', options);
    }

    return;
  }

  let resolvedAddresses: Array<{ address: string; family: number }>;

  try {
    resolvedAddresses = await lookup(normalizedHostname, { all: true, verbatim: true });
  } catch {
    throw buildOriginError('hostname could not be resolved.', options);
  }

  if (!resolvedAddresses.length) {
    throw buildOriginError('hostname could not be resolved.', options);
  }

  if (resolvedAddresses.some((result) => isBlockedAddress(result.address))) {
    throw buildOriginError('must resolve only to public internet addresses.', options);
  }
}

export async function normalizeWorkerOrigin(
  value: string,
  options?: WorkerOriginValidationOptions
): Promise<string> {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw buildOriginError('must be a valid URL.', options);
  }

  if (parsed.protocol !== 'https:') {
    throw buildOriginError('must use https.', options);
  }

  if (parsed.pathname !== '/' && parsed.pathname !== '') {
    throw buildOriginError('must be a bare origin without a path.', options);
  }

  if (parsed.search || parsed.hash) {
    throw buildOriginError('must not include query params or fragments.', options);
  }

  await assertPublicWorkerHost(parsed.hostname, options);

  return parsed.origin;
}
