import { describe, expect, it } from 'vitest';
import type { HatRole, PipelineStageResult } from '../../types';
import { buildWorkerPaymentPlan, buildWorkerPaymentPlanFromPipeline } from '../paymentPlan';
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

  it('only charges for the first role assigned to a pipeline stage', () => {
    const paidExternalWorker = {
      ...BUILTIN_WORKER_REGISTRY[0]!,
      id: 'worker-external-duplicate',
      registryRecordId: 'registry-worker-duplicate',
      workerOrigin: 'https://duplicate.example.com',
      manifest: {
        ...BUILTIN_WORKER_REGISTRY[0]!.manifest,
        identity: {
          ...BUILTIN_WORKER_REGISTRY[0]!.manifest.identity,
          name: 'Duplicate Stage Worker',
          handle: 'duplicate-stage-worker'
        },
        pricing: {
          ...BUILTIN_WORKER_REGISTRY[0]!.manifest.pricing,
          amount: '0.08'
        }
      },
      registration: {
        ...BUILTIN_WORKER_REGISTRY[0]!.registration,
        erc8004Id: '99'
      }
    };

    const roles: HatRole[] = [
      {
        id: 'hat-frontend-primary',
        name: 'Frontend Engineer',
        assignedWorkerId: 'worker-01'
      },
      {
        id: 'hat-frontend-duplicate',
        name: 'Frontend Engineer Backup',
        assignedWorkerId: 'worker-external-duplicate'
      }
    ];

    const plan = buildWorkerPaymentPlan(roles, [paidExternalWorker, ...BUILTIN_WORKER_REGISTRY]);

    expect(plan.total).toBe(0);
    expect(plan.payableStageCount).toBe(0);
    expect(plan.freeStageCount).toBe(1);
    expect(plan.requiresApproval).toBe(false);
    expect(plan.stages).toHaveLength(1);
    expect(plan.stages[0]?.workerId).toBe('worker-01');
    expect(plan.stages[0]?.kind).toBe('free-demo');
  });

  it('derives approval from resolved pipeline stages instead of raw role assignments', () => {
    const paidExternalWorker = {
      ...BUILTIN_WORKER_REGISTRY[0]!,
      id: 'worker-external-resolved',
      registryRecordId: 'registry-worker-resolved',
      workerOrigin: 'https://resolved.example.com',
      manifest: {
        ...BUILTIN_WORKER_REGISTRY[0]!.manifest,
        identity: {
          ...BUILTIN_WORKER_REGISTRY[0]!.manifest.identity,
          name: 'Resolved External Worker',
          handle: 'resolved-external-worker'
        },
        pricing: {
          ...BUILTIN_WORKER_REGISTRY[0]!.manifest.pricing,
          amount: '0.08'
        }
      },
      registration: {
        ...BUILTIN_WORKER_REGISTRY[0]!.registration,
        erc8004Id: '100'
      }
    };

    const roles: HatRole[] = [
      {
        id: 'role-implementation',
        name: 'Frontend Engineer',
        assignedWorkerId: 'worker-external-resolved'
      }
    ];
    const pipelineStages: PipelineStageResult[] = [
      {
        id: 'design',
        label: 'Design pass',
        score: 72,
        qualityDelta: 4,
        cost: 8,
        status: 'steady',
        note: 'Design pass stayed stable.'
      },
      {
        id: 'implementation',
        label: 'Implementation pass',
        roleId: 'role-implementation',
        roleName: 'Frontend Engineer',
        assignedWorkerId: 'worker-01',
        score: 78,
        qualityDelta: 9,
        cost: 12,
        status: 'strong',
        note: 'Implementation pass landed cleanly.'
      }
    ];

    const plan = buildWorkerPaymentPlanFromPipeline(pipelineStages, roles, [
      paidExternalWorker,
      ...BUILTIN_WORKER_REGISTRY
    ]);

    expect(plan.total).toBe(0);
    expect(plan.payableStageCount).toBe(0);
    expect(plan.freeStageCount).toBe(1);
    expect(plan.requiresApproval).toBe(false);
    expect(plan.stages).toHaveLength(1);
    expect(plan.stages[0]?.workerId).toBe('worker-01');
    expect(plan.stages[0]?.kind).toBe('free-demo');
  });
});
