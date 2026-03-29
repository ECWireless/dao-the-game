import type {
  Worker,
  ArtifactBundle,
  ArtifactContributor,
  Brief,
  ConferenceSiteBriefSpec,
  ConferenceSiteProgramPillar,
  DeploymentMetricId,
  DeploymentMetrics,
  DeploymentProfileTag,
  HatRole,
  RunResult
} from '../types';

type ConferenceSiteArtifactInput = {
  brief: Brief;
  result: RunResult;
  cycle: 1 | 2;
  studioName?: string;
  roles: HatRole[];
  workers: Worker[];
};

type ProfileTheme = {
  accent: string;
  accentSoft: string;
  backgroundA: string;
  backgroundB: string;
  panel: string;
  panelMuted: string;
  text: string;
  textMuted: string;
  outline: string;
  strapline: string;
};

type WorkerInfluence = {
  variant: 'balanced' | 'minimal' | 'systems' | 'visual' | 'operations';
  accent: string;
  shadow: string;
  atmosphere: string;
  attendeePromiseExtension: string;
  focusCopy: string;
  featureFrame: string;
  summitThemeTitle: string;
  experienceLead: string;
};

export type ConferenceSiteLayoutVariant =
  | 'balanced-summit'
  | 'minimal-grid'
  | 'systems-grid'
  | 'showcase-stack'
  | 'operations-deck';

export type ConferenceSiteHeroLayout = 'split' | 'stacked' | 'immersive';
export type ConferenceSiteDesignLanguage =
  | 'brutalist'
  | 'skeuomorphic'
  | 'editorial'
  | 'systems'
  | 'festival';
export type ConferenceSiteVisualTreatment =
  | 'editorial-signal'
  | 'poster-burst'
  | 'systems-board'
  | 'quiet-lux'
  | 'launch-grid';
export type ConferenceSitePanelStyle = 'glass' | 'solid' | 'outline';
export type ConferenceSiteCardGeometry = 'soft' | 'sharp' | 'pill';
export type ConferenceSiteDensity = 'airy' | 'balanced' | 'dense';
export type ConferenceSiteTrackLayout = 'columns' | 'staggered' | 'stacked';
export type ConferenceSiteDetailLayout = 'columns' | 'stacked';
export type ConferenceSiteHeadlineFont = 'serif' | 'sans' | 'mono';
export type ConferenceSiteSectionId = 'featured' | 'program' | 'attendance' | 'experience';

export type ConferenceSiteProgramContent = {
  eyebrow: string;
  title: string;
  summary: string;
};

export type ConferenceSiteExperienceContent = {
  label: string;
  title: string;
  summary: string;
};

export type ConferenceSiteGeneratedContent = {
  layoutVariant: ConferenceSiteLayoutVariant;
  designLanguage: ConferenceSiteDesignLanguage;
  heroLayout: ConferenceSiteHeroLayout;
  visualTreatment: ConferenceSiteVisualTreatment;
  panelStyle: ConferenceSitePanelStyle;
  cardGeometry: ConferenceSiteCardGeometry;
  density: ConferenceSiteDensity;
  trackLayout: ConferenceSiteTrackLayout;
  detailLayout: ConferenceSiteDetailLayout;
  headlineFont: ConferenceSiteHeadlineFont;
  sectionOrder: ConferenceSiteSectionId[];
  heroHeadline: string;
  heroSubhead: string;
  heroAtmosphere: string;
  attendeePromise: string;
  attendeeSectionTitle: string;
  summitThemeTitle: string;
  summitThemeCopy: string;
  featuredDirectionTitle: string;
  featuredDirectionCopy: string;
  featuredSectionTitle: string;
  programSectionTitle: string;
  programLead: string;
  experienceSectionTitle: string;
  experienceLead: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  programItems: ConferenceSiteProgramContent[];
  experienceItems: ConferenceSiteExperienceContent[];
  footerNote: string;
};

const METRIC_ORDER: DeploymentMetricId[] = [
  'visualIdentity',
  'launchStability',
  'communityHype',
  'trust'
];

const PROFILE_THEMES: Record<DeploymentProfileTag, ProfileTheme> = {
  premium: {
    accent: '#f6c26b',
    accentSoft: '#fff2d6',
    backgroundA: '#0f172a',
    backgroundB: '#1f4068',
    panel: 'rgba(255,255,255,0.1)',
    panelMuted: 'rgba(255,255,255,0.05)',
    text: '#f8fafc',
    textMuted: '#d8e0f2',
    outline: 'rgba(246,194,107,0.42)',
    strapline: 'A calmer frontier for onchain builders, operators, and systems thinkers.'
  },
  flashy: {
    accent: '#ff6b6b',
    accentSoft: '#ffe3ec',
    backgroundA: '#1a103a',
    backgroundB: '#6b21a8',
    panel: 'rgba(255,255,255,0.14)',
    panelMuted: 'rgba(255,255,255,0.07)',
    text: '#fff8f8',
    textMuted: '#fce7f3',
    outline: 'rgba(255,107,107,0.52)',
    strapline: 'Generative visuals, loud momentum, and a launch built to be remembered.'
  },
  stable: {
    accent: '#7dd3a7',
    accentSoft: '#e2fff0',
    backgroundA: '#0f172a',
    backgroundB: '#164e63',
    panel: 'rgba(255,255,255,0.11)',
    panelMuted: 'rgba(255,255,255,0.06)',
    text: '#f0fdf9',
    textMuted: '#d9f5ef',
    outline: 'rgba(125,211,167,0.42)',
    strapline: 'Operationally clear, attendee-friendly, and ready for real traffic.'
  },
  messy: {
    accent: '#ffaf45',
    accentSoft: '#fff2da',
    backgroundA: '#23130f',
    backgroundB: '#4b2e1b',
    panel: 'rgba(255,255,255,0.11)',
    panelMuted: 'rgba(255,255,255,0.05)',
    text: '#fff6ed',
    textMuted: '#fde6d3',
    outline: 'rgba(255,175,69,0.44)',
    strapline: 'An energetic first public version with visible ambition and room to tighten the finish.'
  },
  failed: {
    accent: '#f87171',
    accentSoft: '#ffe1e1',
    backgroundA: '#190f14',
    backgroundB: '#3b111d',
    panel: 'rgba(255,255,255,0.09)',
    panelMuted: 'rgba(255,255,255,0.04)',
    text: '#fff4f4',
    textMuted: '#fecaca',
    outline: 'rgba(248,113,113,0.46)',
    strapline: 'A pared-back first release that plants the flag early while the fuller summit experience continues to take shape.'
  }
};

const DEFAULT_CONFERENCE_SITE_SPEC: ConferenceSiteBriefSpec = {
  editionLabel: 'March 2027',
  location: 'Denver, Colorado',
  audience: ['DAO operators', 'Onchain founders', 'Worker builders'],
  positioning:
    'A web3 conference for the people building autonomous organizations, shipping onchain products, and shaping the culture around them.',
  attendeePromise:
    'A high-signal week of workshops, strategy, and culture-forward events for the next generation of internet-native organizations.',
  heroPrimaryCta: 'Explore the summit',
  heroSecondaryCta: 'View attendee guide',
  toneKeywords: ['credible', 'alive', 'web3-native'],
  visualDirection: ['editorial conference system', 'signal over hype'],
  internalRequirements: [
    'Make the site feel like a legitimate web3 conference, not an internal tool.'
  ],
  programPillars: [
    {
      id: 'design',
      metricId: 'visualIdentity',
      eyebrow: 'Brand and culture',
      title: 'Immersive design showcases',
      summary:
        'Generative identity systems, creative tooling, and visual installations exploring how onchain culture becomes a shared public surface.'
    },
    {
      id: 'ops',
      metricId: 'launchStability',
      eyebrow: 'Operations and infrastructure',
      title: 'Operator control rooms',
      summary:
        'Tactical sessions on deployment, release hardening, monitoring, and the real workflows that keep autonomous systems stable.'
    },
    {
      id: 'community',
      metricId: 'communityHype',
      eyebrow: 'Momentum and community',
      title: 'Network-dense gatherings',
      summary:
        'Founder meetups, collector salons, and ecosystem events designed to carry energy across the city long after the keynote ends.'
    },
    {
      id: 'trust',
      metricId: 'trust',
      eyebrow: 'Governance and resilience',
      title: 'Coordination under pressure',
      summary:
        'Workshops on treasury design, governance systems, reputation, and what it takes to keep DAOs legible when stakes are real.'
    }
  ],
  experienceMoments: [
    {
      id: 'day',
      label: 'Daytime',
      title: 'Mainstage sessions, labs, and tactical workshops',
      summary:
        'A full daytime program focused on practical DAO operations, agent tooling, treasury systems, governance, and onchain product design.'
    },
    {
      id: 'night',
      label: 'Evening',
      title: 'Installations, launches, and citywide side events',
      summary:
        'As the summit shifts into the evening, attendees move between showcases, collector events, artist activations, and product unveilings.'
    }
  ]
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function createStudioSlug(studioName?: string): string {
  return slugify(studioName?.trim() || '') || 'ghost-studio';
}

function getConferenceSiteSpec(brief: Brief): ConferenceSiteBriefSpec {
  return brief.conferenceSiteSpec ?? DEFAULT_CONFERENCE_SITE_SPEC;
}

function resolveArtifactProfile(result: RunResult): DeploymentProfileTag {
  const rawProfile = result.evaluation?.profileTag;

  if (result.passed) {
    if (!rawProfile || rawProfile === 'failed' || rawProfile === 'messy') {
      return 'stable';
    }

    return rawProfile;
  }

  if (!rawProfile || rawProfile === 'premium' || rawProfile === 'stable' || rawProfile === 'flashy') {
    return 'messy';
  }

  return rawProfile;
}

function buildContributors(
  roles: HatRole[],
  workers: Worker[],
  result: RunResult
): ArtifactContributor[] {
  const agentById = new Map(workers.map((agent) => [agent.id, agent]));
  const stages = result.pipeline?.stages ?? [];
  const stageRoleIds = new Set(stages.map((stage) => stage.roleId).filter(Boolean) as string[]);

  const contributors: ArtifactContributor[] = [];

  for (const stage of stages) {
    if (!stage.assignedWorkerId) {
      continue;
    }

    const agent = agentById.get(stage.assignedWorkerId);

    if (!agent) {
      continue;
    }

    contributors.push({
      workerId: agent.id,
      workerName: agent.name,
      workerHandle: agent.handle,
      roleId: stage.roleId,
      roleName: stage.roleName,
      stageId: stage.id,
      roleTag: agent.roleTag,
      specialty: agent.specialty,
      traits: agent.traits
    });
  }

  for (const role of roles) {
    if (!role.assignedWorkerId || stageRoleIds.has(role.id)) {
      continue;
    }

    const agent = agentById.get(role.assignedWorkerId);

    if (!agent) {
      continue;
    }

    contributors.push({
      workerId: agent.id,
      workerName: agent.name,
      workerHandle: agent.handle,
      roleId: role.id,
      roleName: role.name,
      stageId: role.pipelineStageId,
      roleTag: agent.roleTag,
      specialty: agent.specialty,
      traits: agent.traits
    });
  }

  return contributors;
}

function getMetricRanking(metrics: DeploymentMetrics | undefined): DeploymentMetricId[] {
  return [...METRIC_ORDER].sort((left, right) => (metrics?.[right] ?? 0) - (metrics?.[left] ?? 0));
}

function buildSiteTitle(
  brief: Brief,
  cycle: 1 | 2,
  profileTag: DeploymentProfileTag
): string {
  const cycleLabel = cycle === 1 ? 'Preview Edition' : 'Live Edition';

  switch (profileTag) {
    case 'premium':
      return `${brief.clientName} // Summit Edition`;
    case 'flashy':
      return `${brief.clientName} // Signal Burst`;
    case 'stable':
      return `${brief.clientName} // ${cycleLabel}`;
    case 'messy':
      return `${brief.clientName} // Early Access`;
    case 'failed':
    default:
      return `${brief.clientName} // Launch Preview`;
  }
}

function buildNotes(
  profileTag: DeploymentProfileTag,
  contributors: ArtifactContributor[]
): string[] {
  const primaryContributor = contributors[0];

  const profileNote =
    profileTag === 'premium'
      ? 'The assembled site lands with unusual confidence and reads as fully intentional.'
      : profileTag === 'flashy'
        ? 'The launch leans into spectacle and momentum, with the strongest signal happening above the fold.'
        : profileTag === 'stable'
          ? 'The build favors clarity and operator confidence over visual risk.'
          : profileTag === 'messy'
            ? 'The deploy already has a point of view, but it still feels like an early public cut rather than the final expression.'
            : 'The current artifact feels intentionally lightweight and should evolve further before the full summit push.';

  return [
    profileNote,
    'The generated site reflects the current conference brief and the composition of the assembled crew.',
    primaryContributor
      ? `${primaryContributor.workerName} anchors the ${primaryContributor.roleName?.toLowerCase() ?? 'lead'} pass in this assembled version.`
      : 'Crew provenance is embedded alongside the generated site manifest.'
  ];
}

type ConferenceSiteArtifactMetadata = {
  brief: Brief;
  profileTag: DeploymentProfileTag;
  siteTitle: string;
  ensName: string;
  notes: string[];
  provenance: ArtifactBundle['provenance'];
};

function buildConferenceSiteArtifactMetadata(
  input: ConferenceSiteArtifactInput
): ConferenceSiteArtifactMetadata {
  const { brief, result, cycle, studioName, roles, workers } = input;
  const normalizedStudioName = studioName?.trim() || 'Ghost Studio';
  const profileTag = resolveArtifactProfile(result);
  const studioSlug = createStudioSlug(normalizedStudioName);
  const ensName = `${studioSlug}.daothegame.eth`;
  const contributors = buildContributors(roles, workers, result);
  const siteTitle = buildSiteTitle(brief, cycle, profileTag);
  const notes = buildNotes(profileTag, contributors);

  return {
    brief,
    profileTag,
    siteTitle,
    ensName,
    notes,
    provenance: {
      artifactType: brief.artifactType,
      briefId: brief.id,
      clientName: brief.clientName,
      studioName: normalizedStudioName,
      cycle,
      profileTag,
      rawProfileTag: result.evaluation?.profileTag,
      headline: result.evaluation?.headline,
      metrics: result.evaluation?.metrics,
      contributors
    }
  };
}

function buildWorkerInfluence(leadAgent: Worker | null): WorkerInfluence {
  if (!leadAgent) {
    return {
      variant: 'balanced',
      accent: '#7dd3a7',
      shadow: '#164e63',
      atmosphere: 'A balanced conference surface tuned for clarity, signal, and usable momentum.',
      attendeePromiseExtension:
        'Expect a week that feels coherent, current, and welcoming to serious builders.',
      focusCopy:
        'This edition balances conference clarity with enough edge to still feel unmistakably web3-native.',
      featureFrame: 'A conference week built for people who want both practical systems and cultural energy.',
      summitThemeTitle: 'A practical summit for web3 operators',
      experienceLead: 'The week balances tactical rooms, high-signal hallway time, and enough cultural energy to still feel unmistakably onchain.'
    };
  }

  const blueprint = [
    leadAgent.specialty,
    leadAgent.roleAffinity,
    ...leadAgent.traits,
    leadAgent.styleProfile.signature,
    leadAgent.styleProfile.execution
  ]
    .join(' ')
    .toLowerCase();

  if (
    blueprint.includes('minimalist') ||
    blueprint.includes('design-faithful closer') ||
    blueprint.includes('design-faithful')
  ) {
    return {
      variant: 'minimal',
      accent: leadAgent.accent,
      shadow: leadAgent.shadow,
      atmosphere: 'A sharper, stripped-back summit surface that favors precision over excess.',
      attendeePromiseExtension:
        'The conference reads fast, the routes are crisp, and the identity lands with disciplined confidence.',
      focusCopy:
        'The event presentation leans toward cleaner wayfinding, tighter hierarchy, and a more surgical interpretation of web3 culture.',
      featureFrame: 'A conference week for teams who care about signal density, clarity, and shipping without ornamental noise.',
      summitThemeTitle: 'Clarity as a coordination primitive',
      experienceLead: 'The event feels leaner and more precise, with clear routes between keynotes, labs, and the rooms where actual coordination happens.'
    };
  }

  if (
    blueprint.includes('architecture first') ||
    blueprint.includes('systems-first builder') ||
    blueprint.includes('information architecture') ||
    blueprint.includes('control-room')
  ) {
    return {
      variant: 'systems',
      accent: leadAgent.accent,
      shadow: leadAgent.shadow,
      atmosphere: 'A more grounded conference system with stronger structure and a sense of deliberate scale.',
      attendeePromiseExtension:
        'The site feels more like a stable operating system for the event than a one-off marketing page.',
      focusCopy:
        'Programming and event language skew toward systems, coordination, and durable infrastructure for onchain organizations.',
      featureFrame: 'A conference week shaped for operators who want the ecosystem to feel more coherent, legible, and built to last.',
      summitThemeTitle: 'Operating systems for autonomous organizations',
      experienceLead: 'Expect a more structured summit rhythm built around control-room thinking, durable infrastructure, and serious operator exchange.'
    };
  }

  if (blueprint.includes('visual') || blueprint.includes('generative') || blueprint.includes('spectacle')) {
    return {
      variant: 'visual',
      accent: leadAgent.accent,
      shadow: leadAgent.shadow,
      atmosphere: 'A more theatrical conference surface with stronger visual atmosphere and collector energy.',
      attendeePromiseExtension:
        'The event reads as louder, more culturally charged, and more willing to foreground design as part of the draw.',
      focusCopy:
        'Programming tilts toward art, identity systems, launches, and the public-facing side of web3 culture.',
      featureFrame: 'A conference week for builders, collectors, and artists who want the ecosystem to feel alive in public.',
      summitThemeTitle: 'Culture as the public interface',
      experienceLead: 'The summit leans harder into atmosphere, showcase moments, and the kind of public-facing web3 energy that makes the city feel activated.'
    };
  }

  if (blueprint.includes('checklist') || blueprint.includes('operator') || blueprint.includes('rollback')) {
    return {
      variant: 'operations',
      accent: leadAgent.accent,
      shadow: leadAgent.shadow,
      atmosphere: 'A steadier summit system with stronger operational grounding and less decorative risk.',
      attendeePromiseExtension:
        'The public surface feels calmer, more reliable, and more comfortable for high-intent attendees.',
      focusCopy:
        'Programming emphasizes operating discipline, infrastructure, and the practical work that keeps large events and organizations stable.',
      featureFrame: 'A conference week for serious operators who want real workflows, not just mainstage spectacle.',
      summitThemeTitle: 'Reliable launches at human scale',
      experienceLead: 'The week feels calmer and more dependable, with a stronger emphasis on wayfinding, timing, and a public surface people can trust quickly.'
    };
  }

  return {
    variant: 'balanced',
    accent: leadAgent.accent,
    shadow: leadAgent.shadow,
    atmosphere: 'A more distinctive conference surface shaped by the strongest available contributor on the crew.',
    attendeePromiseExtension:
      'The public experience shifts in tone depending on who is leading the assembly line.',
    focusCopy:
      'The program framing and visual treatment adapt to the strongest worker influence in the current org.',
    featureFrame: 'A conference week whose public face changes with the team that assembled it.',
    summitThemeTitle: 'An assembled week for onchain builders',
    experienceLead: 'The event feels tuned by the crew behind it, with enough structure to guide people and enough style to carry a point of view.'
  };
}

function selectProgramPillars(
  spec: ConferenceSiteBriefSpec,
  metricRanking: DeploymentMetricId[]
): ConferenceSiteProgramPillar[] {
  const selected: ConferenceSiteProgramPillar[] = [];

  for (const metricId of metricRanking) {
    const match = spec.programPillars.find(
      (pillar) =>
        pillar.metricId === metricId && !selected.some((item) => item.id === pillar.id)
    );

    if (match) {
      selected.push(match);
    }
  }

  for (const pillar of spec.programPillars) {
    if (selected.some((item) => item.id === pillar.id)) {
      continue;
    }

    selected.push(pillar);
  }

  return selected.slice(0, 3);
}

function renderProgramCards(programItems: ConferenceSiteProgramContent[]): string {
  return programItems.map((pillar) => {
    return `
      <article class="track-card">
        <p class="track-kicker">${escapeHtml(pillar.eyebrow)}</p>
        <strong>${escapeHtml(pillar.title)}</strong>
        <p>${escapeHtml(pillar.summary)}</p>
      </article>
    `;
  }).join('');
}

function renderAudienceTags(spec: ConferenceSiteBriefSpec): string {
  return spec.audience.map((audience) => `<span>${escapeHtml(audience)}</span>`).join('');
}

function renderExperienceCards(experienceMoments: ConferenceSiteExperienceContent[]): string {
  return experienceMoments
    .slice(0, 2)
    .map(
      (moment) => `
        <article class="panel">
          <p class="track-kicker">${escapeHtml(moment.label)}</p>
          <h2>${escapeHtml(moment.title)}</h2>
          <p>${escapeHtml(moment.summary)}</p>
        </article>
      `
    )
    .join('');
}

function getFallbackLayoutVariant(workerInfluence: WorkerInfluence): ConferenceSiteLayoutVariant {
  switch (workerInfluence.variant) {
    case 'minimal':
      return 'minimal-grid';
    case 'systems':
      return 'systems-grid';
    case 'visual':
      return 'showcase-stack';
    case 'operations':
      return 'operations-deck';
    case 'balanced':
    default:
      return 'balanced-summit';
  }
}

function getFallbackHeroLayout(layoutVariant: ConferenceSiteLayoutVariant): ConferenceSiteHeroLayout {
  switch (layoutVariant) {
    case 'showcase-stack':
      return 'immersive';
    case 'minimal-grid':
      return 'stacked';
    default:
      return 'split';
  }
}

function getFallbackDesignLanguage(
  workerInfluence: WorkerInfluence
): ConferenceSiteDesignLanguage {
  switch (workerInfluence.variant) {
    case 'minimal':
      return 'brutalist';
    case 'systems':
      return 'systems';
    case 'visual':
      return 'festival';
    case 'operations':
      return 'editorial';
    case 'balanced':
    default:
      return 'skeuomorphic';
  }
}

function getFallbackVisualTreatment(
  workerInfluence: WorkerInfluence
): ConferenceSiteVisualTreatment {
  switch (workerInfluence.variant) {
    case 'visual':
      return 'poster-burst';
    case 'systems':
      return 'systems-board';
    case 'operations':
      return 'launch-grid';
    case 'minimal':
      return 'quiet-lux';
    case 'balanced':
    default:
      return 'editorial-signal';
  }
}

function getFallbackPanelStyle(workerInfluence: WorkerInfluence): ConferenceSitePanelStyle {
  switch (workerInfluence.variant) {
    case 'operations':
      return 'outline';
    case 'minimal':
      return 'solid';
    default:
      return 'glass';
  }
}

function getFallbackCardGeometry(workerInfluence: WorkerInfluence): ConferenceSiteCardGeometry {
  switch (workerInfluence.variant) {
    case 'systems':
      return 'sharp';
    case 'visual':
      return 'pill';
    default:
      return 'soft';
  }
}

function getFallbackDensity(workerInfluence: WorkerInfluence): ConferenceSiteDensity {
  switch (workerInfluence.variant) {
    case 'minimal':
      return 'dense';
    case 'visual':
      return 'airy';
    default:
      return 'balanced';
  }
}

function getFallbackTrackLayout(workerInfluence: WorkerInfluence): ConferenceSiteTrackLayout {
  switch (workerInfluence.variant) {
    case 'visual':
      return 'staggered';
    case 'operations':
      return 'stacked';
    default:
      return 'columns';
  }
}

function getFallbackHeadlineFont(
  profileTag: DeploymentProfileTag,
  workerInfluence: WorkerInfluence
): ConferenceSiteHeadlineFont {
  if (workerInfluence.variant === 'systems') {
    return 'mono';
  }

  if (profileTag === 'premium' || profileTag === 'stable') {
    return 'serif';
  }

  return 'sans';
}

function normalizeSectionOrder(sectionOrder?: ConferenceSiteSectionId[]): ConferenceSiteSectionId[] {
  const canonical: ConferenceSiteSectionId[] = [
    'featured',
    'program',
    'attendance',
    'experience'
  ];

  if (!sectionOrder?.length) {
    return canonical;
  }

  const unique = sectionOrder.filter(
    (sectionId, index) =>
      canonical.includes(sectionId) && sectionOrder.indexOf(sectionId) === index
  );

  for (const sectionId of canonical) {
    if (!unique.includes(sectionId)) {
      unique.push(sectionId);
    }
  }

  return unique;
}

function buildFallbackGeneratedContent({
  spec,
  clientName,
  theme,
  profileTag,
  workerInfluence,
  strongestProgramTheme,
  attendeePromise,
  programPillars
}: {
  spec: ConferenceSiteBriefSpec;
  clientName: string;
  theme: ProfileTheme;
  profileTag: DeploymentProfileTag;
  workerInfluence: WorkerInfluence;
  strongestProgramTheme: string;
  attendeePromise: string;
  programPillars: ConferenceSiteProgramPillar[];
}): ConferenceSiteGeneratedContent {
  const layoutVariant = getFallbackLayoutVariant(workerInfluence);

  return {
    layoutVariant,
    designLanguage: getFallbackDesignLanguage(workerInfluence),
    heroLayout: getFallbackHeroLayout(layoutVariant),
    visualTreatment: getFallbackVisualTreatment(workerInfluence),
    panelStyle: getFallbackPanelStyle(workerInfluence),
    cardGeometry: getFallbackCardGeometry(workerInfluence),
    density: getFallbackDensity(workerInfluence),
    trackLayout: getFallbackTrackLayout(workerInfluence),
    detailLayout: workerInfluence.variant === 'visual' ? 'stacked' : 'columns',
    headlineFont: getFallbackHeadlineFont(profileTag, workerInfluence),
    sectionOrder:
      workerInfluence.variant === 'visual'
        ? ['featured', 'attendance', 'program', 'experience']
        : workerInfluence.variant === 'operations'
          ? ['attendance', 'program', 'featured', 'experience']
          : ['featured', 'program', 'attendance', 'experience'],
    heroHeadline: clientName,
    heroSubhead: theme.strapline,
    heroAtmosphere: workerInfluence.atmosphere,
    attendeePromise,
    attendeeSectionTitle: 'Why attend',
    summitThemeTitle: workerInfluence.summitThemeTitle,
    summitThemeCopy: spec.positioning,
    featuredDirectionTitle: strongestProgramTheme,
    featuredDirectionCopy: workerInfluence.focusCopy,
    featuredSectionTitle: 'Featured direction',
    programSectionTitle: 'Featured programming',
    programLead: workerInfluence.featureFrame,
    experienceSectionTitle: 'Attendee experience',
    experienceLead: workerInfluence.experienceLead,
    heroPrimaryCta: spec.heroPrimaryCta,
    heroSecondaryCta: spec.heroSecondaryCta,
    programItems: programPillars.map((pillar) => ({
      eyebrow: pillar.eyebrow,
      title: pillar.title,
      summary: pillar.summary
    })),
    experienceItems: spec.experienceMoments.slice(0, 2).map((moment) => ({
      label: moment.label,
      title: moment.title,
      summary: moment.summary
    })),
    footerNote: 'Programming, venue, and ticket updates continue throughout the season.'
  };
}

function renderFeaturedSection(content: ConferenceSiteGeneratedContent): string {
  return `
      <section class="detail-grid section-cluster" id="featured">
        <article class="panel">
          <p class="track-kicker">Summit theme</p>
          <h2>${escapeHtml(content.summitThemeTitle)}</h2>
          <p>${escapeHtml(content.summitThemeCopy)}</p>
        </article>
        <article class="panel">
          <p class="track-kicker">${escapeHtml(content.featuredSectionTitle)}</p>
          <h2>${escapeHtml(content.featuredDirectionTitle)}</h2>
          <p>${escapeHtml(content.featuredDirectionCopy)}</p>
        </article>
      </section>
    `;
}

function renderProgramSection(content: ConferenceSiteGeneratedContent): string {
  return `
      <section class="section" id="program">
        <h2>${escapeHtml(content.programSectionTitle)}</h2>
        <p class="section-copy">${escapeHtml(content.programLead)}</p>
        <div class="track-grid">
          ${renderProgramCards(content.programItems)}
        </div>
      </section>
    `;
}

function renderAttendanceSection(content: ConferenceSiteGeneratedContent): string {
  return `
      <section class="section" id="attendance">
        <h2>${escapeHtml(content.attendeeSectionTitle)}</h2>
        <p class="section-copy">${escapeHtml(content.attendeePromise)}</p>
      </section>
    `;
}

function renderExperienceSection(content: ConferenceSiteGeneratedContent): string {
  return `
      <section class="section" id="experience">
        <h2>${escapeHtml(content.experienceSectionTitle)}</h2>
        <p class="section-copy">${escapeHtml(content.experienceLead)}</p>
        <div class="detail-grid">
          ${renderExperienceCards(content.experienceItems)}
        </div>
      </section>
    `;
}

function renderConferenceSiteHtml({
  brief,
  siteTitle,
  profileTag,
  result,
  spec,
  workerInfluence,
  generatedContent
}: {
  brief: Brief;
  siteTitle: string;
  profileTag: DeploymentProfileTag;
  result: RunResult;
  spec: ConferenceSiteBriefSpec;
  workerInfluence: WorkerInfluence;
  generatedContent: ConferenceSiteGeneratedContent;
}): string {
  const theme = PROFILE_THEMES[profileTag];
  const metricRanking = getMetricRanking(result.evaluation?.metrics);
  const programPillars = selectProgramPillars(spec, metricRanking);
  const clientName = escapeHtml(brief.clientName);
  const rawContent =
    generatedContent.programItems.length >= 3 &&
    generatedContent.experienceItems.length >= 2
      ? generatedContent
      : buildFallbackGeneratedContent({
          spec,
          clientName: brief.clientName,
          theme,
          profileTag,
          workerInfluence,
          strongestProgramTheme:
            generatedContent.featuredDirectionTitle ||
            spec.programPillars[0]?.title ||
            'Featured programming',
          attendeePromise: generatedContent.attendeePromise,
          programPillars
        });
  const content: ConferenceSiteGeneratedContent = {
    ...rawContent,
    sectionOrder: normalizeSectionOrder(rawContent.sectionOrder)
  };
  const sectionsById: Record<ConferenceSiteSectionId, string> = {
    featured: renderFeaturedSection(content),
    program: renderProgramSection(content),
    attendance: renderAttendanceSection(content),
    experience: renderExperienceSection(content)
  };
  const orderedSections = content.sectionOrder.map((sectionId) => sectionsById[sectionId]).join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(siteTitle)}</title>
    <style>
      :root {
        --accent: ${theme.accent};
        --accent-soft: ${theme.accentSoft};
        --bg-a: ${theme.backgroundA};
        --bg-b: ${theme.backgroundB};
        --panel: ${theme.panel};
        --panel-muted: ${theme.panelMuted};
        --text: ${theme.text};
        --text-muted: ${theme.textMuted};
        --outline: ${theme.outline};
        --worker-accent: ${workerInfluence.accent};
        --worker-shadow: ${workerInfluence.shadow};
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Avenir Next", "Trebuchet MS", "Segoe UI", sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at top, rgba(255,255,255,0.16), transparent 32%),
          radial-gradient(circle at 22% 0%, color-mix(in srgb, var(--worker-accent) 38%, transparent), transparent 28%),
          linear-gradient(145deg, var(--bg-a), var(--bg-b));
        min-height: 100vh;
      }
      body.font-serif h1,
      body.font-serif h2 {
        font-family: Georgia, "Times New Roman", serif;
      }
      body.font-mono h1,
      body.font-mono h2,
      body.font-mono .track-kicker {
        font-family: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
      }
      body.influence-systems {
        background:
          linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px),
          radial-gradient(circle at top, rgba(255,255,255,0.12), transparent 28%),
          linear-gradient(145deg, var(--bg-a), var(--bg-b));
        background-size: 36px 36px, 36px 36px, auto, auto;
      }
      body.influence-minimal {
        background:
          linear-gradient(180deg, rgba(255,255,255,0.05), transparent 18%),
          linear-gradient(145deg, var(--bg-a), var(--bg-b));
      }
      body.influence-visual {
        background:
          radial-gradient(circle at 15% 15%, color-mix(in srgb, var(--worker-accent) 40%, transparent), transparent 24%),
          radial-gradient(circle at 82% 22%, rgba(255,255,255,0.12), transparent 22%),
          linear-gradient(145deg, var(--bg-a), var(--bg-b));
      }
      body.influence-operations {
        background:
          radial-gradient(circle at top, rgba(255,255,255,0.08), transparent 30%),
          linear-gradient(180deg, color-mix(in srgb, var(--worker-shadow) 16%, transparent), transparent 24%),
          linear-gradient(145deg, var(--bg-a), var(--bg-b));
      }
      body.visual-editorial-signal {
        background:
          radial-gradient(circle at top, rgba(255,255,255,0.16), transparent 32%),
          radial-gradient(circle at 22% 0%, color-mix(in srgb, var(--worker-accent) 38%, transparent), transparent 28%),
          linear-gradient(145deg, var(--bg-a), var(--bg-b));
      }
      body.visual-poster-burst {
        background:
          radial-gradient(circle at 14% 16%, color-mix(in srgb, var(--worker-accent) 50%, transparent), transparent 22%),
          radial-gradient(circle at 82% 12%, rgba(255,255,255,0.16), transparent 20%),
          linear-gradient(160deg, var(--bg-a), color-mix(in srgb, var(--bg-b) 82%, #09090b));
      }
      body.visual-systems-board {
        background:
          linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px),
          linear-gradient(145deg, var(--bg-a), var(--bg-b));
        background-size: 34px 34px, 34px 34px, auto;
      }
      body.visual-quiet-lux {
        background:
          linear-gradient(180deg, rgba(255,255,255,0.05), transparent 18%),
          radial-gradient(circle at top right, rgba(255,255,255,0.08), transparent 18%),
          linear-gradient(145deg, var(--bg-a), var(--bg-b));
      }
      body.visual-launch-grid {
        background:
          linear-gradient(180deg, color-mix(in srgb, var(--worker-shadow) 16%, transparent), transparent 24%),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(145deg, var(--bg-a), var(--bg-b));
        background-size: auto, 48px 48px, auto;
      }
      body.layout-minimal-grid .page {
        width: min(1040px, calc(100% - 40px));
      }
      body.layout-minimal-grid .hero-actions,
      body.layout-minimal-grid .hero-meta,
      body.layout-minimal-grid .program-tags {
        gap: 8px;
      }
      body.layout-minimal-grid .detail-grid,
      body.layout-minimal-grid .track-grid {
        gap: 12px;
      }
      body.layout-systems-grid .page {
        width: min(1200px, calc(100% - 32px));
      }
      body.layout-systems-grid .hero,
      body.layout-systems-grid .panel,
      body.layout-systems-grid .track-card {
        box-shadow: none;
      }
      body.layout-showcase-stack .hero-grid,
      body.layout-showcase-stack .detail-grid {
        grid-template-columns: 1fr;
      }
      body.layout-showcase-stack .track-grid {
        grid-template-columns: 1fr 1fr 1fr;
        gap: 20px;
      }
      body.layout-showcase-stack .section {
        margin-top: 26px;
      }
      body.layout-operations-deck .hero-grid {
        grid-template-columns: 1.2fr 0.8fr;
      }
      body.layout-operations-deck .detail-grid {
        grid-template-columns: 1fr 1fr;
      }
      body.layout-operations-deck .track-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      body.design-brutalist {
        background:
          linear-gradient(180deg, rgba(255,255,255,0.03), transparent 12%),
          linear-gradient(145deg, #111111, color-mix(in srgb, var(--bg-b) 82%, #050505));
      }
      body.design-brutalist .page {
        width: min(1180px, calc(100% - 24px));
      }
      body.design-brutalist .hero,
      body.design-brutalist .panel,
      body.design-brutalist .track-card {
        backdrop-filter: none;
        background: rgba(16, 16, 16, 0.9);
        border: 2px solid color-mix(in srgb, var(--worker-accent) 62%, white 8%);
        border-radius: 0;
        box-shadow: 12px 12px 0 rgba(0, 0, 0, 0.38);
      }
      body.design-brutalist h1,
      body.design-brutalist h2,
      body.design-brutalist .track-kicker {
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-family: "Arial Black", "Avenir Next Condensed", Impact, sans-serif;
      }
      body.design-brutalist .hero-actions a,
      body.design-brutalist .hero-meta span,
      body.design-brutalist .program-tags span {
        border-radius: 0;
      }
      body.design-brutalist .hero-actions .primary {
        background: var(--worker-accent);
        color: #0a0a0a;
        border: 2px solid #0a0a0a;
      }
      body.design-brutalist .hero-actions .secondary {
        background: #0a0a0a;
        border: 2px solid color-mix(in srgb, var(--worker-accent) 55%, white);
      }
      body.design-brutalist .track-grid,
      body.design-brutalist .detail-grid {
        gap: 22px;
      }
      body.design-skeuomorphic {
        background:
          radial-gradient(circle at top, rgba(255,255,255,0.18), transparent 24%),
          linear-gradient(180deg, rgba(255,255,255,0.08), transparent 22%),
          linear-gradient(145deg, color-mix(in srgb, var(--bg-a) 88%, #1f172d), color-mix(in srgb, var(--bg-b) 82%, #231839));
      }
      body.design-skeuomorphic .hero,
      body.design-skeuomorphic .panel,
      body.design-skeuomorphic .track-card {
        background:
          linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.06)),
          color-mix(in srgb, var(--panel) 88%, rgba(255,255,255,0.08));
        border: 1px solid rgba(255,255,255,0.24);
        border-radius: 28px;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.28),
          inset 0 -10px 18px rgba(0,0,0,0.12),
          0 24px 64px rgba(12, 17, 33, 0.28);
      }
      body.design-skeuomorphic .hero-actions a,
      body.design-skeuomorphic .hero-meta span,
      body.design-skeuomorphic .program-tags span {
        border: 1px solid rgba(255,255,255,0.26);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.26),
          0 8px 18px rgba(15, 23, 42, 0.18);
      }
      body.design-skeuomorphic .hero-actions .primary {
        background:
          linear-gradient(180deg, color-mix(in srgb, var(--accent-soft) 88%, white), color-mix(in srgb, var(--worker-accent) 34%, var(--accent-soft)));
        color: #111827;
      }
      body.design-skeuomorphic .hero-actions .secondary {
        background:
          linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04));
      }
      body.design-editorial .page {
        width: min(1020px, calc(100% - 44px));
      }
      body.design-editorial h1,
      body.design-editorial h2 {
        font-family: Georgia, "Iowan Old Style", "Times New Roman", serif;
        font-weight: 600;
        letter-spacing: -0.03em;
      }
      body.design-editorial .hero,
      body.design-editorial .panel,
      body.design-editorial .track-card {
        border-radius: 18px;
        background: rgba(255,255,255,0.08);
      }
      body.design-editorial .track-grid,
      body.design-editorial .detail-grid {
        gap: 14px;
      }
      body.design-systems {
        background:
          linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px),
          linear-gradient(145deg, var(--bg-a), color-mix(in srgb, var(--bg-b) 88%, #08111d));
        background-size: 28px 28px, 28px 28px, auto;
      }
      body.design-systems .hero,
      body.design-systems .panel,
      body.design-systems .track-card {
        backdrop-filter: none;
        background: rgba(8, 18, 28, 0.72);
        border: 1px solid color-mix(in srgb, var(--worker-accent) 32%, rgba(255,255,255,0.3));
        border-radius: 8px;
        box-shadow: none;
      }
      body.design-systems .hero-grid {
        grid-template-columns: 1fr 1fr;
      }
      body.design-systems h1,
      body.design-systems h2,
      body.design-systems .track-kicker {
        font-family: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
        letter-spacing: 0.02em;
      }
      body.design-systems .hero-actions a,
      body.design-systems .hero-meta span,
      body.design-systems .program-tags span {
        border-radius: 8px;
      }
      body.design-festival {
        background:
          radial-gradient(circle at 14% 14%, color-mix(in srgb, var(--worker-accent) 58%, transparent), transparent 22%),
          radial-gradient(circle at 84% 16%, rgba(255,255,255,0.18), transparent 18%),
          linear-gradient(160deg, color-mix(in srgb, var(--bg-a) 74%, #17062b), color-mix(in srgb, var(--bg-b) 72%, #0c1736));
      }
      body.design-festival .hero,
      body.design-festival .panel,
      body.design-festival .track-card {
        border-radius: 32px;
        background:
          linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.02)),
          color-mix(in srgb, var(--panel) 88%, rgba(255,255,255,0.08));
        border: 1px solid rgba(255,255,255,0.16);
        box-shadow:
          0 30px 90px rgba(20, 12, 42, 0.28),
          inset 0 1px 0 rgba(255,255,255,0.2);
      }
      body.design-festival .track-grid {
        gap: 22px;
      }
      body.design-festival .track-card:nth-child(2n) {
        transform: translateY(16px);
      }
      body.design-festival .hero-actions a {
        border-radius: 999px;
      }
      body.profile-premium h1,
      body.profile-stable h1 { font-family: Georgia, "Times New Roman", serif; }
      body.profile-flashy h1 { letter-spacing: 0.06em; text-transform: uppercase; }
      .page {
        width: min(1120px, calc(100% - 32px));
        margin: 0 auto;
        padding: 32px 0 56px;
      }
      body.density-airy .page { padding: 42px 0 72px; }
      body.density-dense .page { padding: 24px 0 40px; }
      .hero,
      .panel,
      .crew-card,
      .track-card {
        backdrop-filter: blur(18px);
        background: var(--panel);
        border: 1px solid var(--outline);
        box-shadow: 0 20px 60px rgba(15, 23, 42, 0.16);
      }
      .hero {
        position: relative;
        overflow: hidden;
        border-radius: 32px;
        padding: 28px;
        background:
          radial-gradient(circle at top right, color-mix(in srgb, var(--worker-accent) 26%, transparent), transparent 34%),
          radial-gradient(circle at bottom left, color-mix(in srgb, var(--worker-shadow) 32%, transparent), transparent 36%),
          var(--panel);
      }
      body.panel-solid .hero,
      body.panel-solid .panel,
      body.panel-solid .track-card {
        background: color-mix(in srgb, var(--bg-b) 44%, rgba(255,255,255,0.06));
        backdrop-filter: none;
      }
      body.panel-outline .hero,
      body.panel-outline .panel,
      body.panel-outline .track-card {
        background: transparent;
        backdrop-filter: none;
        box-shadow: none;
      }
      body.profile-messy .hero {
        border-radius: 18px 32px 22px 36px;
      }
      body.profile-failed .hero {
        border-style: dashed;
      }
      .hero-grid {
        display: grid;
        gap: 24px;
        grid-template-columns: 1.35fr 0.85fr;
      }
      .hero-grid.hero-layout-stacked,
      .hero-grid.hero-layout-immersive {
        grid-template-columns: 1fr;
      }
      .hero-grid.hero-layout-immersive {
        gap: 18px;
      }
      body.influence-minimal .hero,
      body.influence-minimal .panel,
      body.influence-minimal .track-card {
        border-radius: 14px;
        box-shadow: 0 16px 42px rgba(15, 23, 42, 0.14);
      }
      body.influence-minimal .hero-grid {
        grid-template-columns: 1.55fr 0.75fr;
      }
      body.influence-systems .hero,
      body.influence-systems .panel,
      body.influence-systems .track-card {
        border-radius: 10px;
      }
      body.influence-systems .hero-grid {
        grid-template-columns: 1fr 1fr;
      }
      body.influence-systems .detail-grid {
        grid-template-columns: 0.95fr 1.05fr;
      }
      body.influence-systems .track-grid {
        grid-template-columns: 1.25fr 0.9fr 0.85fr;
      }
      body.influence-visual .hero,
      body.influence-visual .panel,
      body.influence-visual .track-card {
        border-radius: 30px;
      }
      body.influence-operations .hero,
      body.influence-operations .panel,
      body.influence-operations .track-card {
        border-radius: 18px;
      }
      body.influence-operations .track-card,
      body.influence-operations .panel {
        border-left: 4px solid color-mix(in srgb, var(--worker-accent) 75%, white);
      }
      .hero h1 {
        margin: 0 0 12px;
        font-size: clamp(2.8rem, 8vw, 5.8rem);
        line-height: 0.95;
      }
      body.hero-immersive .hero h1 {
        max-width: 12ch;
        font-size: clamp(3.2rem, 9vw, 6.4rem);
      }
      .hero p {
        margin: 0;
        max-width: 46rem;
        color: var(--text-muted);
        line-height: 1.6;
      }
      .hero-actions,
      .hero-meta,
      .program-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .hero-actions { margin-top: 22px; }
      .hero-actions a {
        text-decoration: none;
        border-radius: 999px;
        padding: 12px 18px;
        font-weight: 700;
      }
      .hero-actions .primary {
        color: #111827;
        background: color-mix(in srgb, var(--worker-accent) 24%, var(--accent-soft));
      }
      .hero-actions .secondary {
        color: var(--text);
        border: 1px solid var(--outline);
      }
      .hero-meta span,
      .program-tags span {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 8px 12px;
        background: var(--panel-muted);
        border: 1px solid rgba(255,255,255,0.14);
        font-size: 12px;
      }
      .track-grid,
      .detail-grid {
        display: grid;
        gap: 16px;
      }
      body.detail-stacked .detail-grid {
        grid-template-columns: 1fr;
      }
      .detail-grid {
        margin-top: 22px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .panel {
        border-radius: 24px;
        padding: 22px;
      }
      body.geometry-sharp .hero,
      body.geometry-sharp .panel,
      body.geometry-sharp .track-card {
        border-radius: 8px;
      }
      body.geometry-pill .hero,
      body.geometry-pill .panel,
      body.geometry-pill .track-card {
        border-radius: 30px;
      }
      body.density-airy .hero { padding: 38px; }
      body.density-airy .panel,
      body.density-airy .track-card { padding: 24px; }
      body.density-dense .hero { padding: 22px; }
      body.density-dense .panel,
      body.density-dense .track-card { padding: 16px; }
      body.profile-messy .panel:first-child {
        transform: translateY(8px);
      }
      .section {
        margin-top: 18px;
      }
      .section h2 {
        margin: 0 0 14px;
        font-size: clamp(1.4rem, 4vw, 2rem);
      }
      .section-copy,
      .panel p,
      .track-card p {
        color: var(--text-muted);
        line-height: 1.6;
      }
      .track-card {
        border-radius: 22px;
        padding: 18px;
      }
      .track-card strong {
        display: block;
        margin-top: 8px;
        font-size: 1.2rem;
      }
      .track-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      body.track-stacked .track-grid {
        grid-template-columns: 1fr;
      }
      body.track-staggered .track-grid {
        align-items: start;
      }
      body.track-staggered .track-card:nth-child(2) {
        transform: translateY(16px);
      }
      body.track-staggered .track-card:nth-child(3) {
        transform: translateY(-10px);
      }
      body.profile-messy .track-grid {
        align-items: start;
      }
      body.profile-messy .track-card:nth-child(2) {
        transform: translateY(18px);
      }
      .track-kicker {
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 11px;
        font-weight: 800;
      }
      footer {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 12px;
        margin-top: 22px;
        color: var(--text-muted);
        font-size: 13px;
      }
      @media (max-width: 900px) {
        .hero-grid,
        .detail-grid,
        .track-grid {
          grid-template-columns: 1fr;
        }
        .page { width: min(100% - 20px, 1120px); padding-top: 20px; }
      }
    </style>
  </head>
      <body class="profile-${profileTag} influence-${workerInfluence.variant} layout-${content.layoutVariant} design-${content.designLanguage} hero-${content.heroLayout} visual-${content.visualTreatment} panel-${content.panelStyle} geometry-${content.cardGeometry} density-${content.density} track-${content.trackLayout} detail-${content.detailLayout} font-${content.headlineFont}">
    <main class="page">
      <section class="hero">
        <div class="hero-grid hero-layout-${content.heroLayout}">
          <div>
            <h1>${escapeHtml(content.heroHeadline)}</h1>
            <p>${escapeHtml(content.heroSubhead)}</p>
            <p style="margin-top:14px;">${escapeHtml(content.heroAtmosphere)}</p>
            <div class="hero-actions">
              <a class="primary" href="#program">${escapeHtml(content.heroPrimaryCta)}</a>
              <a class="secondary" href="#experience">${escapeHtml(content.heroSecondaryCta)}</a>
            </div>
          </div>
          <div>
            <div class="hero-meta">
              <span>${escapeHtml(spec.editionLabel)}</span>
              <span>${escapeHtml(spec.location)}</span>
              <span>${escapeHtml(spec.positioning)}</span>
            </div>
            <div class="program-tags" style="margin-top:16px;">
              ${renderAudienceTags(spec)}
            </div>
          </div>
        </div>
      </section>

      ${orderedSections}

      <footer>
        <span>${clientName}</span>
        <span>${escapeHtml(spec.editionLabel)} • ${escapeHtml(spec.location)}</span>
        <span>${escapeHtml(content.footerNote)}</span>
      </footer>
    </main>
  </body>
</html>`;
}

export function buildConferenceSiteArtifact(
  input: ConferenceSiteArtifactInput,
  generatedContent?: ConferenceSiteGeneratedContent
): ArtifactBundle {
  const { brief, result, workers } = input;
  const spec = getConferenceSiteSpec(brief);
  const metadata = buildConferenceSiteArtifactMetadata(input);
  const { profileTag, siteTitle, ensName, notes, provenance } = metadata;
  const contributors = provenance.contributors;
  const leadContributor = contributors[0];
  const leadAgent = leadContributor
    ? workers.find((agent) => agent.id === leadContributor.workerId) ?? null
    : null;
  const workerInfluence = buildWorkerInfluence(leadAgent);
  const strongestMetricId = result.evaluation?.strongestMetricId ?? 'launchStability';
  const strongestProgramTheme =
    spec.programPillars.find((pillar) => pillar.metricId === strongestMetricId)?.title ??
    spec.programPillars[0]?.title ??
    'Featured programming';
  const attendeePromise =
    profileTag === 'premium'
      ? `${spec.attendeePromise} This version feels polished, intentional, and ready for a marquee audience.`
      : profileTag === 'flashy'
        ? `${spec.attendeePromise} This version leans louder, bolder, and more culturally charged.`
        : profileTag === 'stable'
          ? `${spec.attendeePromise} This version feels clearer, calmer, and easier to trust on first read.`
          : profileTag === 'messy'
            ? `${spec.attendeePromise} The ambition is visible, but the public surface still needs more refinement. ${workerInfluence.attendeePromiseExtension}`
            : `${spec.attendeePromise} This first public edition stays intentionally lightweight while the fuller summit experience comes together. ${workerInfluence.attendeePromiseExtension}`;
  const fallbackGeneratedContent = buildFallbackGeneratedContent({
    spec,
    clientName: brief.clientName,
    theme: PROFILE_THEMES[profileTag],
    profileTag,
    workerInfluence,
    strongestProgramTheme,
    attendeePromise,
    programPillars: selectProgramPillars(spec, getMetricRanking(result.evaluation?.metrics))
  });
  const siteDocument = renderConferenceSiteHtml({
    brief,
    siteTitle,
    profileTag,
    result,
    spec,
    workerInfluence,
    generatedContent: generatedContent ?? fallbackGeneratedContent
  });

  return {
    artifactType: brief.artifactType,
    profileTag,
    siteTitle,
    ensName,
    notes,
    siteDocument,
    provenance
  };
}

export function buildConferenceSiteArtifactFromDocument(
  input: ConferenceSiteArtifactInput,
  document: {
    siteTitle?: string;
    siteDocument: string;
  }
): ArtifactBundle {
  const metadata = buildConferenceSiteArtifactMetadata(input);

  return {
    artifactType: metadata.brief.artifactType,
    profileTag: metadata.profileTag,
    siteTitle: document.siteTitle?.trim() || metadata.siteTitle,
    ensName: metadata.ensName,
    notes: metadata.notes,
    siteDocument: document.siteDocument,
    provenance: metadata.provenance
  };
}
