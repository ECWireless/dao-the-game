function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function optionalEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function optionalBooleanEnv(name: string): boolean {
  return optionalEnv(name) === 'true';
}

export function getDatabaseUrl(): string {
  return requireEnv('DATABASE_URL');
}

export function getPrivyAppId(): string {
  return requireEnv('VITE_PRIVY_APP_ID');
}

export function getPrivyAppSecret(): string {
  return requireEnv('PRIVY_APP_SECRET');
}

export function getPinataJwt(): string | null {
  return optionalEnv('PINATA_JWT');
}

export function getPinataGatewayBaseUrl(): string | null {
  const value = optionalEnv('PINATA_GATEWAY_BASE_URL');
  return value ? value.replace(/\/$/, '') : null;
}

export function getOpenAiApiKey(): string | null {
  return optionalEnv('OPENAI_API_KEY');
}

export function getArtifactDebugWorkers(): boolean {
  return optionalBooleanEnv('ARTIFACT_DEBUG_WORKERS');
}
