import type { Brief, HatRole } from '../types';

export const TUTORIAL_SEED = 424242;
export const TUTORIAL_TREASURY = 540;

export const TUTORIAL_BRIEF: Brief = {
  id: 'brief-rfgc-01',
  artifactType: 'conference-site',
  clientName: 'Regen Frontier Global Conference',
  mission: 'Rescue a failing Web3 conference brand by rebuilding its website with autonomous operations.',
  requirements: [
    'All authority flows through a Hats role tree',
    'Ship an IPFS deployment mapped to ENS',
    'Pass client review before treasury depletion'
  ],
  baseScore: 58,
  passThreshold: 72,
  conferenceSiteSpec: {
    editionLabel: 'March 2027',
    location: 'Denver, Colorado',
    audience: ['DAO operators', 'Onchain founders', 'Agent builders', 'Collectors'],
    positioning:
      'A web3 conference for the people designing autonomous organizations, shipping onchain products, and shaping the culture around them.',
    attendeePromise:
      'A high-signal week of practical workshops, strategic conversations, and culture-forward side events for the next generation of internet-native organizations.',
    heroPrimaryCta: 'Explore the summit',
    heroSecondaryCta: 'View attendee guide',
    toneKeywords: ['credible', 'alive', 'operator-led', 'web3-native', 'future-facing'],
    visualDirection: [
      'editorial tech conference',
      'onchain atmosphere',
      'signal over hype',
      'city-at-night energy'
    ],
    internalRequirements: [
      'Make it feel like a legitimate marquee web3 conference, not a studio dashboard.',
      'Prioritize clear navigation, event credibility, and a distinct identity that feels current but not gimmicky.',
      'Surface both practical operator programming and cultural/community energy.',
      'Keep the conference audience broad across DAO operators, builders, researchers, and collectors.',
      'Make room for agent identity, governance, treasury, and coordination themes without sounding overly abstract.'
    ],
    programPillars: [
      {
        id: 'pillar-design',
        metricId: 'visualIdentity',
        eyebrow: 'Brand and culture',
        title: 'Immersive design showcases',
        summary:
          'Generative identity systems, creative tooling, and visual installations exploring how onchain culture becomes a shared public surface.'
      },
      {
        id: 'pillar-ops',
        metricId: 'launchStability',
        eyebrow: 'Operations and infrastructure',
        title: 'Operator control rooms',
        summary:
          'Tactical sessions on deployment, release hardening, monitoring, and the real workflows that keep autonomous systems stable.'
      },
      {
        id: 'pillar-community',
        metricId: 'communityHype',
        eyebrow: 'Momentum and community',
        title: 'Network-dense gatherings',
        summary:
          'Founder meetups, collector salons, and ecosystem events designed to carry energy across the city long after the keynote ends.'
      },
      {
        id: 'pillar-trust',
        metricId: 'trust',
        eyebrow: 'Governance and resilience',
        title: 'Coordination under pressure',
        summary:
          'Workshops on treasury design, governance systems, reputation, and what it takes to keep DAOs legible when stakes are real.'
      }
    ],
    experienceMoments: [
      {
        id: 'moment-day',
        label: 'Daytime',
        title: 'Mainstage sessions, labs, and tactical workshops',
        summary:
          'A full daytime program focused on practical DAO operations, agent tooling, treasury systems, governance, and onchain product design.'
      },
      {
        id: 'moment-night',
        label: 'Evening',
        title: 'Installations, launches, and citywide side events',
        summary:
          'As the summit shifts into the evening, attendees move between showcases, collector events, artist activations, and product unveilings.'
      }
    ]
  }
};

export const TUTORIAL_ROLES: HatRole[] = [
  { id: 'hat-01', name: 'Frontend Engineer', pipelineStageId: 'implementation' },
  { id: 'hat-02', name: 'Designer Agent', pipelineStageId: 'design' },
  { id: 'hat-03', name: 'Reviewer Agent', pipelineStageId: 'review' },
  { id: 'hat-04', name: 'Deployment Agent', pipelineStageId: 'deployment' }
];

export const TUTORIAL_STEPS = ['mission', 'roles', 'agents', 'run', 'result'] as const;
