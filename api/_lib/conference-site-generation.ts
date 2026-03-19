import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import {
  buildConferenceSiteArtifact,
  buildConferenceSiteArtifactFromDocument,
  type ConferenceSiteDesignLanguage,
  type ConferenceSiteGeneratedContent,
  type ConferenceSiteDetailLayout,
  type ConferenceSiteHeadlineFont,
  type ConferenceSiteCardGeometry,
  type ConferenceSiteHeroLayout,
  type ConferenceSiteLayoutVariant,
  type ConferenceSitePanelStyle,
  type ConferenceSiteSectionId,
  type ConferenceSiteTrackLayout,
  type ConferenceSiteVisualTreatment
} from '../../src/artifacts/conferenceSite.js';
import type { ArtifactDeployEvent } from '../../src/contracts/artifact.js';
import type {
  Agent,
  ArtifactBundle,
  PipelineStageId,
  RunArtifactsInput
} from '../../src/types';
import { getOpenAiApiKey, getOpenAiArtifactModel } from './env.js';

const LAYOUT_VARIANTS = [
  'balanced-summit',
  'minimal-grid',
  'systems-grid',
  'showcase-stack',
  'operations-deck'
] as const satisfies readonly ConferenceSiteLayoutVariant[];

const HERO_LAYOUTS = [
  'split',
  'stacked',
  'immersive'
] as const satisfies readonly ConferenceSiteHeroLayout[];

const DESIGN_LANGUAGES = [
  'brutalist',
  'skeuomorphic',
  'editorial',
  'systems',
  'festival'
] as const satisfies readonly ConferenceSiteDesignLanguage[];

const VISUAL_TREATMENTS = [
  'editorial-signal',
  'poster-burst',
  'systems-board',
  'quiet-lux',
  'launch-grid'
] as const satisfies readonly ConferenceSiteVisualTreatment[];

const PANEL_STYLES = [
  'glass',
  'solid',
  'outline'
] as const satisfies readonly ConferenceSitePanelStyle[];

const CARD_GEOMETRIES = [
  'soft',
  'sharp',
  'pill'
] as const satisfies readonly ConferenceSiteCardGeometry[];

const DENSITIES = [
  'airy',
  'balanced',
  'dense'
] as const satisfies readonly ConferenceSiteGeneratedContent['density'][];

const TRACK_LAYOUTS = [
  'columns',
  'staggered',
  'stacked'
] as const satisfies readonly ConferenceSiteTrackLayout[];

const DETAIL_LAYOUTS = [
  'columns',
  'stacked'
] as const satisfies readonly ConferenceSiteDetailLayout[];

const HEADLINE_FONTS = [
  'serif',
  'sans',
  'mono'
] as const satisfies readonly ConferenceSiteHeadlineFont[];

const SECTION_IDS = [
  'featured',
  'program',
  'attendance',
  'experience'
] as const satisfies readonly ConferenceSiteSectionId[];

const ProgramItemSchema = z.object({
  eyebrow: z.string().min(4).max(40),
  title: z.string().min(8).max(90),
  summary: z.string().min(40).max(260)
});

const ExperienceItemSchema = z.object({
  label: z.string().min(3).max(24),
  title: z.string().min(8).max(90),
  summary: z.string().min(40).max(260)
});

const DesignWorkerSchema = z.object({
  layoutVariant: z.enum(LAYOUT_VARIANTS),
  designLanguage: z.enum(DESIGN_LANGUAGES),
  heroLayout: z.enum(HERO_LAYOUTS),
  visualTreatment: z.enum(VISUAL_TREATMENTS),
  panelStyle: z.enum(PANEL_STYLES),
  cardGeometry: z.enum(CARD_GEOMETRIES),
  density: z.enum(DENSITIES),
  trackLayout: z.enum(TRACK_LAYOUTS),
  detailLayout: z.enum(DETAIL_LAYOUTS),
  headlineFont: z.enum(HEADLINE_FONTS),
  sectionOrder: z.array(z.enum(SECTION_IDS)).length(4),
  heroHeadline: z.string().min(12).max(120),
  heroSubhead: z.string().min(40).max(260),
  heroAtmosphere: z.string().min(40).max(220)
});

const ImplementationWorkerSchema = z.object({
  attendeePromise: z.string().min(50).max(280),
  attendeeSectionTitle: z.string().min(8).max(60),
  summitThemeTitle: z.string().min(8).max(90),
  summitThemeCopy: z.string().min(50).max(280),
  featuredSectionTitle: z.string().min(8).max(60),
  programSectionTitle: z.string().min(8).max(60),
  programLead: z.string().min(40).max(220),
  experienceSectionTitle: z.string().min(8).max(60),
  programItems: z.array(ProgramItemSchema).length(3),
  experienceItems: z.array(ExperienceItemSchema).length(2)
});

const ReviewWorkerSchema = z.object({
  reviewedHeroHeadline: z.string().min(12).max(120),
  reviewedHeroSubhead: z.string().min(40).max(260),
  reviewedAttendeePromise: z.string().min(50).max(280),
  reviewedAttendeeSectionTitle: z.string().min(8).max(60),
  reviewedSummitThemeCopy: z.string().min(50).max(280),
  reviewedFeaturedSectionTitle: z.string().min(8).max(60),
  reviewedProgramSectionTitle: z.string().min(8).max(60),
  reviewedProgramLead: z.string().min(40).max(220),
  reviewedExperienceSectionTitle: z.string().min(8).max(60),
  reviewedExperienceLead: z.string().min(40).max(220)
});

const DeploymentWorkerSchema = z.object({
  siteTitle: z.string().min(8).max(120),
  siteDocument: z.string().min(1200).max(50000)
});

type DesignWorkerOutput = z.infer<typeof DesignWorkerSchema>;
type ImplementationWorkerOutput = z.infer<typeof ImplementationWorkerSchema>;
type ReviewWorkerOutput = z.infer<typeof ReviewWorkerSchema>;
type DeploymentWorkerOutput = z.infer<typeof DeploymentWorkerSchema>;

type StageAssignment = {
  agent: Agent;
  roleName?: string;
  stageId: PipelineStageId;
};

type GenerationEventSink = (event: ArtifactDeployEvent) => void | Promise<void>;

type WorkerRunResult<TSchema extends z.ZodTypeAny> = {
  output: z.infer<TSchema> | null;
  rawOutputText: string | null;
  usedFallback: boolean;
  error?: string;
};

export type WorkerGeneratedArtifactResult = {
  artifact: ArtifactBundle;
  usedFallback: boolean;
};

function createOpenAiClient(): OpenAI | null {
  const apiKey = getOpenAiApiKey();
  return apiKey ? new OpenAI({ apiKey }) : null;
}

export function canUseConferenceSiteGeneration(): boolean {
  return Boolean(getOpenAiApiKey());
}

function getStageAssignments(input: RunArtifactsInput): Map<PipelineStageId, StageAssignment> {
  const agentById = new Map(input.agents.map((agent) => [agent.id, agent]));
  const assignments = new Map<PipelineStageId, StageAssignment>();

  for (const stage of input.result.pipeline?.stages ?? []) {
    if (!stage.assignedAgentId) {
      continue;
    }

    const agent = agentById.get(stage.assignedAgentId);

    if (!agent) {
      continue;
    }

    assignments.set(stage.id, {
      agent,
      roleName: stage.roleName,
      stageId: stage.id
    });
  }

  return assignments;
}

function summarizeWorker(agent: Agent, roleName?: string): Record<string, unknown> {
  return {
    name: agent.name,
    handle: agent.handle,
    title: agent.title,
    archetype: agent.archetype,
    roleAffinity: agent.roleAffinity,
    assignedRole: roleName ?? null,
    traits: agent.traits,
    styleProfile: agent.styleProfile,
    temperament: agent.temperament,
    capabilityVector: agent.capabilityVector,
    bio: agent.bio
  };
}

function buildBaseContext(input: RunArtifactsInput): Record<string, unknown> {
  return {
    cycle: input.cycle,
    studioName: input.studioName?.trim() || 'Ghost Studio',
    clientName: input.brief.clientName,
    mission: input.brief.mission,
    requirements: input.brief.requirements,
    conferenceBrief: input.brief.conferenceSiteSpec ?? null,
    deploymentProfile: input.result.evaluation
      ? {
          profileTag: input.result.evaluation.profileTag,
          headline: input.result.evaluation.headline,
          strongestMetricId: input.result.evaluation.strongestMetricId,
          weakestMetricId: input.result.evaluation.weakestMetricId,
          synergies: input.result.evaluation.synergies
        }
      : null,
    pipeline: input.result.pipeline
      ? {
          strongestStageId: input.result.pipeline.strongestStageId,
          weakestStageId: input.result.pipeline.weakestStageId,
          stages: input.result.pipeline.stages.map((stage) => ({
            id: stage.id,
            roleName: stage.roleName,
            note: stage.note,
            status: stage.status
          }))
        }
      : null
  };
}

function getStageWorkerNote(stageId: PipelineStageId, workerName: string): string {
  switch (stageId) {
    case 'design':
      return `${workerName} is drafting the public-facing layout and tone.`;
    case 'implementation':
      return `${workerName} is turning the conference brief into a ship-ready site structure.`;
    case 'review':
      return `${workerName} is tightening trust, clarity, and client-facing polish.`;
    case 'deployment':
      return `${workerName} is packaging the final launch framing and release surface.`;
  }
}

function extractStructuredOutput<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  response: Awaited<ReturnType<OpenAI['responses']['parse']>>
): z.infer<TSchema> | null {
  if (response.output_parsed) {
    return response.output_parsed as z.infer<TSchema>;
  }

  const rawOutputText = response.output_text?.trim();

  if (!rawOutputText) {
    return null;
  }

  const normalizedOutputText = rawOutputText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(normalizedOutputText);
    const result = schema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

async function runStructuredWorker<TSchema extends z.ZodTypeAny>({
  client,
  schema,
  schemaName,
  systemPrompt,
  context,
  assignment,
  sink
}: {
  client: OpenAI;
  schema: TSchema;
  schemaName: string;
  systemPrompt: string;
  context: Record<string, unknown>;
  assignment: StageAssignment;
  sink?: GenerationEventSink;
}): Promise<WorkerRunResult<TSchema>> {
  await sink?.({
    type: 'worker-start',
    stageId: assignment.stageId,
    workerName: assignment.agent.name,
    workerTitle: assignment.agent.title,
    note: getStageWorkerNote(assignment.stageId, assignment.agent.name)
  });

  try {
    const response = await client.responses.parse({
      model: getOpenAiArtifactModel(),
      input: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: JSON.stringify(context, null, 2)
        }
      ],
      text: {
        format: zodTextFormat(schema, schemaName)
      }
    });

    const rawOutputText = response.output_text?.trim() || null;
    const output = extractStructuredOutput(schema, response);
    const usedFallback = !output;

    await sink?.({
      type: 'worker-output',
      stageId: assignment.stageId,
      workerName: assignment.agent.name,
      workerTitle: assignment.agent.title,
      output: output as Record<string, unknown> | null,
      rawOutputText,
      usedFallback,
      error: usedFallback ? 'Structured output was empty or failed schema validation.' : undefined
    });

    if (process.env.NODE_ENV !== 'production') {
      console.groupCollapsed(
        `[artifact worker] ${assignment.stageId} :: ${assignment.agent.name}${usedFallback ? ' (fallback)' : ''}`
      );
      console.log('context', context);
      console.log('rawOutputText', rawOutputText);
      console.log('parsedOutput', output);
      console.groupEnd();
    }

    return { output, rawOutputText, usedFallback };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Worker generation failed.';

    await sink?.({
      type: 'worker-output',
      stageId: assignment.stageId,
      workerName: assignment.agent.name,
      workerTitle: assignment.agent.title,
      output: null,
      rawOutputText: null,
      usedFallback: true,
      error: message
    });

    if (process.env.NODE_ENV !== 'production') {
      console.error(`[artifact worker] ${assignment.stageId} :: ${assignment.agent.name}`, error);
    }

    return {
      output: null,
      rawOutputText: null,
      usedFallback: true,
      error: message
    };
  }
}

function getDesignSystemPrompt(): string {
  return [
    'You are the isolated design worker for a public-facing web3 conference website.',
    'You control the visual system, layout grammar, section order, headline framing, and above-the-fold atmosphere.',
    'You must choose a strong design language and commit to it. The available design languages are brutalist, skeuomorphic, editorial, systems, and festival.',
    'Do not choose a safe middle-ground conference aesthetic. The site should visibly belong to this specific worker.',
    'Use the schema to make real structural choices: choose how the hero is composed, how dense the page feels, how panels are treated, how program cards are arranged, and what order the main sections appear in.',
    'Write for a real conference audience. Never mention internal scores, QA language, pipelines, Hats, workers, or that this text was generated.',
    'Your choices should reflect your authored worker identity strongly enough that a different worker would create a visibly different site.',
    'Return only the schema fields.'
  ].join(' ');
}

function getImplementationSystemPrompt(): string {
  return [
    'You are the isolated implementation worker for a public-facing web3 conference website.',
    'You expand the brief into concrete public-facing content blocks, section framing, and program structure.',
    'You will receive a design contract from the design worker. Treat it as binding: write copy, section framing, and information architecture that feel native to that exact visual system.',
    'Assume the design worker may have chosen an unusual layout or aesthetic; your job is to fill that layout with believable conference information, not generic placeholder prose.',
    'Do not fight the design contract or collapse it back into a generic conference template.',
    'If the design language is extreme, your copy should still be client-believable but it should clearly belong inside that exact interface world.',
    'Stay grounded, specific, and conference-legible. Never expose internal mechanics or game jargon.',
    'Let the worker identity shape emphasis and language, but keep the site believable for a real marquee web3 event.',
    'Return only the schema fields.'
  ].join(' ');
}

function getReviewSystemPrompt(): string {
  return [
    'You are the isolated review worker for a public-facing web3 conference website.',
    'You do not redesign the whole site. You tighten clarity, credibility, and trust while preserving the point of view established earlier.',
    'Preserve the design contract. Do not sand away the intended aesthetic just to make the copy safer.',
    'Rewrite the provided fields into cleaner public-facing conference copy. Never mention internal tooling, generated artifacts, QA, or client safety.',
    'Return only the schema fields.'
  ].join(' ');
}

function getDeploymentSystemPrompt(): string {
  return [
    'You are the isolated deployment worker for a public-facing web3 conference website.',
    'You are responsible for the final assembled HTML document.',
    'Use the design contract as law. Use the implementation and review outputs as the content source.',
    'Return a complete standalone HTML document with inline CSS. Do not rely on any pre-existing renderer, component library, or external stylesheet.',
    'The document should be responsive, public-facing, and believable for a real web3 conference site.',
    'The layout should visibly reflect the design worker choices, not collapse back into a safe generic landing page.',
    'Do not include script tags, external asset dependencies, placeholder lorem ipsum, internal jargon, or comments explaining the generation process.',
    'Return only the schema fields.'
  ].join(' ');
}

function getFinalDocumentSystemPrompt(stageId: PipelineStageId): string {
  if (stageId === 'deployment') {
    return getDeploymentSystemPrompt();
  }

  return [
    `You are the isolated ${stageId} worker, and you are also responsible for the final assembly pass because no later worker is present.`,
    'You must produce the final standalone HTML document for a public-facing web3 conference website.',
    'Use the design contract as law. Use the assembled draft as your source of truth for content and information architecture.',
    'Return a complete standalone HTML document with inline CSS. Do not rely on any pre-existing renderer, component library, or external stylesheet.',
    'The document should be responsive, public-facing, and believable for a real web3 conference site.',
    'Keep the site faithful to the aesthetic and structural intent already established instead of collapsing it back into a generic landing page.',
    'Do not include script tags, placeholder lorem ipsum, internal jargon, or comments explaining the generation process.',
    'Return only the schema fields.'
  ].join(' ');
}

function buildFallbackContent(artifact: ReturnType<typeof buildConferenceSiteArtifact>): ConferenceSiteGeneratedContent {
  const spec = artifact.provenance.metrics;
  void spec;

  return {
    layoutVariant: 'balanced-summit',
    designLanguage: 'editorial',
    heroLayout: 'split',
    visualTreatment: 'editorial-signal',
    panelStyle: 'glass',
    cardGeometry: 'soft',
    density: 'balanced',
    trackLayout: 'columns',
    detailLayout: 'columns',
    headlineFont: 'sans',
    sectionOrder: ['featured', 'program', 'attendance', 'experience'],
    heroHeadline: artifact.siteTitle.replace(/ \/\/ .+$/, ''),
    heroSubhead: artifact.notes[0] ?? 'A high-signal conference week for builders, operators, and onchain culture.',
    heroAtmosphere: artifact.notes[1] ?? 'Built for the current deployment cycle.',
    attendeePromise:
      artifact.notes[0] ??
      'A high-signal summit for the people building autonomous organizations and public onchain systems.',
    attendeeSectionTitle: 'Why attend',
    summitThemeTitle: 'The next frontier of autonomous organizations',
    summitThemeCopy:
      'A web3 conference for the people designing autonomous organizations, shipping onchain products, and shaping the culture around them.',
    featuredDirectionTitle: 'Featured programming',
    featuredDirectionCopy:
      'Sessions, labs, and side events built to help operators, founders, and researchers coordinate more effectively in public.',
    featuredSectionTitle: 'Featured direction',
    programSectionTitle: 'Featured programming',
    programLead:
      'A conference week for people who want strategic programming, practical rooms, and enough atmosphere to still feel unmistakably onchain.',
    experienceSectionTitle: 'Attendee experience',
    experienceLead:
      'The summit blends tactical programming, collector energy, and citywide moments designed to carry momentum beyond the main stage.',
    heroPrimaryCta: 'Explore the summit',
    heroSecondaryCta: 'View attendee guide',
    programItems: [
      {
        eyebrow: 'Programming',
        title: 'Summit programming to be announced',
        summary: 'The final public schedule is being assembled from the current deployment cycle.'
      },
      {
        eyebrow: 'Operators',
        title: 'System rooms and workshops',
        summary: 'Expect tactical sessions, governance conversations, and launch-focused rooms for serious builders.'
      },
      {
        eyebrow: 'Community',
        title: 'Side events across the city',
        summary: 'Collector gatherings, founder meetups, and ecosystem moments will round out the week.'
      }
    ],
    experienceItems: [
      {
        label: 'Daytime',
        title: 'Mainstage sessions and tactical labs',
        summary: 'The daytime program centers on product design, governance systems, treasury thinking, and agent tooling.'
      },
      {
        label: 'Evening',
        title: 'Launches, showcases, and social rooms',
        summary: 'As the summit shifts into the evening, attendees move through launches, installations, and citywide gatherings.'
      }
    ],
    footerNote: 'Built for the current deployment cycle'
  };
}

function composeGeneratedContent(
  fallback: ConferenceSiteGeneratedContent,
  design: DesignWorkerOutput | null,
  implementation: ImplementationWorkerOutput | null,
  review: ReviewWorkerOutput | null,
  deployment: DeploymentWorkerOutput | null
): ConferenceSiteGeneratedContent {
  const next: ConferenceSiteGeneratedContent = {
    ...fallback,
    ...(design
      ? {
          layoutVariant: design.layoutVariant,
          designLanguage: design.designLanguage,
          heroLayout: design.heroLayout,
          visualTreatment: design.visualTreatment,
          panelStyle: design.panelStyle,
          cardGeometry: design.cardGeometry,
          density: design.density,
          trackLayout: design.trackLayout,
          detailLayout: design.detailLayout,
          headlineFont: design.headlineFont,
          sectionOrder: design.sectionOrder,
          heroHeadline: design.heroHeadline,
          heroSubhead: design.heroSubhead,
          heroAtmosphere: design.heroAtmosphere
        }
      : {}),
    ...(implementation
      ? {
          attendeePromise: implementation.attendeePromise,
          attendeeSectionTitle: implementation.attendeeSectionTitle,
          summitThemeTitle: implementation.summitThemeTitle,
          summitThemeCopy: implementation.summitThemeCopy,
          featuredSectionTitle: implementation.featuredSectionTitle,
          programSectionTitle: implementation.programSectionTitle,
          programLead: implementation.programLead,
          experienceSectionTitle: implementation.experienceSectionTitle,
          programItems: implementation.programItems,
          experienceItems: implementation.experienceItems
        }
      : {}),
    ...(review
      ? {
          heroHeadline: review.reviewedHeroHeadline,
          heroSubhead: review.reviewedHeroSubhead,
          attendeePromise: review.reviewedAttendeePromise,
          attendeeSectionTitle: review.reviewedAttendeeSectionTitle,
          summitThemeCopy: review.reviewedSummitThemeCopy,
          featuredSectionTitle: review.reviewedFeaturedSectionTitle,
          programSectionTitle: review.reviewedProgramSectionTitle,
          programLead: review.reviewedProgramLead,
          experienceSectionTitle: review.reviewedExperienceSectionTitle,
          experienceLead: review.reviewedExperienceLead
        }
      : {}),
    ...(deployment
      ? {}
      : {})
  };

  return {
    ...next,
    programItems: next.programItems.slice(0, 3),
    experienceItems: next.experienceItems.slice(0, 2)
  };
}

export async function generateConferenceSiteArtifactWithWorkers(
  input: RunArtifactsInput,
  fallbackArtifact?: ReturnType<typeof buildConferenceSiteArtifact>,
  sink?: GenerationEventSink
): Promise<WorkerGeneratedArtifactResult> {
  const client = createOpenAiClient();
  const deterministicFallback = fallbackArtifact ?? buildConferenceSiteArtifact(input);
  void deterministicFallback;

  if (!client) {
    throw new Error('OpenAI artifact generation is unavailable. Add OPENAI_API_KEY and retry.');
  }

  const assignments = getStageAssignments(input);
  const baseContext = buildBaseContext(input);
  const fallback = buildFallbackContent(deterministicFallback);

  try {
    const designWorker = assignments.get('design');
    const designResult = designWorker
      ? await runStructuredWorker({
          client,
          schema: DesignWorkerSchema,
          schemaName: 'conference_design_worker_output',
          systemPrompt: getDesignSystemPrompt(),
          assignment: designWorker,
          sink,
          context: {
            ...baseContext,
            stage: 'design',
            worker: summarizeWorker(designWorker.agent, designWorker.roleName),
            currentDraft: {
              heroLayout: fallback.heroLayout,
              designLanguage: fallback.designLanguage,
              visualTreatment: fallback.visualTreatment,
              panelStyle: fallback.panelStyle,
              cardGeometry: fallback.cardGeometry,
              density: fallback.density,
              trackLayout: fallback.trackLayout,
              detailLayout: fallback.detailLayout,
              headlineFont: fallback.headlineFont,
              sectionOrder: fallback.sectionOrder,
              heroHeadline: fallback.heroHeadline,
              heroSubhead: fallback.heroSubhead,
              heroAtmosphere: fallback.heroAtmosphere,
              layoutVariant: fallback.layoutVariant
            }
          }
        })
      : null;
    const design = designResult?.output ?? null;
    const designContract = {
      designLanguage: design?.designLanguage ?? fallback.designLanguage,
      layoutVariant: design?.layoutVariant ?? fallback.layoutVariant,
      heroLayout: design?.heroLayout ?? fallback.heroLayout,
      visualTreatment: design?.visualTreatment ?? fallback.visualTreatment,
      panelStyle: design?.panelStyle ?? fallback.panelStyle,
      cardGeometry: design?.cardGeometry ?? fallback.cardGeometry,
      density: design?.density ?? fallback.density,
      trackLayout: design?.trackLayout ?? fallback.trackLayout,
      detailLayout: design?.detailLayout ?? fallback.detailLayout,
      headlineFont: design?.headlineFont ?? fallback.headlineFont,
      sectionOrder: design?.sectionOrder ?? fallback.sectionOrder
    };

    const implementationWorker = assignments.get('implementation');
    const implementationResult = implementationWorker
      ? await runStructuredWorker({
          client,
          schema: ImplementationWorkerSchema,
          schemaName: 'conference_implementation_worker_output',
          systemPrompt: getImplementationSystemPrompt(),
          assignment: implementationWorker,
          sink,
          context: {
            ...baseContext,
            stage: 'implementation',
            worker: summarizeWorker(implementationWorker.agent, implementationWorker.roleName),
            designContract,
            designOutput: design,
            currentDraft: {
              attendeePromise: fallback.attendeePromise,
              attendeeSectionTitle: fallback.attendeeSectionTitle,
              summitThemeTitle: fallback.summitThemeTitle,
              summitThemeCopy: fallback.summitThemeCopy,
              featuredSectionTitle: fallback.featuredSectionTitle,
              programSectionTitle: fallback.programSectionTitle,
              programLead: fallback.programLead,
              experienceSectionTitle: fallback.experienceSectionTitle
            }
          }
        })
      : null;
    const implementation = implementationResult?.output ?? null;

    const reviewWorker = assignments.get('review');
    const reviewResult = reviewWorker
      ? await runStructuredWorker({
          client,
          schema: ReviewWorkerSchema,
          schemaName: 'conference_review_worker_output',
          systemPrompt: getReviewSystemPrompt(),
          assignment: reviewWorker,
          sink,
          context: {
            ...baseContext,
            stage: 'review',
            worker: summarizeWorker(reviewWorker.agent, reviewWorker.roleName),
            designContract,
            draftForReview: {
              heroHeadline: design?.heroHeadline ?? fallback.heroHeadline,
              heroSubhead: design?.heroSubhead ?? fallback.heroSubhead,
              attendeePromise: implementation?.attendeePromise ?? fallback.attendeePromise,
              attendeeSectionTitle:
                implementation?.attendeeSectionTitle ?? fallback.attendeeSectionTitle,
              summitThemeCopy: implementation?.summitThemeCopy ?? fallback.summitThemeCopy,
              featuredSectionTitle:
                implementation?.featuredSectionTitle ?? fallback.featuredSectionTitle,
              programSectionTitle:
                implementation?.programSectionTitle ?? fallback.programSectionTitle,
              programLead: implementation?.programLead ?? fallback.programLead,
              experienceSectionTitle:
                implementation?.experienceSectionTitle ?? fallback.experienceSectionTitle,
              experienceLead: fallback.experienceLead
            }
          }
        })
      : null;
    const review = reviewResult?.output ?? null;

    const composedDraft = composeGeneratedContent(
      fallback,
      design,
      implementation,
      review,
      null
    );

    const finalDocumentWorker =
      assignments.get('deployment') ??
      assignments.get('review') ??
      assignments.get('implementation') ??
      assignments.get('design') ??
      null;
    const finalDocumentResult = finalDocumentWorker
      ? await runStructuredWorker({
          client,
          schema: DeploymentWorkerSchema,
          schemaName: 'conference_final_document_output',
          systemPrompt: getFinalDocumentSystemPrompt(finalDocumentWorker.stageId),
          assignment: finalDocumentWorker,
          sink,
          context: {
            ...baseContext,
            stage: finalDocumentWorker.stageId,
            worker: summarizeWorker(finalDocumentWorker.agent, finalDocumentWorker.roleName),
            designContract,
            assembledDraft: composedDraft
          }
        })
      : null;
    const finalDocument = finalDocumentResult?.output ?? null;

    const usedFallback = Boolean(
      designResult?.usedFallback ||
        implementationResult?.usedFallback ||
        reviewResult?.usedFallback ||
        finalDocumentResult?.usedFallback
    );

    if (usedFallback) {
      const failedStages = [
        designResult?.usedFallback ? designWorker?.stageId : null,
        implementationResult?.usedFallback ? implementationWorker?.stageId : null,
        reviewResult?.usedFallback ? reviewWorker?.stageId : null,
        finalDocumentResult?.usedFallback ? finalDocumentWorker?.stageId : null
      ].filter(Boolean);

      throw new Error(
        `Artifact generation failed in ${failedStages.join(', ')}. Review the worker logs and retry.`
      );
    }

    if (!finalDocument?.siteDocument?.trim()) {
      throw new Error('Artifact generation completed without a final HTML document.');
    }

    const artifact = buildConferenceSiteArtifactFromDocument(input, {
      siteTitle: finalDocument.siteTitle,
      siteDocument: finalDocument.siteDocument
    });

    return {
      artifact,
      usedFallback: false
    };
  } catch (error) {
    console.error('Conference site generation failed.', error);
    throw error;
  }
}
