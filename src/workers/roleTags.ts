import type { RoleTagDefinition, RoleTagId } from '../types';

export const ROLE_TAG_DEFINITIONS: Record<RoleTagId, RoleTagDefinition> = {
  'ui-designer': {
    id: 'ui-designer',
    label: 'UI Designer',
    description: 'Shapes interface systems, interaction logic, and product-facing visual detail.',
    expectedOutputContentTypes: ['application/json']
  },
  'brand-designer': {
    id: 'brand-designer',
    label: 'Brand Designer',
    description: 'Builds identity systems, public-facing visual language, and campaign-level design direction.',
    expectedOutputContentTypes: ['application/json']
  },
  'frontend-engineer': {
    id: 'frontend-engineer',
    label: 'Frontend Engineer',
    description: 'Implements the live surface, layout system, and production-facing interface behavior.',
    expectedOutputContentTypes: ['text/html']
  },
  'code-reviewer': {
    id: 'code-reviewer',
    label: 'Code Reviewer',
    description: 'Runs a truth pass on quality, breakage, and release-readiness before the work ships.',
    expectedOutputContentTypes: ['text/html']
  }
};

export const ROLE_TAG_IDS = Object.keys(ROLE_TAG_DEFINITIONS) as RoleTagId[];

export function isRoleTagId(value: unknown): value is RoleTagId {
  return (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(ROLE_TAG_DEFINITIONS, value)
  );
}

export function getRoleTagDefinition(roleTagId: RoleTagId): RoleTagDefinition {
  return ROLE_TAG_DEFINITIONS[roleTagId];
}

export function getRoleTagLabel(roleTagId: RoleTagId): string {
  return getRoleTagDefinition(roleTagId).label;
}
