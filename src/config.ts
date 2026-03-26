function trimEnvValue(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeApiBaseUrl(value: string | undefined): string {
  const trimmed = trimEnvValue(value);
  return trimmed ? trimmed.replace(/\/$/, '') : '';
}

function normalizeHatsChain(value: string | undefined): 'sepolia' | 'base' {
  const trimmed = value?.trim().toLowerCase();

  if (trimmed === 'sepolia' || trimmed === 'base') {
    return trimmed;
  }

  return import.meta.env.PROD ? 'base' : 'sepolia';
}

export const clientEnv = {
  privyAppId: trimEnvValue(import.meta.env.VITE_PRIVY_APP_ID),
  apiBaseUrl: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  hatsChain: normalizeHatsChain(import.meta.env.VITE_HATS_CHAIN),
  preferSmartWalletExecution: import.meta.env.VITE_PREFER_SMART_WALLET_EXECUTION === 'true',
  artifactDebugWorkers: import.meta.env.VITE_ARTIFACT_DEBUG_WORKERS === 'true'
};
