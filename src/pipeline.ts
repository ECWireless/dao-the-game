import type { HatRole, PipelineStageDefinition, PipelineStageId } from './types';

const TUTORIAL_ROLE_STAGE_BY_ID: Record<string, PipelineStageId> = {
  'hat-01': 'implementation',
  'hat-02': 'design',
  'hat-03': 'review',
  'hat-04': 'deployment'
};

export const PIPELINE_STAGE_ORDER: PipelineStageId[] = [
  'design',
  'implementation',
  'review',
  'deployment'
];

export const PIPELINE_STAGE_DEFINITIONS: Record<PipelineStageId, PipelineStageDefinition> = {
  design: {
    id: 'design',
    label: 'Design pass',
    shortLabel: 'Design',
    summary: 'Shapes the concept, hierarchy, and visual direction.'
  },
  implementation: {
    id: 'implementation',
    label: 'Implementation pass',
    shortLabel: 'Build',
    summary: 'Turns the approved direction into a working build.'
  },
  review: {
    id: 'review',
    label: 'Review pass',
    shortLabel: 'Review',
    summary: 'Stress-tests the build before it ships.'
  },
  deployment: {
    id: 'deployment',
    label: 'Deployment pass',
    shortLabel: 'Launch',
    summary: 'Packages, routes, and pushes the release live.'
  }
};

function normalizeRoleName(roleName: string): string {
  return roleName.trim().toLowerCase();
}

export function isPipelineStageId(value: unknown): value is PipelineStageId {
  return typeof value === 'string' && PIPELINE_STAGE_ORDER.includes(value as PipelineStageId);
}

export function getPipelineStageDefinition(stageId: PipelineStageId): PipelineStageDefinition {
  return PIPELINE_STAGE_DEFINITIONS[stageId];
}

export function inferPipelineStageId(
  role: Pick<HatRole, 'id' | 'name' | 'pipelineStageId'>
): PipelineStageId | undefined {
  if (isPipelineStageId(role.pipelineStageId)) {
    return role.pipelineStageId;
  }

  const tutorialStage = TUTORIAL_ROLE_STAGE_BY_ID[role.id];

  if (tutorialStage) {
    return tutorialStage;
  }

  const normalized = normalizeRoleName(role.name);

  if (normalized.includes('design') || normalized.includes('brand')) {
    return 'design';
  }

  if (
    normalized.includes('develop') ||
    normalized.includes('build') ||
    normalized.includes('frontend') ||
    normalized.includes('implement')
  ) {
    return 'implementation';
  }

  if (normalized.includes('review') || normalized.includes('qa') || normalized.includes('test')) {
    return 'review';
  }

  if (
    normalized.includes('deploy') ||
    normalized.includes('release') ||
    normalized.includes('launch') ||
    normalized.includes('ops')
  ) {
    return 'deployment';
  }

  return undefined;
}

export function getPipelineStageIndex(stageId: PipelineStageId | undefined): number {
  return stageId ? PIPELINE_STAGE_ORDER.indexOf(stageId) : -1;
}

export function comparePipelineStages(left: HatRole, right: HatRole): number {
  const leftStageIndex = getPipelineStageIndex(inferPipelineStageId(left));
  const rightStageIndex = getPipelineStageIndex(inferPipelineStageId(right));
  const safeLeft = leftStageIndex === -1 ? Number.MAX_SAFE_INTEGER : leftStageIndex;
  const safeRight = rightStageIndex === -1 ? Number.MAX_SAFE_INTEGER : rightStageIndex;

  return safeLeft - safeRight;
}

export function sortRolesByPipelineStage(roles: HatRole[]): HatRole[] {
  return [...roles].sort(comparePipelineStages);
}

export function hasPipelineStage(roles: HatRole[], stageId: PipelineStageId): boolean {
  return roles.some((role) => inferPipelineStageId(role) === stageId);
}
