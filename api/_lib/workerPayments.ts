import { createViemAccount } from '@privy-io/node/viem';
import { registerExactEvmScheme } from '@x402/evm/exact/client';
import { wrapFetchWithPayment, x402Client, type Network } from '@x402/fetch';
import { getAddress, isAddress, type Address } from 'viem';
import type { ArtifactWorkerPaymentsPreference } from '../../src/contracts/artifact.js';
import {
  WORKER_NETWORKS,
  WORKER_PAYMENT_CHAIN,
  WORKER_PAYMENT_CHAIN_ID
} from '../../src/lib/workerNetworks.js';
import type {
  ArtifactPaymentStageEntry,
  ArtifactPaymentStageStatus,
  ArtifactPaymentSummary,
  Worker
} from '../../src/types.js';
import type { WorkerPaymentStagePlan } from '../../src/workers/paymentPlan.js';
import { BUILTIN_WORKER_REGISTRY } from '../../src/workers/registry.js';
import { HttpError } from './http.js';
import {
  getEmbeddedPrivyEthereumWallet,
  getPrivyClient,
  type VerifiedPrivyUser
} from './privy.js';

const BUILTIN_WORKER_BY_ID = new Map(BUILTIN_WORKER_REGISTRY.map((worker) => [worker.id, worker]));

export type WorkerPaymentExecutionContext = {
  mode: ArtifactWorkerPaymentsPreference['mode'];
  payerWalletAddress: string | null;
  fetchWithPayment: typeof fetch | null;
};

function normalizeOptionalPayerWalletAddress(walletAddress?: string | null): string | null {
  if (typeof walletAddress !== 'string') {
    return null;
  }

  const trimmedWalletAddress = walletAddress.trim();

  if (!trimmedWalletAddress) {
    return null;
  }

  if (!isAddress(trimmedWalletAddress)) {
    throw new HttpError(400, 'A valid Base wallet address is required for worker payments.');
  }

  return getAddress(trimmedWalletAddress);
}

export async function createWorkerPaymentExecutionContext({
  user,
  identityToken,
  preference
}: {
  user: VerifiedPrivyUser;
  identityToken: string;
  preference: ArtifactWorkerPaymentsPreference;
}): Promise<WorkerPaymentExecutionContext> {
  if (preference.mode === 'demo-fallback') {
    return {
      mode: preference.mode,
      payerWalletAddress: normalizeOptionalPayerWalletAddress(preference.walletAddress),
      fetchWithPayment: null
    };
  }

  const normalizedPayerWalletAddress = normalizeOptionalPayerWalletAddress(preference.walletAddress);

  if (!normalizedPayerWalletAddress) {
    throw new HttpError(400, 'A valid Base wallet address is required for worker payments.');
  }

  const wallet = getEmbeddedPrivyEthereumWallet(user, normalizedPayerWalletAddress);
  const walletId = wallet.id;

  if (!walletId) {
    throw new HttpError(403, 'The selected embedded wallet is unavailable for worker payments.');
  }

  const signer = createViemAccount(getPrivyClient(), {
    walletId,
    address: wallet.address as Address,
    authorizationContext: {
      user_jwts: [identityToken]
    }
  });
  const client = new x402Client();
  const paymentNetwork = `eip155:${WORKER_PAYMENT_CHAIN_ID}` as Network;
  const rpcUrl = WORKER_PAYMENT_CHAIN.rpcUrls.default.http[0];

  registerExactEvmScheme(client, {
    signer,
    networks: [paymentNetwork],
    ...(rpcUrl
      ? {
          schemeOptions: {
            [WORKER_PAYMENT_CHAIN_ID]: {
              rpcUrl
            }
          }
        }
      : {})
  });

  return {
    mode: preference.mode,
    payerWalletAddress: wallet.address,
    fetchWithPayment: wrapFetchWithPayment(fetch, client)
  };
}

export function getBuiltinFallbackWorker(worker: Worker): Worker | null {
  return BUILTIN_WORKER_BY_ID.get(worker.id) ?? BUILTIN_WORKER_REGISTRY.find((entry) => entry.roleTag === worker.roleTag) ?? null;
}

export function buildArtifactPaymentStageEntry({
  plan,
  executedWorker,
  status,
  note
}: {
  plan: WorkerPaymentStagePlan;
  executedWorker: Worker;
  status: ArtifactPaymentStageStatus;
  note: string;
}): ArtifactPaymentStageEntry {
  return {
    stageId: plan.stageId,
    stageLabel: plan.stageLabel,
    roleName: plan.roleName,
    plannedWorkerId: plan.workerId,
    plannedWorkerName: plan.workerName,
    executedWorkerId: executedWorker.id,
    executedWorkerName: executedWorker.name,
    amount: plan.amount,
    kind: plan.kind,
    status,
    note
  };
}

export function buildArtifactPaymentSummary({
  payerWalletAddress,
  stages,
  wouldHavePaid
}: {
  payerWalletAddress: string | null;
  stages: ArtifactPaymentStageEntry[];
  wouldHavePaid: number;
}): ArtifactPaymentSummary {
  const totalPaid = stages.reduce(
    (sum, stage) => (stage.status === 'paid' ? sum + stage.amount : sum),
    0
  );
  const paidStageCount = stages.filter((stage) => stage.status === 'paid').length;
  const fallbackStageCount = stages.filter((stage) => stage.status === 'fallback-free').length;
  const freeStageCount = stages.filter((stage) => stage.status === 'free').length;

  return {
    asset: 'USDC',
    protocol: 'x402',
    chainId: WORKER_PAYMENT_CHAIN_ID,
    chainName: WORKER_NETWORKS.payments.chainName,
    payerWalletAddress,
    totalPaid,
    wouldHavePaid,
    paidStageCount,
    freeStageCount,
    fallbackStageCount,
    stages
  };
}
