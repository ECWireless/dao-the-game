import type { Brief, HatRole } from '../types';

export const TUTORIAL_SEED = 424242;
export const TUTORIAL_TREASURY = 540;

export const TUTORIAL_BRIEF: Brief = {
  id: 'brief-rfgc-01',
  clientName: 'Regen Frontier Global Conference',
  mission: 'Rescue a failing Web3 conference brand by rebuilding its website with autonomous operations.',
  requirements: [
    'No human labor allowed',
    'All authority flows through a Hats role tree',
    'Ship an IPFS deployment mapped to ENS',
    'Pass client review before treasury depletion'
  ],
  baseScore: 58,
  passThreshold: 72
};

export const TUTORIAL_ROLES: HatRole[] = [
  { id: 'hat-01', name: 'Builder Agent' },
  { id: 'hat-02', name: 'Designer Agent' },
  { id: 'hat-03', name: 'Reviewer Agent' },
  { id: 'hat-04', name: 'Deployment Agent' }
];

export const TUTORIAL_STEPS = ['mission', 'roles', 'agents', 'run', 'result'] as const;
