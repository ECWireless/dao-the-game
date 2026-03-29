import type { Worker, HatRole, PipelineStageId } from '../../types';
import { getPipelineStageDefinition, inferPipelineStageId, sortRolesByPipelineStage } from '../../pipeline';
import { findRaidGuildMember } from './guildData';

export type FactoryRoleLane = {
  id: string;
  roleName: string;
  stageId?: PipelineStageId;
  stageLabel?: string;
  operatorName: string;
  operatorMeta: string;
  durationHint?: string;
};

function getStageDurationHint(stageId?: PipelineStageId): string | undefined {
  switch (stageId) {
    case 'design':
      return 'Usually 25-40s';
    case 'implementation':
      return 'Usually 45-65s';
    case 'review':
      return 'Usually 15-25s';
    case 'deployment':
      return 'Usually under 10s';
    default:
      return undefined;
  }
}

function getOperatorLabel(worker: Worker | undefined, workers: Worker[]): Pick<FactoryRoleLane, 'operatorName' | 'operatorMeta'> {
  if (!worker) {
    return {
      operatorName: 'Factory core',
      operatorMeta: 'awaiting contractor'
    };
  }

  const member = findRaidGuildMember(workers, worker.id);

  if (member) {
    return {
      operatorName: member.name,
      operatorMeta: member.roleAffinity ?? worker.roleAffinity
    };
  }

  return {
    operatorName: worker.id,
    operatorMeta: worker.roleAffinity
  };
}

export function buildFactoryRoleLanes(roles: HatRole[], workers: Worker[]): FactoryRoleLane[] {
  const workersById = new Map(workers.map((worker) => [worker.id, worker]));

  return sortRolesByPipelineStage(roles)
    .map((role) => {
      const worker = role.assignedWorkerId ? workersById.get(role.assignedWorkerId) : undefined;
      const operator = getOperatorLabel(worker, workers);
      const stageId = inferPipelineStageId(role);
      const stageLabel = stageId ? getPipelineStageDefinition(stageId).shortLabel : undefined;

      return {
        id: role.id,
        roleName: role.name,
        stageId,
        stageLabel,
        operatorName: operator.operatorName,
        operatorMeta: operator.operatorMeta,
        durationHint: getStageDurationHint(stageId)
      };
    });
}
