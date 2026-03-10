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
  apiBaseUrl: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL)
};
