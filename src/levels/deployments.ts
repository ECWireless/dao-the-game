import type { Brief } from '../types';

export type DeploymentCycle = 1 | 2;

export type DeploymentTarget = {
  cycle: DeploymentCycle;
  siteTitle: string;
  publicUrl: string;
  previewUrl: string;
  ensName: string;
  pinnedCid?: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function createStudioSlug(studioName?: string): string {
  return slugify(studioName?.trim() || '') || 'ghost-studio';
}

export function getDeploymentTarget(brief: Brief, cycle: DeploymentCycle, studioName?: string): DeploymentTarget {
  const studioSlug = createStudioSlug(studioName);
  const publicUrl = `https://cycle${cycle}.${studioSlug}.daothegame.com`;
  const ensName = `${studioSlug}.daothegame.eth`;
  const siteTitle = cycle === 1 ? `${brief.clientName} Live Draft` : `${brief.clientName} Relaunch`;
  const previewUrl =
    cycle === 1 ? '/deployments/cycle-one/index.html' : '/deployments/cycle-two/index.html';
  // Replace these local previews with real deploy URLs later if you decide to stop using local artifacts.

  return {
    cycle,
    siteTitle,
    publicUrl,
    previewUrl,
    ensName
  };
}
