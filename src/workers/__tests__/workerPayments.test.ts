// @vitest-environment node

import { describe, expect, it } from 'vitest';
import {
  buildArtifactPaymentStageEntry,
  buildArtifactPaymentSummary,
  getBuiltinFallbackWorker
} from '../../../api/_lib/workerPayments';
import type { WorkerPaymentStagePlan } from '../paymentPlan';
import { BUILTIN_WORKER_REGISTRY } from '../registry';

describe('workerPayments helpers', () => {
  it('returns the matching built-in slot worker for an external worker replacement', () => {
    const builtinRune = BUILTIN_WORKER_REGISTRY[0]!;
    const externalFrontendWorker = {
      ...builtinRune,
      registryRecordId: 'registry-worker-123',
      workerOrigin: 'https://frontend.example.com',
      manifest: {
        ...builtinRune.manifest,
        identity: {
          ...builtinRune.manifest.identity,
          name: 'Clive Vector',
          handle: 'clive-vector'
        },
        pricing: {
          ...builtinRune.manifest.pricing,
          amount: '0.08'
        }
      },
      name: 'Clive Vector',
      handle: 'clive-vector',
      registration: {
        ...builtinRune.registration,
        erc8004Id: '8453:17'
      }
    };

    expect(getBuiltinFallbackWorker(externalFrontendWorker)?.name).toBe('Rune Mercer');
  });

  it('builds a payment summary with paid, free, and fallback stage counts', () => {
    const externalPlan: WorkerPaymentStagePlan = {
      stageId: 'implementation',
      stageLabel: 'Implementation',
      roleId: 'role-implementation',
      roleName: 'Frontend Engineer',
      workerId: 'worker-01',
      workerName: 'Clive Vector',
      workerHandle: 'clive-vector',
      registryRecordId: 'registry-worker-123',
      workerOrigin: 'https://frontend.example.com',
      amount: 8,
      kind: 'paid-external'
    };
    const freePlan: WorkerPaymentStagePlan = {
      stageId: 'review',
      stageLabel: 'Review',
      roleId: 'role-review',
      roleName: 'Code Reviewer',
      workerId: 'worker-05',
      workerName: 'Sable Quill',
      workerHandle: 'sable-quill',
      registryRecordId: 'builtin-sable-quill',
      workerOrigin: null,
      amount: 0,
      kind: 'free-demo'
    };
    const fallbackPlan: WorkerPaymentStagePlan = {
      stageId: 'design',
      stageLabel: 'Design',
      roleId: 'role-design',
      roleName: 'UI Designer',
      workerId: 'worker-03',
      workerName: 'Kestrel Proxy',
      workerHandle: 'kestrel-proxy',
      registryRecordId: 'registry-worker-456',
      workerOrigin: 'https://design.example.com',
      amount: 6,
      kind: 'paid-external'
    };

    const summary = buildArtifactPaymentSummary({
      payerWalletAddress: '0x1234000000000000000000000000000000005678',
      wouldHavePaid: 14,
      stages: [
        buildArtifactPaymentStageEntry({
          plan: externalPlan,
          executedWorker: {
            ...BUILTIN_WORKER_REGISTRY[0]!,
            name: 'Clive Vector'
          },
          status: 'paid',
          note: 'Paid external worker ran.'
        }),
        buildArtifactPaymentStageEntry({
          plan: freePlan,
          executedWorker: BUILTIN_WORKER_REGISTRY[4]!,
          status: 'free',
          note: 'Demo worker stayed free.'
        }),
        buildArtifactPaymentStageEntry({
          plan: fallbackPlan,
          executedWorker: BUILTIN_WORKER_REGISTRY[2]!,
          status: 'fallback-free',
          note: 'Paid stage rerouted to a free demo worker.'
        })
      ]
    });

    expect(summary.totalPaid).toBe(8);
    expect(summary.wouldHavePaid).toBe(14);
    expect(summary.paidStageCount).toBe(1);
    expect(summary.freeStageCount).toBe(1);
    expect(summary.fallbackStageCount).toBe(1);
    expect(summary.chainId).toBe(8453);
  });
});
