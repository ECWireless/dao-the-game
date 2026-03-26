import type { HatRole } from '../../types';

const WHITEBOARD_COLLAPSED_ROLE_POSITION = { x: 148, y: 238 } as const;
const WHITEBOARD_EXPANDED_ROLE_POSITIONS: Record<string, { x: number; y: number }> = {
  'hat-02': { x: 34, y: 252 },
  'hat-01': { x: 248, y: 252 },
  'hat-03': { x: 462, y: 252 },
  'hat-04': { x: 676, y: 252 }
};

export const WHITEBOARD_ROLE_BLUEPRINTS = [
  { label: 'Frontend Engineer', scope: 'Build the site' },
  { label: 'Designer', scope: 'Shape the visual pass' },
  { label: 'QA Reviewer', scope: 'Catch breakage before launch' },
  { label: 'Deployment', scope: 'Harden release and handoff' }
] as const;

export function getWhiteboardRoleRank(roleId: string) {
  switch (roleId) {
    case 'hat-02':
      return 0;
    case 'hat-01':
      return 1;
    case 'hat-03':
      return 2;
    case 'hat-04':
      return 3;
    default:
      return 99;
  }
}

export function sortWhiteboardRoles(roles: HatRole[], isExpanded: boolean) {
  if (!isExpanded) {
    return roles;
  }

  return [...roles].sort((left, right) => getWhiteboardRoleRank(left.id) - getWhiteboardRoleRank(right.id));
}

export function getWhiteboardRolePosition(roleId: string, isExpanded: boolean) {
  if (!isExpanded) {
    return WHITEBOARD_COLLAPSED_ROLE_POSITION;
  }

  return WHITEBOARD_EXPANDED_ROLE_POSITIONS[roleId] ?? WHITEBOARD_COLLAPSED_ROLE_POSITION;
}

export function getWhiteboardBranchTriggerPosition(nextRoleId: string | undefined, isExpanded: boolean) {
  if (!isExpanded || !nextRoleId) {
    return { x: 338, y: 180 };
  }

  const slot = getWhiteboardRolePosition(nextRoleId, true);
  return { x: slot.x + 44, y: slot.y - 58 };
}

export function buildWhiteboardLinks(visibleRoles: HatRole[], isExpanded: boolean) {
  if (visibleRoles.length === 0) {
    return [];
  }

  const sortedRoles = sortWhiteboardRoles(visibleRoles, isExpanded);

  if (!isExpanded) {
    const firstSlot = getWhiteboardRolePosition(sortedRoles[0].id, false);
    return [`M388 132 C388 182 246 192 246 ${firstSlot.y}`];
  }

  const [firstRole, ...remainingRoles] = sortedRoles;
  const firstSlot = getWhiteboardRolePosition(firstRole.id, true);
  const links = [
    `M388 132 C388 194 ${firstSlot.x + 93} 198 ${firstSlot.x + 93} ${firstSlot.y}`
  ];

  remainingRoles.forEach((role, index) => {
    const previousSlot = getWhiteboardRolePosition(sortedRoles[index].id, true);
    const nextSlot = getWhiteboardRolePosition(role.id, true);
    links.push(
      `M${previousSlot.x + 186} ${previousSlot.y + 43} L${nextSlot.x} ${nextSlot.y + 43}`
    );
  });

  return links;
}
