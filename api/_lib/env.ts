function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
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
