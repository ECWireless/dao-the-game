import { describe, expect, it } from 'vitest';
import type { HatRole } from '../../types';
import { buildWorkerPaymentPlan } from '../paymentPlan';
import { BUILTIN_WORKER_REGISTRY } from '../registry';

describe('buildWorkerPaymentPlan', () => {
  it('marks built-in assigned workers as free demo stages', () => {
    const roles: HatRole[] = [
      {
        id: 'hat-01',
        name: 'Frontend Engineer',
        assignedWorkerId: 'worker-01'
      }
    ];

    const plan = buildWorkerPaymentPlan(roles, BUILTIN_WORKER_REGISTRY);

    expect(plan.total).toBe(0);
    expect(plan.payableStageCount).toBe(0);
    expect(plan.freeStageCount).toBe(1);
    expect(plan.requiresApproval).toBe(false);
    expect(plan.stages[0]?.kind).toBe('free-demo');
  });

  it('marks registered external workers with nonzero pricing as paid stages', () => {
    const externalWorker = {
      ...BUILTIN_WORKER_REGISTRY[0]!,
      id: 'worker-external-01',
      registryRecordId: 'registry-worker-01',
      workerOrigin: 'https://clive.example.com',
      manifest: {
        ...BUILTIN_WORKER_REGISTRY[0]!.manifest,
        identity: {
          ...BUILTIN_WORKER_REGISTRY[0]!.manifest.identity,
          name: 'Clive Vector',
          handle: 'clive-vector'
        },
        pricing: {
          ...BUILTIN_WORKER_REGISTRY[0]!.manifest.pricing,
          amount: '0.08'
        }
      },
      registration: {
        ...BUILTIN_WORKER_REGISTRY[0]!.registration,
        erc8004Id: '88'
      }
    };

    const roles: HatRole[] = [
      {
        id: 'hat-01',
        name: 'Frontend Engineer',
        assignedWorkerId: 'worker-external-01'
      }
    ];

    const plan = buildWorkerPaymentPlan(roles, [externalWorker, ...BUILTIN_WORKER_REGISTRY]);

    expect(plan.total).toBe(8);
    expect(plan.payableStageCount).toBe(1);
    expect(plan.freeStageCount).toBe(0);
    expect(plan.requiresApproval).toBe(true);
    expect(plan.stages[0]?.kind).toBe('paid-external');
  });
});
