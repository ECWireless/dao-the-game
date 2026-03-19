function trimEnvValue(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeApiBaseUrl(value: string | undefined): string {
  const trimmed = trimEnvValue(value);
  return trimmed ? trimmed.replace(/\/$/, '') : '';
}

export const clientEnv = {
  privyAppId: trimEnvValue(import.meta.env.VITE_PRIVY_APP_ID),
  apiBaseUrl: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  sepoliaRpcUrl: trimEnvValue(import.meta.env.VITE_SEPOLIA_RPC_URL),
  preferSmartWalletExecution: import.meta.env.VITE_PREFER_SMART_WALLET_EXECUTION === 'true',
  artifactDebugWorkers: import.meta.env.VITE_ARTIFACT_DEBUG_WORKERS === 'true'
};
