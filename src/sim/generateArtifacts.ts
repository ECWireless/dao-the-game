import { getDeploymentTarget } from '../levels/deployments';
import type { ArtifactBundle, RunArtifactsInput } from '../types';

export function generateArtifacts(input: RunArtifactsInput): ArtifactBundle {
  const { result, brief, cycle, studioName } = input;
  const target = getDeploymentTarget(brief, cycle, studioName);

  const notes = result.passed
    ? [
        'Autonomous execution complete.',
        'Client accepted delivery for the current sprint.',
        'Ready for expansion into the next campaign.'
      ]
    : [
        'Client found weak execution in at least one critical role.',
        'Refit the hat tree and retry before treasury depletion.',
        'Investigate reliability-sensitive steps in Engine mode.'
      ];

  return {
    siteTitle: target.siteTitle,
    publicUrl: target.publicUrl,
    previewUrl: target.previewUrl,
    ensName: target.ensName,
    cid: target.pinnedCid ?? result.cid,
    notes
  };
}
