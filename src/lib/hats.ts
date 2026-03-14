import {
  HATS_ABI,
  HATS_V1,
  HatsClient
} from '@hatsprotocol/sdk-v1-core';
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseEventLogs,
  type Address,
  type Hash,
  type Hex,
  type PublicClient,
  type WalletClient
} from 'viem';
import { sepolia } from 'viem/chains';
import { clientEnv } from '../config';

export const HATS_CHAIN = sepolia;
export const HATS_CHAIN_ID = sepolia.id;
export const HATS_CONTRACT_ADDRESS = HATS_V1 as Address;

const hatsPublicClient = createPublicClient({
  chain: HATS_CHAIN,
  transport: http(clientEnv.sepoliaRpcUrl ?? undefined)
});

const hatsCallDataClient = new HatsClient({
  chainId: HATS_CHAIN_ID,
  publicClient: hatsPublicClient
});

type EmbeddedExecutionWallet = {
  address: string;
  switchChain: (targetChainId: `0x${string}` | number) => Promise<void>;
  getEthereumProvider: () => Promise<unknown>;
};

type TransactionRequest = {
  to: Address;
  data: Hex;
};

type SupportedSmartWalletClient = {
  sendTransaction: (input: TransactionRequest) => Promise<Hash>;
};

export type HatsExecutionClient =
  | {
      kind: 'smart';
      address: Address;
      client: SupportedSmartWalletClient;
    }
  | {
      kind: 'embedded';
      address: Address;
      client: WalletClient;
    };

export function getHatsPublicClient(): PublicClient {
  return hatsPublicClient;
}

export async function createEmbeddedWalletExecutionClient(
  wallet: EmbeddedExecutionWallet
): Promise<HatsExecutionClient> {
  await wallet.switchChain(HATS_CHAIN_ID);
  const provider = await wallet.getEthereumProvider();
  const client = createWalletClient({
    account: wallet.address as Address,
    chain: HATS_CHAIN,
    transport: custom(provider as Parameters<typeof custom>[0])
  });

  return {
    kind: 'embedded',
    address: wallet.address as Address,
    client
  };
}

export async function sendHatsTransaction(
  executionClient: HatsExecutionClient,
  request: TransactionRequest
): Promise<Hash> {
  if (executionClient.kind === 'smart') {
    return executionClient.client.sendTransaction(request);
  }

  return executionClient.client.sendTransaction({
    account: executionClient.address,
    chain: HATS_CHAIN,
    ...request
  });
}

export async function waitForHatsReceipt(hash: Hash) {
  return hatsPublicClient.waitForTransactionReceipt({ hash });
}

function parseLatestCreatedHatId(logs: Parameters<typeof parseEventLogs>[0]['logs']): bigint {
  const events = parseEventLogs({
    abi: HATS_ABI,
    eventName: 'HatCreated',
    logs
  });

  const latestEvent = events.at(-1);
  const hatId = latestEvent?.args.id;

  if (typeof hatId !== 'bigint') {
    throw new Error('Hats transaction completed, but no HatCreated event was found.');
  }

  return hatId;
}

export async function mintTopHat(args: {
  executionClient: HatsExecutionClient;
  wearerAddress: Address;
  details: string;
  imageUri?: string;
}): Promise<{ hatId: bigint; txHash: Hash }> {
  const { callData } = hatsCallDataClient.mintTopHatCallData({
    target: args.wearerAddress,
    details: args.details,
    imageURI: args.imageUri
  });
  const txHash = await sendHatsTransaction(args.executionClient, {
    to: HATS_CONTRACT_ADDRESS,
    data: callData
  });
  const receipt = await waitForHatsReceipt(txHash);

  return {
    hatId: parseLatestCreatedHatId(receipt.logs),
    txHash
  };
}

export async function changeHatDetails(args: {
  executionClient: HatsExecutionClient;
  hatId: bigint;
  details: string;
}): Promise<{ txHash: Hash }> {
  const { callData } = hatsCallDataClient.changeHatDetailsCallData({
    hatId: args.hatId,
    newDetails: args.details
  });
  const txHash = await sendHatsTransaction(args.executionClient, {
    to: HATS_CONTRACT_ADDRESS,
    data: callData
  });
  await waitForHatsReceipt(txHash);

  return { txHash };
}

export async function createRoleHat(args: {
  executionClient: HatsExecutionClient;
  adminHatId: bigint;
  details: string;
  eligibilityAddress: Address;
  toggleAddress: Address;
  maxSupply?: number;
}): Promise<{ hatId: bigint; txHash: Hash }> {
  const { callData } = hatsCallDataClient.createHatCallData({
    admin: args.adminHatId,
    details: args.details,
    maxSupply: args.maxSupply ?? 1,
    eligibility: args.eligibilityAddress,
    toggle: args.toggleAddress,
    mutable: true
  });
  const txHash = await sendHatsTransaction(args.executionClient, {
    to: HATS_CONTRACT_ADDRESS,
    data: callData
  });
  const receipt = await waitForHatsReceipt(txHash);

  return {
    hatId: parseLatestCreatedHatId(receipt.logs),
    txHash
  };
}
