declare module '@x402/fetch' {
  export type Network = string;

  export class x402Client {
    constructor();
  }

  export function wrapFetchWithPayment(
    fetchImplementation: typeof globalThis.fetch,
    client: x402Client
  ): typeof globalThis.fetch;
}

declare module '@x402/evm/exact/client' {
  import type { LocalAccount } from 'viem/accounts';
  import type { x402Client } from '@x402/fetch';

  export function registerExactEvmScheme(
    client: x402Client,
    config: {
      signer: LocalAccount;
      networks?: string[];
      schemeOptions?: Record<number, { rpcUrl: string }>;
    }
  ): x402Client;
}
