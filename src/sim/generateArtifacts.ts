import { buildConferenceSiteArtifact } from '../artifacts/conferenceSite';
import type { ArtifactBundle, RunArtifactsInput } from '../types';

export function generateArtifacts(input: RunArtifactsInput): ArtifactBundle {
  return buildConferenceSiteArtifact(input);
}
