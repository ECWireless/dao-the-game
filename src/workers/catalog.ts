import { PIPELINE_STAGE_ORDER } from '../pipeline';
import type { PipelineStageId, RoleTagId, Worker } from '../types';
import { getRoleTagLabel } from './roleTags';

function getStageEntries(worker: Worker): Array<[PipelineStageId, number]> {
  return PIPELINE_STAGE_ORDER.map((stageId) => [stageId, worker.gameplay.capabilityVector[stageId]]);
}

export function getWorkerName(worker: Worker): string {
  return worker.manifest.identity.name;
}

export function getWorkerHandle(worker: Worker): string {
  return worker.manifest.identity.handle;
}

export function getWorkerRoleTagId(worker: Worker): RoleTagId {
  return worker.manifest.identity.roleTag;
}

export function getWorkerRoleTagLabel(worker: Worker): string {
  return getRoleTagLabel(getWorkerRoleTagId(worker));
}

export function getWorkerBio(worker: Worker): string {
  return worker.manifest.identity.bio;
}

export function getWorkerShortPitch(worker: Worker): string {
  return worker.gameplay.playerGuidance?.shortPitch ?? worker.manifest.identity.shortPitch;
}

export function getWorkerAccent(worker: Worker): string {
  return worker.presentation?.accent ?? '#6A7281';
}

export function getWorkerShadow(worker: Worker): string {
  return worker.presentation?.shadow ?? '#303642';
}

export function getWorkerRoleAffinity(worker: Worker): string {
  return worker.gameplay.roleAffinity;
}

export function getWorkerLicenseCost(worker: Worker): number {
  const amount = Number.parseFloat(worker.manifest.pricing.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  return Math.round(amount * 100);
}

export function getWorkerAverageCapability(worker: Worker): number {
  const values = getStageEntries(worker).map((entry) => entry[1]);
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
