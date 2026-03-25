import type { Agent, HatRole, PipelineStageId } from '../../types';
import { getPipelineStageDefinition, inferPipelineStageId, sortRolesByPipelineStage } from '../../pipeline';
import { findRaidGuildMember } from './guildData';

export type FactoryRoleLane = {
  id: string;
  roleName: string;
  stageId?: PipelineStageId;
  stageLabel?: string;
  operatorName: string;
  operatorMeta: string;
};

function getOperatorLabel(agent: Agent | undefined, agents: Agent[]): Pick<FactoryRoleLane, 'operatorName' | 'operatorMeta'> {
  if (!agent) {
    return {
      operatorName: 'Factory core',
      operatorMeta: 'awaiting contractor'
    };
  }

  const member = findRaidGuildMember(agents, agent.id);

  if (member) {
    return {
      operatorName: member.name,
      operatorMeta: member.roleAffinity ?? agent.roleAffinity
    };
  }

  return {
    operatorName: agent.id,
    operatorMeta: agent.roleAffinity
  };
}

export function buildFactoryRoleLanes(roles: HatRole[], agents: Agent[]): FactoryRoleLane[] {
  const agentById = new Map(agents.map((agent) => [agent.id, agent]));

  return sortRolesByPipelineStage(roles)
    .map((role) => {
      const agent = role.assignedAgentId ? agentById.get(role.assignedAgentId) : undefined;
      const operator = getOperatorLabel(agent, agents);
      const stageId = inferPipelineStageId(role);
      const stageLabel = stageId ? getPipelineStageDefinition(stageId).shortLabel : undefined;

      return {
        id: role.id,
        roleName: role.name,
        stageId,
        stageLabel,
        operatorName: operator.operatorName,
        operatorMeta: operator.operatorMeta
      };
    });
}
