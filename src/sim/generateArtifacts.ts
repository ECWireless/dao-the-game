import type { ArtifactBundle, RunArtifactsInput } from '../types';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function tierFromScore(score: number): 'flagship' | 'stable' | 'recovery' {
  if (score >= 85) {
    return 'flagship';
  }

  if (score >= 65) {
    return 'stable';
  }

  return 'recovery';
}

export function generateArtifacts(input: RunArtifactsInput): ArtifactBundle {
  const { result, brief } = input;
  const slug = slugify(brief.clientName);
  const tier = tierFromScore(result.qualityScore);

  const siteTitleByTier: Record<typeof tier, string> = {
    flagship: `${brief.clientName} Autonomous Flagship`,
    stable: `${brief.clientName} DAO Relaunch`,
    recovery: `${brief.clientName} Recovery Console`
  };

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
    siteTitle: siteTitleByTier[tier],
    publicUrl: `https://${slug}-autonomous.sim`,
    ensName: `${slug}.dao.eth`,
    cid: result.cid,
    notes
  };
}
