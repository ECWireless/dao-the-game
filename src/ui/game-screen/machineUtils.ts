import type { Agent, HatRole } from '../../types';
import { getPipelineStageDefinition, inferPipelineStageId, sortRolesByPipelineStage } from '../../pipeline';
import { findRaidGuildMember } from './guildData';

export type MachineRoleLane = {
  id: string;
  roleName: string;
  stageLabel?: string;
  operatorName: string;
  operatorMeta: string;
};

function getOperatorLabel(agent: Agent | undefined, agents: Agent[]): Pick<MachineRoleLane, 'operatorName' | 'operatorMeta'> {
  if (!agent) {
    return {
      operatorName: 'Machine core',
      operatorMeta: 'awaiting contractor'
    };
  }

  const member = findRaidGuildMember(agents, agent.id);

  if (member) {
    return {
      operatorName: member.name,
      operatorMeta: member.title
    };
  }

  return {
    operatorName: agent.id,
    operatorMeta: agent.roleAffinity.toLowerCase()
  };
}

export function buildMachineRoleLanes(roles: HatRole[], agents: Agent[]): MachineRoleLane[] {
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
        stageLabel,
        operatorName: operator.operatorName,
        operatorMeta: operator.operatorMeta
      };
    });
}
