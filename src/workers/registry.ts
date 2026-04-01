import type { Worker } from '../types';
import { getRoleTagLabel } from './roleTags';

type BuiltinWorkerSeed = Omit<
  Worker,
  | 'name'
  | 'handle'
  | 'roleTag'
  | 'specialty'
  | 'bio'
  | 'shortPitch'
  | 'accent'
  | 'shadow'
  | 'roleAffinity'
  | 'capabilityVector'
  | 'styleProfile'
  | 'temperament'
  | 'traits'
>;

function createBuiltinWorker(seed: BuiltinWorkerSeed): Worker {
  return {
    ...seed,
    name: seed.manifest.identity.name,
    handle: seed.manifest.identity.handle,
    roleTag: seed.manifest.identity.roleTag,
    specialty: getRoleTagLabel(seed.manifest.identity.roleTag),
    bio: seed.manifest.identity.bio,
    shortPitch: seed.manifest.identity.shortPitch,
    accent: seed.presentation?.accent ?? '#6A7281',
    shadow: seed.presentation?.shadow ?? '#303642',
    roleAffinity: seed.gameplay.roleAffinity,
    capabilityVector: seed.gameplay.capabilityVector,
    styleProfile: seed.gameplay.styleProfile,
    temperament: seed.gameplay.temperament,
    traits: seed.gameplay.traits
  };
}

export const BUILTIN_WORKER_REGISTRY: Worker[] = [
  createBuiltinWorker({
    id: 'worker-01',
    registryRecordId: 'builtin-rune-mercer',
    manifest: {
      specVersion: 'dao-the-game.worker.v1',
      identity: {
        name: 'Rune Mercer',
        handle: 'rune-mercer',
        roleTag: 'frontend-engineer',
        bio: 'Best when the concept is already right and the team needs it built fast without losing its edge.',
        shortPitch:
          "I've got this. If the concept already feels right, I can build it fast without sanding off the edge."
      },
      pricing: {
        asset: 'USDC',
        amount: '0.04',
        chargeModel: 'per_request_attempt'
      }
    },
    registration: {
      status: 'registered',
      erc8004Id: null,
      ownerAddress: null,
      engineerEmail: null
    },
    availability: 'active',
    presentation: {
      accent: '#BD482D',
      shadow: '#6A2818'
    },
    gameplay: {
      roleAffinity: 'Design-faithful frontend systems',
      capabilityVector: {
        design: 62,
        implementation: 90,
        review: 58,
        deployment: 76
      },
      styleProfile: {
        signature: 'Hard-edged brutalist control surfaces that keep the original concept intact.',
        execution: 'Ships approved design direction fast without sanding down its edge.',
        collaboration: 'Works best with explicit design rules and a strong reviewer catching brittle edges.'
      },
      temperament: {
        profile: 'Decisive closer',
        pace: 82,
        resilience: 68,
        teamwork: 57
      },
      traits: ['Build-first', 'Brutalist rails', 'Deadline magnet'],
      playerGuidance: {
        strengthLabel: 'Best when the concept is right and needs a fast build',
        pairingHint: 'Pair with a ruthless reviewer',
        riskLabel: 'Needs a reviewer to catch brittle edges',
        shortPitch:
          "I've got this. If the concept already feels right, I can build it fast without sanding off the edge."
      }
    }
  }),
  createBuiltinWorker({
    id: 'worker-02',
    registryRecordId: 'builtin-dorian-ash',
    manifest: {
      specVersion: 'dao-the-game.worker.v1',
      identity: {
        name: 'Dorian Ash',
        handle: 'dorian-ash',
        roleTag: 'frontend-engineer',
        bio: 'Best when a project needs stronger hierarchy, cleaner structure, and a calmer path to launch.',
        shortPitch:
          "I'm not the strongest design lead, but I am a good fit when the site needs stronger structure, hierarchy, and trust. Tap my avatar for the full profile."
      },
      pricing: {
        asset: 'USDC',
        amount: '0.05',
        chargeModel: 'per_request_attempt'
      }
    },
    registration: {
      status: 'registered',
      erc8004Id: null,
      ownerAddress: null,
      engineerEmail: null
    },
    availability: 'active',
    presentation: {
      accent: '#6C4C89',
      shadow: '#332244'
    },
    gameplay: {
      roleAffinity: 'Frontend structure and information architecture',
      capabilityVector: {
        design: 71,
        implementation: 92,
        review: 78,
        deployment: 74
      },
      styleProfile: {
        signature: 'Grid-first interface systems with disciplined hierarchy and control-room calm.',
        execution: 'Builds the scaffolding first so ambitious concepts stay legible, stable, and shippable.',
        collaboration: 'Asks for constraints early and turns fuzzy ideas into explicit structure the team can follow.'
      },
      temperament: {
        profile: 'Measured builder',
        pace: 64,
        resilience: 82,
        teamwork: 70
      },
      traits: ['Information hierarchy', 'Control-room grids', 'Constraint-friendly'],
      playerGuidance: {
        strengthLabel: 'Best when the site needs stronger structure and trust',
        pairingHint: 'Pair with a bold designer who needs a steady builder',
        riskLabel: 'Can make a concept feel too controlled without a strong visual lead',
        shortPitch:
          "I'm not the strongest design lead, but I am a good fit when the site needs stronger structure, hierarchy, and trust. Tap my avatar for the full profile."
      }
    }
  }),
  createBuiltinWorker({
    id: 'worker-03',
    registryRecordId: 'builtin-kestrel-vale',
    manifest: {
      specVersion: 'dao-the-game.worker.v1',
      identity: {
        name: 'Kestrel Vale',
        handle: 'kestrel-vale',
        roleTag: 'ui-designer',
        bio: 'Best when the site needs to feel tactile, navigable, and unmistakably like a real product surface.',
        shortPitch:
          'This is right up my alley. I can make the site feel tactile, intuitive, and much more like a real product.'
      },
      pricing: {
        asset: 'USDC',
        amount: '0.05',
        chargeModel: 'per_request_attempt'
      }
    },
    registration: {
      status: 'registered',
      erc8004Id: null,
      ownerAddress: null,
      engineerEmail: null
    },
    availability: 'active',
    presentation: {
      accent: '#8B6C20',
      shadow: '#534A13'
    },
    gameplay: {
      roleAffinity: 'Skeuomorphic interaction and product design',
      capabilityVector: {
        design: 88,
        implementation: 68,
        review: 63,
        deployment: 54
      },
      styleProfile: {
        signature: 'Tactile skeuomorphic interfaces with luminous glass, deep controls, and surfaces that feel built to be touched.',
        execution: 'Turns navigation, buttons, and panels into layered product machinery with clear interaction cues and physical logic.',
        collaboration: 'Leaves detailed handoff notes like a product blueprint, down to the bezel, state change, and control weight.'
      },
      temperament: {
        profile: 'Calm systems thinker',
        pace: 62,
        resilience: 79,
        teamwork: 82
      },
      traits: ['Skeuomorphic control rooms', 'Interaction-first', 'Strong handoffs'],
      playerGuidance: {
        strengthLabel: 'Best when the site needs tactile product feel and intuitive navigation',
        pairingHint: 'Pair with a builder who preserves detail under pressure',
        riskLabel: 'Needs a stronger finisher for launch polish',
        shortPitch:
          'This is right up my alley. I can make the site feel tactile, intuitive, and much more like a real product.'
      }
    }
  }),
  createBuiltinWorker({
    id: 'worker-04',
    registryRecordId: 'builtin-hexa-thorn',
    manifest: {
      specVersion: 'dao-the-game.worker.v1',
      identity: {
        name: 'Hexa Thorn',
        handle: 'hexa-thorn',
        roleTag: 'brand-designer',
        bio: 'Best when the site needs a bold public identity that feels immediate, loud, and impossible to ignore.',
        shortPitch:
          "Yeah, I can take this. If you want a bolder identity and more public-facing punch, I'll push it there fast."
      },
      pricing: {
        asset: 'USDC',
        amount: '0.04',
        chargeModel: 'per_request_attempt'
      }
    },
    registration: {
      status: 'registered',
      erc8004Id: null,
      ownerAddress: null,
      engineerEmail: null
    },
    availability: 'active',
    presentation: {
      accent: '#8B3A2E',
      shadow: '#4D1A14'
    },
    gameplay: {
      roleAffinity: 'Brutalist identity and visual systems',
      capabilityVector: {
        design: 93,
        implementation: 44,
        review: 56,
        deployment: 38
      },
      styleProfile: {
        signature: 'Brutalist poster systems, oversized type, and hard-edged blocks that read like public signage.',
        execution: 'Delivers a ruthless first-pass visual language fast and expects the team to commit to it.',
        collaboration: 'Plants a visual thesis early and leaves little room for timid revisions or soft compromise.'
      },
      temperament: {
        profile: 'Instinctive stylist',
        pace: 58,
        resilience: 61,
        teamwork: 66
      },
      traits: ['Brutalist posters', 'Fast concepting', 'Public-facing punch'],
      playerGuidance: {
        strengthLabel: 'Best when the site needs a bold identity and unmistakable public presence',
        pairingHint: 'Pair with a builder who can stabilize a strong visual thesis',
        riskLabel: 'Can overpower weaker structure if no one reins the concept in',
        shortPitch:
          "Yeah, I can take this. If you want a bolder identity and more public-facing punch, I'll push it there fast."
      }
    }
  }),
  createBuiltinWorker({
    id: 'worker-05',
    registryRecordId: 'builtin-sable-quill',
    manifest: {
      specVersion: 'dao-the-game.worker.v1',
      identity: {
        name: 'Sable Quill',
        handle: 'sable-quill',
        roleTag: 'code-reviewer',
        bio: 'Best when a promising build needs trust, correction, and one honest pass before launch.',
        shortPitch:
          "I can do the QA pass. If this build is risky, I'll find the brittle parts before the client does."
      },
      pricing: {
        asset: 'USDC',
        amount: '0.03',
        chargeModel: 'per_request_attempt'
      }
    },
    registration: {
      status: 'registered',
      erc8004Id: null,
      ownerAddress: null,
      engineerEmail: null
    },
    availability: 'active',
    presentation: {
      accent: '#6F5C18',
      shadow: '#3A300B'
    },
    gameplay: {
      roleAffinity: 'QA review, trust hardening, and edge-case detection',
      capabilityVector: {
        design: 48,
        implementation: 55,
        review: 94,
        deployment: 69
      },
      styleProfile: {
        signature: 'Finds brittle edges, broken assumptions, and trust-killing cracks hiding inside polished surfaces.',
        execution: 'Builds repro steps, redline notes, and pre-launch corrections before problems go public.',
        collaboration: 'Blunt but exacting when risky work needs a final truth pass.'
      },
      temperament: {
        profile: 'Meticulous skeptic',
        pace: 52,
        resilience: 92,
        teamwork: 74
      },
      traits: ['Edge-case radar', 'Noisy diffs', 'Launch brake'],
      playerGuidance: {
        strengthLabel: 'Best when the team needs trust and edge-case QA before launch',
        pairingHint: 'Pair with a bold designer or fast builder who needs a final truth pass',
        riskLabel: 'Can sand down risky ideas if no one protects the concept',
        shortPitch:
          "I can do the QA pass. If this build is risky, I'll find the brittle parts before the client does."
      }
    }
  }),
  createBuiltinWorker({
    id: 'worker-06',
    registryRecordId: 'builtin-mint-halberd',
    manifest: {
      specVersion: 'dao-the-game.worker.v1',
      identity: {
        name: 'Mint Halberd',
        handle: 'mint-halberd',
        roleTag: 'code-reviewer',
        bio: 'Best when the team needs confidence that the site will survive launch conditions and tiny screens alike.',
        shortPitch:
          "Happy to take release. I'll harden the launch, check the tiny screens, and make sure this thing survives the rollout."
      },
      pricing: {
        asset: 'USDC',
        amount: '0.04',
        chargeModel: 'per_request_attempt'
      }
    },
    registration: {
      status: 'registered',
      erc8004Id: null,
      ownerAddress: null,
      engineerEmail: null
    },
    availability: 'active',
    presentation: {
      accent: '#5D6E2F',
      shadow: '#2E3A18'
    },
    gameplay: {
      roleAffinity: 'Responsive QA, release hardening, and rollout',
      capabilityVector: {
        design: 36,
        implementation: 61,
        review: 84,
        deployment: 94
      },
      styleProfile: {
        signature: 'Quiet launch surfaces, narrow-screen rigor, and operational calm under pressure.',
        execution: 'Runs responsive QA and release checklists like ritual until the site holds together on every screen.',
        collaboration: 'Turns launch nerves into actionable checklists and clean rollback-ready communication.'
      },
      temperament: {
        profile: 'Methodical closer',
        pace: 68,
        resilience: 95,
        teamwork: 63
      },
      traits: ['Responsive QA', 'Incident calm', 'Rollback ready'],
      playerGuidance: {
        strengthLabel: 'Best when the launch needs responsive QA and release hardening',
        pairingHint: 'Pair with a risky designer or fast builder before launch',
        riskLabel: 'Can push the work toward safety if no one protects the concept',
        shortPitch:
          "Happy to take release. I'll harden the launch, check the tiny screens, and make sure this thing survives the rollout."
      }
    }
  })
];
