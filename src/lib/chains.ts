import type { Chain } from 'viem';
import { base, sepolia } from 'viem/chains';
import { clientEnv } from '../config';

const HATS_CHAIN_OPTIONS = {
  sepolia,
  base
} as const satisfies Record<'sepolia' | 'base', Chain>;

export const HATS_CHAIN_KEY = clientEnv.hatsChain;
export const HATS_CHAIN: Chain = HATS_CHAIN_OPTIONS[HATS_CHAIN_KEY];
export const HATS_CHAIN_ID = HATS_CHAIN.id;

export function getChainLabel(chainId?: number | null): string | null {
  if (!chainId) {
    return null;
  }

  const matchingChain = Object.values(HATS_CHAIN_OPTIONS).find((chain) => chain.id === chainId);
  return matchingChain ? matchingChain.name : `Chain ${chainId}`;
}
