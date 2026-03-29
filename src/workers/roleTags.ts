import type { RoleTagDefinition, RoleTagId } from '../types';

export const ROLE_TAG_DEFINITIONS: Record<RoleTagId, RoleTagDefinition> = {
  'ui-designer': {
    id: 'ui-designer',
    label: 'UI Designer',
    description: 'Shapes interface systems, interaction logic, and product-facing visual detail.'
  },
  'brand-designer': {
    id: 'brand-designer',
    label: 'Brand Designer',
    description: 'Builds identity systems, public-facing visual language, and campaign-level design direction.'
  },
  'frontend-engineer': {
    id: 'frontend-engineer',
    label: 'Frontend Engineer',
    description: 'Implements the live surface, layout system, and production-facing interface behavior.'
  },
  'code-reviewer': {
    id: 'code-reviewer',
    label: 'Code Reviewer',
    description: 'Runs a truth pass on quality, breakage, and release-readiness before the work ships.'
  }
};

export const ROLE_TAG_IDS = Object.keys(ROLE_TAG_DEFINITIONS) as RoleTagId[];

export function isRoleTagId(value: unknown): value is RoleTagId {
  return typeof value === 'string' && value in ROLE_TAG_DEFINITIONS;
}

export function getRoleTagDefinition(roleTagId: RoleTagId): RoleTagDefinition {
  return ROLE_TAG_DEFINITIONS[roleTagId];
}

export function getRoleTagLabel(roleTagId: RoleTagId): string {
  return getRoleTagDefinition(roleTagId).label;
}
