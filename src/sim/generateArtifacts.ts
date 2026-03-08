import { getDeploymentTarget } from '../levels/deployments';
import type { ArtifactBundle, RunArtifactsInput } from '../types';

export function generateArtifacts(input: RunArtifactsInput): ArtifactBundle {
  const { result, brief, cycle, studioName } = input;
  const target = getDeploymentTarget(brief, cycle, studioName);

  const notes = result.passed
    ? [
        'Assembly pass complete and staged for review.',
        'Information hierarchy and delivery flow feel stable enough to send.',
        'This build is ready for client review.'
      ]
    : [
        'The build still feels under-supported in at least one critical pass.',
        'Tighten the graph and rerun before sending this version out.',
        'Review the rough spots and strengthen the weakest role coverage.'
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
