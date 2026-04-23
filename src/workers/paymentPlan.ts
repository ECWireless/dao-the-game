import { getPipelineStageDefinition, inferPipelineStageId, sortRolesByPipelineStage } from '../pipeline';
import type { HatRole, PipelineStageId, Worker, WorkerPaymentStageKind } from '../types';
import { getWorkerLicenseCost } from './catalog';

export type WorkerPaymentStagePlan = {
  stageId: PipelineStageId;
  stageLabel: string;
  roleId?: string;
  roleName: string;
  workerId: string;
  workerName: string;
  workerHandle: string;
  registryRecordId: string;
  workerOrigin?: string | null;
  amount: number;
  kind: WorkerPaymentStageKind;
};

export type WorkerPaymentPlan = {
  stages: WorkerPaymentStagePlan[];
  total: number;
  payableStageCount: number;
  freeStageCount: number;
  requiresApproval: boolean;
};

function getConfiguredRunRoles(roles: HatRole[]): HatRole[] {
  const configuredRoles = roles.filter((role) => role.isConfigured);
  return configuredRoles.length > 0 ? configuredRoles : roles;
}

function isExternalWorker(worker: Worker): boolean {
  return Boolean(
    worker.workerOrigin &&
      worker.registration.erc8004Id &&
      !worker.registryRecordId.startsWith('builtin-')
  );
}

function getStageKind(worker: Worker, amount: number): WorkerPaymentStageKind {
  if (!isExternalWorker(worker)) {
    return 'free-demo';
  }

  return amount > 0 ? 'paid-external' : 'free-external';
}

export function buildWorkerPaymentPlan(roles: HatRole[], workers: Worker[]): WorkerPaymentPlan {
  const workerById = new Map(workers.map((worker) => [worker.id, worker]));
  const runnableRoles = sortRolesByPipelineStage(getConfiguredRunRoles(roles));
  const stages: WorkerPaymentStagePlan[] = [];

  for (const role of runnableRoles) {
    if (!role.assignedWorkerId) {
      continue;
    }

    const stageId = inferPipelineStageId(role);
    const worker = workerById.get(role.assignedWorkerId);

    if (!stageId || !worker) {
      continue;
    }

    const amount = getWorkerLicenseCost(worker);
    const stageLabel = getPipelineStageDefinition(stageId).label;

    stages.push({
      stageId,
      stageLabel,
      roleId: role.id,
      roleName: role.name,
      workerId: worker.id,
      workerName: worker.manifest.identity.name,
      workerHandle: worker.manifest.identity.handle,
      registryRecordId: worker.registryRecordId,
      workerOrigin: worker.workerOrigin,
      amount,
      kind: getStageKind(worker, amount)
    });
  }

  const total = stages
    .filter((stage) => stage.kind === 'paid-external')
    .reduce((sum, stage) => sum + stage.amount, 0);
  const payableStageCount = stages.filter((stage) => stage.kind === 'paid-external').length;
  const freeStageCount = stages.length - payableStageCount;

  return {
    stages,
    total,
    payableStageCount,
    freeStageCount,
    requiresApproval: payableStageCount > 0
  };
}
