import type { Agent, HatRole } from '../../types';
import { findRaidGuildMember } from './guildData';

export type MachineRoleLane = {
  id: string;
  roleName: string;
  operatorName: string;
  operatorMeta: string;
};

function normalizeRoleName(roleName: string): string {
  return roleName.trim().toLowerCase();
}

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

  return roles.map((role) => {
    const agent = role.assignedAgentId ? agentById.get(role.assignedAgentId) : undefined;
    const operator = getOperatorLabel(agent, agents);

    return {
      id: role.id,
      roleName: role.name,
      operatorName: operator.operatorName,
      operatorMeta: operator.operatorMeta
    };
  });
}

export function hasRoleWithKeyword(roles: HatRole[], keyword: string): boolean {
  return roles.some((role) => normalizeRoleName(role.name).includes(keyword));
}
