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
  ArtifactWorkerTrace,
  PipelineStageId,
  RunArtifactsInput
} from '../../src/types';
import { getArtifactDebugWorkers, getOpenAiApiKey, getOpenAiArtifactModel } from './env.js';

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

const StudioReportSchema = z.object({
  body: z.string().min(60).max(320)
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
  heroAtmosphere: z.string().min(40).max(220),
  aestheticThesis: z.string().min(40).max(220),
  paletteDirection: z.string().min(18).max(160),
  typographyDirection: z.string().min(18).max(160),
  surfaceDirection: z.string().min(18).max(180),
  interactionDirection: z.string().min(18).max(180),
  mobileDirection: z.string().min(18).max(180),
  implementationDirective: z.string().min(30).max(220),
  nonNegotiables: z.array(z.string().min(10).max(120)).length(3),
  antiPatterns: z.array(z.string().min(10).max(120)).length(3),
  screenshotTest: z.string().min(18).max(180),
  studioReport: StudioReportSchema
});

const ImplementationWorkerSchema = z.object({
  siteTitle: z.string().min(8).max(120),
  siteDocument: z.string().min(1200).max(50000),
  buildSummary: z.string().min(40).max(220),
  mobileStrategy: z.string().min(30).max(180),
  preservedSignals: z.array(z.string().min(8).max(120)).length(3),
  sectionHighlights: z.array(z.string().min(8).max(80)).length(3),
  studioReport: StudioReportSchema
});

const ReviewWorkerSchema = z.object({
  siteTitle: z.string().min(8).max(120),
  siteDocument: z.string().min(1200).max(50000),
  reviewSummary: z.string().min(40).max(220),
  correctionsMade: z.array(z.string().min(10).max(140)).length(3),
  mobileChecks: z.array(z.string().min(10).max(140)).length(2),
  riskCallout: z.string().min(20).max(180),
  studioReport: StudioReportSchema
});

const DeploymentWorkerSchema = z.object({
  siteTitle: z.string().min(8).max(120),
  siteDocument: z.string().min(1200).max(50000),
  launchSummary: z.string().min(40).max(220),
  shipReadiness: z.string().min(20).max(180),
  finalChecks: z.array(z.string().min(10).max(120)).length(3),
  studioReport: StudioReportSchema
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

type WorkerGenerationDirective = {
  hireWhen: string;
  nonNegotiables: string[];
  antiPatterns: string[];
  screenshotTest: string;
  implementationBias?: string[];
  reviewFocus?: string[];
};

export type WorkerGeneratedArtifactResult = {
  artifact: ArtifactBundle;
  usedFallback: boolean;
};

const shouldDebugWorkers = getArtifactDebugWorkers();

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
    specialty: agent.specialty,
    roleAffinity: agent.roleAffinity,
    assignedRole: roleName ?? null,
    traits: agent.traits,
    styleProfile: agent.styleProfile,
    temperament: agent.temperament,
    capabilityVector: agent.capabilityVector,
    bio: agent.bio,
    accent: agent.accent,
    shadow: agent.shadow
  };
}

function buildBaseContext(input: RunArtifactsInput): Record<string, unknown> {
  const conferenceBrief = input.brief.conferenceSiteSpec;

  return {
    cycle: input.cycle,
    studioName: input.studioName?.trim() || 'Ghost Studio',
    clientName: input.brief.clientName,
    conferenceBrief: conferenceBrief
      ? {
          editionLabel: conferenceBrief.editionLabel,
          location: conferenceBrief.location,
          audience: conferenceBrief.audience,
          positioning: conferenceBrief.positioning,
          attendeePromise: conferenceBrief.attendeePromise,
          heroPrimaryCta: conferenceBrief.heroPrimaryCta,
          heroSecondaryCta: conferenceBrief.heroSecondaryCta,
          toneKeywords: conferenceBrief.toneKeywords,
          visualDirection: conferenceBrief.visualDirection,
          publicGuidance: conferenceBrief.internalRequirements,
          programPillars: conferenceBrief.programPillars,
          experienceMoments: conferenceBrief.experienceMoments
        }
      : null,
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

function getWorkerGenerationDirective(agent: Agent): WorkerGenerationDirective {
  switch (agent.handle) {
    case 'rune-mercer':
      return {
        hireWhen: 'The concept is already strong and needs to be built fast without losing its edge.',
        nonNegotiables: [
          'Preserve the designer’s sharpest decisions instead of softening them.',
          'Keep CTA surfaces, hierarchy, and contrast decisive rather than polite.',
          'Ship a lean build that still feels tense, intentional, and committed.'
        ],
        antiPatterns: [
          'Do not round off or calm down a confrontational design language.',
          'Do not over-explain the interface just to make it feel safer.',
          'Do not add ornamental polish that weakens the core thesis.'
        ],
        screenshotTest:
          'The screenshot should feel like the original concept actually survived implementation.',
        implementationBias: [
          'Bias toward fidelity over reinterpretation.',
          'Bias toward bold interfaces over reassuring neutrality.',
          'Bias toward strong rails and fast, direct execution.'
        ]
      };
    case 'dorian-ash':
      return {
        hireWhen: 'The site needs stronger hierarchy, calmer structure, and more trust without collapsing the concept.',
        nonNegotiables: [
          'Hierarchy should be obvious within two seconds of seeing the page.',
          'Grids, spacing, and section logic must feel deliberate and coherent.',
          'Responsive behavior should increase trust instead of introducing chaos.'
        ],
        antiPatterns: [
          'Do not let visual gestures obscure scanning or navigation.',
          'Do not preserve asymmetry when it weakens the information architecture.',
          'Do not allow flashy styling to outrun structural coherence.'
        ],
        screenshotTest:
          'The screenshot should feel calmer, more legible, and more production-ready before any copy is read.',
        implementationBias: [
          'Bias toward hierarchy, rhythm, and durable structure.',
          'Bias toward responsive robustness on narrow screens.',
          'Bias toward trust and legibility over spectacle.'
        ]
      };
    case 'kestrel-vale':
      return {
        hireWhen: 'The site needs tactile product feel, clear navigation, and obvious interface depth.',
        nonNegotiables: [
          'Controls and panels should feel touchable, layered, and physically motivated.',
          'Navigation and state changes should feel explicit, product-like, and intuitive.',
          'Depth, glass, and control-room logic should be visible in a screenshot.'
        ],
        antiPatterns: [
          'Do not flatten the page into an editorial poster.',
          'Do not drift into brutalist austerity or pure signage.',
          'Do not use atmosphere alone when the interface should feel operable.'
        ],
        screenshotTest:
          'The screenshot should immediately feel like a tactile control surface you want to touch.'
      };
    case 'hexa-thorn':
      return {
        hireWhen: 'The site needs a bold identity and a public-facing visual thesis that lands instantly.',
        nonNegotiables: [
          'Use hard edges, oversized hierarchy, and poster-like public signage energy.',
          'Make the visual thesis obvious from the first screen without apology.',
          'Prioritize striking composition over soft product comfort.'
        ],
        antiPatterns: [
          'Do not round the interface into a friendly product dashboard.',
          'Do not hide the concept inside safe, neutral conference styling.',
          'Do not use luxury glass polish when the language should hit like a poster.'
        ],
        screenshotTest:
          'The screenshot should read like a brutalist launch poster translated into a website.'
      };
    case 'sable-quill':
      return {
        hireWhen: 'A promising build needs a final truth pass for brittle edges, copy trust, and risky assumptions.',
        nonNegotiables: [
          'Promises, labels, and CTA language must feel credible and specific.',
          'No broken states, confusing sections, or trust-undermining contradictions should survive.',
          'The review should preserve the concept while removing what makes the site feel suspicious.'
        ],
        antiPatterns: [
          'Do not let hype language outrun what the page actually proves.',
          'Do not preserve ambiguous structure just because it looks cool.',
          'Do not solve trust problems by flattening the design into something generic.'
        ],
        screenshotTest:
          'The reviewed page should still feel intentional, but noticeably less brittle and more trustworthy.',
        reviewFocus: [
          'Find broken assumptions and trust leaks.',
          'Tighten the wording where the site overreaches.',
          'Catch UX cracks that would embarrass the team in front of a client.'
        ]
      };
    case 'mint-halberd':
      return {
        hireWhen: 'The launch needs responsive QA, tiny-screen survivability, and release hardening.',
        nonNegotiables: [
          'The site must hold together cleanly at 250px with no horizontal scroll.',
          'Buttons, nav, and content stacks must remain readable and tappable on tiny screens.',
          'Launch polish should feel operationally calm rather than cosmetically flashy.'
        ],
        antiPatterns: [
          'Do not allow clipped cards, cropped hero content, or overflow-driven side scroll.',
          'Do not keep decorative layout moves that break on narrow screens.',
          'Do not trade mobile resilience for visual drama at release time.'
        ],
        screenshotTest:
          'A 250px screenshot should still look deliberate, intact, and fully usable.',
        reviewFocus: [
          'Stress-test the layout down to 250px width.',
          'Check tap targets, wrapping, and vertical flow under pressure.',
          'Harden the final page so it survives real launch conditions.'
        ]
      };
    default:
      return {
        hireWhen: agent.bio,
        nonNegotiables: ['Preserve the worker’s authored point of view through the handoff.'],
        antiPatterns: ['Do not collapse the output back into a generic conference template.'],
        screenshotTest: 'The resulting page should visibly belong to this worker.'
      };
  }
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

function trimValue(value: string, maxLength = 120): string {
  const trimmed = value.trim();
  return trimmed.length <= maxLength ? trimmed : `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

function buildDesignTrace(
  assignment: StageAssignment,
  output: DesignWorkerOutput,
  reportTo: string,
  finalizedDocument = false,
  siteTitle?: string
): ArtifactWorkerTrace {
  return {
    stageId: assignment.stageId,
    roleName: assignment.roleName,
    workerName: assignment.agent.name,
    workerSpecialty: assignment.agent.specialty,
    reportTo,
    reportBody: trimValue(output.studioReport.body, 320),
    summary: finalizedDocument
      ? `${assignment.agent.name} set the visual direction and also assembled the final shipped document.`
      : `${assignment.agent.name} established the visual thesis, non-negotiables, and implementation rules for the site.`,
    highlights: [
      { label: 'Direction', value: `${output.designLanguage} • ${output.visualTreatment}` },
      { label: 'Thesis', value: trimValue(output.aestheticThesis, 120) },
      { label: 'Non-negotiables', value: output.nonNegotiables.map((item) => trimValue(item, 44)).join(' • ') },
      { label: 'Screenshot test', value: trimValue(output.screenshotTest, 120) },
      ...(finalizedDocument && siteTitle
        ? [{ label: 'Final output', value: trimValue(siteTitle, 72) }]
        : [])
    ],
    finalizedDocument
  };
}

function buildImplementationTrace(
  assignment: StageAssignment,
  output: ImplementationWorkerOutput,
  reportTo: string,
  finalizedDocument = false,
  siteTitle?: string
): ArtifactWorkerTrace {
  return {
    stageId: assignment.stageId,
    roleName: assignment.roleName,
    workerName: assignment.agent.name,
    workerSpecialty: assignment.agent.specialty,
    reportTo,
    reportBody: trimValue(output.studioReport.body, 320),
    summary: finalizedDocument
      ? `${assignment.agent.name} built the first full HTML implementation and that build shipped as the final document.`
      : `${assignment.agent.name} turned the design contract into a real first-pass HTML site with responsive structure.`,
    highlights: [
      { label: 'Site title', value: trimValue(output.siteTitle, 72) },
      { label: 'Build summary', value: trimValue(output.buildSummary, 120) },
      { label: 'Preserved signals', value: output.preservedSignals.map((item) => trimValue(item, 40)).join(' • ') },
      { label: 'Mobile', value: trimValue(output.mobileStrategy, 120) },
      ...(finalizedDocument && siteTitle
        ? [{ label: 'Final output', value: trimValue(siteTitle, 72) }]
        : [])
    ],
    finalizedDocument
  };
}

function buildReviewTrace(
  assignment: StageAssignment,
  output: ReviewWorkerOutput,
  reportTo: string,
  finalizedDocument = false,
  siteTitle?: string
): ArtifactWorkerTrace {
  return {
    stageId: assignment.stageId,
    roleName: assignment.roleName,
    workerName: assignment.agent.name,
    workerSpecialty: assignment.agent.specialty,
    reportTo,
    reportBody: trimValue(output.studioReport.body, 320),
    summary: finalizedDocument
      ? `${assignment.agent.name} reviewed the built site, corrected the risky edges, and that reviewed version shipped.`
      : `${assignment.agent.name} reviewed the actual HTML build and returned a corrected site document.`,
    highlights: [
      { label: 'Review summary', value: trimValue(output.reviewSummary, 120) },
      { label: 'Corrections', value: output.correctionsMade.map((item) => trimValue(item, 42)).join(' • ') },
      { label: 'Mobile checks', value: output.mobileChecks.map((item) => trimValue(item, 44)).join(' • ') },
      { label: 'Risk callout', value: trimValue(output.riskCallout, 120) },
      ...(finalizedDocument && siteTitle
        ? [{ label: 'Final output', value: trimValue(siteTitle, 72) }]
        : [])
    ],
    finalizedDocument
  };
}

function buildDeploymentTrace(
  assignment: StageAssignment,
  output: DeploymentWorkerOutput,
  reportTo: string
): ArtifactWorkerTrace {
  return {
    stageId: assignment.stageId,
    roleName: assignment.roleName,
    workerName: assignment.agent.name,
    workerSpecialty: assignment.agent.specialty,
    reportTo,
    reportBody: trimValue(output.studioReport.body, 320),
    summary: `${assignment.agent.name} performed the final launch pass and prepared the standalone site for publishing.`,
    highlights: [
      { label: 'Final site title', value: trimValue(output.siteTitle, 72) },
      { label: 'Launch summary', value: trimValue(output.launchSummary, 120) },
      { label: 'Ship readiness', value: trimValue(output.shipReadiness, 120) },
      { label: 'Final checks', value: output.finalChecks.map((item) => trimValue(item, 38)).join(' • ') }
    ],
    finalizedDocument: true
  };
}

function buildWorkerTrace({
  studioName,
  designWorker,
  design,
  implementationWorker,
  implementation,
  reviewWorker,
  review,
  finalDocumentWorker,
  finalDocument
}: {
  studioName: string;
  designWorker: StageAssignment | undefined;
  design: DesignWorkerOutput | null;
  implementationWorker: StageAssignment | undefined;
  implementation: ImplementationWorkerOutput | null;
  reviewWorker: StageAssignment | undefined;
  review: ReviewWorkerOutput | null;
  finalDocumentWorker: StageAssignment | null;
  finalDocument:
    | Pick<ImplementationWorkerOutput, 'siteTitle'>
    | Pick<ReviewWorkerOutput, 'siteTitle'>
    | Pick<DeploymentWorkerOutput, 'siteTitle'>
    | null;
}): ArtifactWorkerTrace[] {
  const traces: ArtifactWorkerTrace[] = [];
  const reportTo = studioName.trim() || 'Studio Root';

  if (designWorker && design) {
    traces.push(
      buildDesignTrace(
        designWorker,
        design,
        reportTo,
        finalDocumentWorker?.stageId === 'design',
        finalDocument?.siteTitle
      )
    );
  }

  if (implementationWorker && implementation) {
    traces.push(
      buildImplementationTrace(
        implementationWorker,
        implementation,
        reportTo,
        finalDocumentWorker?.stageId === 'implementation',
        finalDocument?.siteTitle
      )
    );
  }

  if (reviewWorker && review) {
    traces.push(
      buildReviewTrace(
        reviewWorker,
        review,
        reportTo,
        finalDocumentWorker?.stageId === 'review',
        finalDocument?.siteTitle
      )
    );
  }

  if (finalDocumentWorker?.stageId === 'deployment' && finalDocument) {
    traces.push(
      buildDeploymentTrace(finalDocumentWorker, finalDocument as DeploymentWorkerOutput, reportTo)
    );
  }

  return traces;
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
      workerSpecialty: assignment.agent.specialty,
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
      workerSpecialty: assignment.agent.specialty,
      output: shouldDebugWorkers ? ((output as Record<string, unknown> | null) ?? null) : null,
      rawOutputText: shouldDebugWorkers ? rawOutputText : undefined,
      usedFallback,
      error: usedFallback ? 'Structured output was empty or failed schema validation.' : undefined
    });

    if (shouldDebugWorkers) {
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
      workerSpecialty: assignment.agent.specialty,
      output: null,
      rawOutputText: shouldDebugWorkers ? null : undefined,
      usedFallback: true,
      error: message
    });

    if (shouldDebugWorkers) {
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
    'You control the visual system, layout grammar, section order, headline framing, and the implementation rules that the next worker must follow.',
    'You must choose a strong design language and commit to it. The available design languages are brutalist, skeuomorphic, editorial, systems, and festival.',
    'Your workerDirective is binding. Follow its non-negotiables, avoid its anti-patterns, and make the screenshot test obviously true.',
    'Do not choose a safe middle-ground conference aesthetic. The site should visibly belong to this specific worker in a single screenshot.',
    'Use the schema to make real structural choices: choose how the hero is composed, how dense the page feels, how panels are treated, how section order works, and what the implementation worker must preserve.',
    'Write for a real conference audience. Never mention internal scores, QA language, pipelines, Hats, workers, authority systems, org charts, automation, deployment cycles, or that this text was generated.',
    'If the context contains internal production constraints, treat them as private implementation context rather than public-facing website copy.',
    'Your choices should reflect your authored worker identity strongly enough that Kestrel and Hexa would produce unmistakably different sites.',
    'You must also return a very short report body for the studio root wearer identified by studioName in the context.',
    'That report should be 2 or 3 concise first-person sentences explaining what you received, what you did, and what the next stage should know.',
    'Return only the schema fields.'
  ].join(' ');
}

function getImplementationSystemPrompt(): string {
  return [
    'You are the isolated implementation worker for a public-facing web3 conference website.',
    'You are building the first full standalone HTML/CSS document, not just writing content fields.',
    'You will receive a design contract from the design worker. Treat it as law. Your job is to implement it faithfully, not replace it with your own safer taste.',
    'Your own workerDirective affects execution quality, structure, and fidelity. It does not overrule the design worker when a design contract exists.',
    'Assume the design worker may have chosen an unusual layout or aesthetic; your job is to build that exact world into a believable conference site.',
    'Return a complete standalone HTML document with inline CSS and no script tags or external dependencies.',
    'The page must work cleanly down to 250px width with no horizontal scrolling, clipped hero content, or broken CTA wrapping.',
    'Stay grounded, specific, and conference-legible. Never expose internal mechanics, org mechanics, role systems, deployment process language, or game jargon.',
    'A screenshot of your implementation should still obviously read as the assigned designer’s site, not a generic frontend engineer override.',
    'You must also return a very short report body for the studio root wearer identified by studioName in the context.',
    'That report should be 2 or 3 concise first-person sentences explaining what you received, what you did, and what the next stage should know.',
    'Return only the schema fields.'
  ].join(' ');
}

function getReviewSystemPrompt(): string {
  return [
    'You are the isolated review worker for a public-facing web3 conference website.',
    'You are reviewing an actual built HTML/CSS site, not a text draft.',
    'You must inspect the provided standalone document, correct the risky parts, and return a revised standalone HTML document.',
    'Preserve the design contract. Do not sand away the intended aesthetic just to make the page safer.',
    'Your workerDirective is binding. Follow its reviewFocus, non-negotiables, and anti-patterns.',
    'The site must hold together down to 250px width with no horizontal scrolling, clipped cards, unreadable navigation, or broken CTA wrapping.',
    'Fix trust, clarity, hierarchy, and responsive issues without flattening the concept into generic conference boilerplate.',
    'Never mention internal tooling, generated artifacts, QA, client safety, org mechanics, or deployment process language in the public page.',
    'You must also return a very short report body for the studio root wearer identified by studioName in the context.',
    'That report should be 2 or 3 concise first-person sentences explaining what you received, what you corrected, and what the next stage should know.',
    'Return only the schema fields.'
  ].join(' ');
}

function getDeploymentSystemPrompt(): string {
  return [
    'You are the isolated deployment worker for a public-facing web3 conference website.',
    'You are responsible for the final shipped HTML document after implementation and review have already done their work.',
    'Use the reviewed site as your source of truth. Preserve the upstream design and implementation unless a final launch correction is necessary.',
    'Return a complete standalone HTML document with inline CSS. Do not rely on any pre-existing renderer, component library, or external stylesheet.',
    'Do not redesign the site from scratch. This is a final launch pass, not a new concept pass.',
    'The document must remain responsive and believable for a real web3 conference site, including 250px width with no horizontal scrolling.',
    'Do not include script tags, external asset dependencies, placeholder lorem ipsum, internal jargon, org mechanics, deployment process language, or comments explaining the generation process.',
    'You must also return a very short report body for the studio root wearer identified by studioName in the context.',
    'That report should be 2 or 3 concise first-person sentences explaining what you received, what you assembled, and the launch state you are handing upward.',
    'Return only the schema fields.'
  ].join(' ');
}

function buildFallbackContent(
  artifact: ReturnType<typeof buildConferenceSiteArtifact>,
  conferenceBrief: RunArtifactsInput['brief']['conferenceSiteSpec']
): ConferenceSiteGeneratedContent {
  const editionLabel = conferenceBrief?.editionLabel ?? 'March 2027';
  const location = conferenceBrief?.location ?? 'Denver, Colorado';

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
    heroSubhead:
      conferenceBrief?.positioning ??
      'A high-signal conference week for builders, operators, researchers, and collectors across the onchain ecosystem.',
    heroAtmosphere: `${editionLabel} in ${location} brings together practical programming, citywide energy, and a credible public-facing summit identity.`,
    attendeePromise:
      conferenceBrief?.attendeePromise ??
      'A high-signal summit for the people shaping the next generation of internet-native organizations and onchain culture.',
    attendeeSectionTitle: 'Why attend',
    summitThemeTitle: 'The next frontier of onchain culture and coordination',
    summitThemeCopy:
      conferenceBrief?.positioning ??
      'A web3 conference for the people designing internet-native products, shaping community culture, and building the public-facing infrastructure around them.',
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
        summary: 'Speaker reveals, workshop sessions, and citywide programming updates will continue to roll out as the summit approaches.'
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
    footerNote: 'Programming, venue, and ticket updates continue throughout the season.'
  };
}

function buildFallbackDesignContract(fallback: ConferenceSiteGeneratedContent) {
  return {
    layoutVariant: fallback.layoutVariant,
    designLanguage: fallback.designLanguage,
    heroLayout: fallback.heroLayout,
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
    aestheticThesis:
      'Create a credible marquee web3 conference site with a strong public-facing point of view and clear section hierarchy.',
    paletteDirection: `${fallback.designLanguage} palette with ${fallback.visualTreatment} energy and clear contrast.`,
    typographyDirection: `${fallback.headlineFont} headlines with hierarchy strong enough to survive on small screens.`,
    surfaceDirection: `${fallback.panelStyle} panels with ${fallback.cardGeometry} geometry and deliberate visual depth.`,
    interactionDirection:
      'Navigation and CTA surfaces should feel intentional, legible, and believable for a real event site.',
    mobileDirection:
      'Collapse cleanly to 250px width with no horizontal scroll, clipped hero content, or broken CTA wrapping.',
    implementationDirective:
      'Implement the design faithfully and keep the site visibly aligned to the chosen visual language through every section.',
    nonNegotiables: [
      'Strong first-screen identity',
      'Clear navigation and CTA hierarchy',
      'Responsive integrity down to 250px'
    ],
    antiPatterns: [
      'Generic SaaS conference styling',
      'Visual drift between sections',
      'Decorative overflow on small screens'
    ],
    screenshotTest:
      'A screenshot should feel like a specific, credible web3 conference site with an authored point of view.'
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
  const fallback = buildFallbackContent(deterministicFallback, input.brief.conferenceSiteSpec);
  const defaultDesignContract = buildFallbackDesignContract(fallback);

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
            workerDirective: getWorkerGenerationDirective(designWorker.agent),
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
      ...defaultDesignContract,
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
            heroAtmosphere: design.heroAtmosphere,
            aestheticThesis: design.aestheticThesis,
            paletteDirection: design.paletteDirection,
            typographyDirection: design.typographyDirection,
            surfaceDirection: design.surfaceDirection,
            interactionDirection: design.interactionDirection,
            mobileDirection: design.mobileDirection,
            implementationDirective: design.implementationDirective,
            nonNegotiables: design.nonNegotiables,
            antiPatterns: design.antiPatterns,
            screenshotTest: design.screenshotTest
          }
        : {})
    };
    const implementationSeed = {
      siteTitle: deterministicFallback.siteTitle,
      heroHeadline: designContract.heroHeadline,
      heroSubhead: designContract.heroSubhead,
      attendeePromise: fallback.attendeePromise,
      attendeeSectionTitle: fallback.attendeeSectionTitle,
      summitThemeTitle: fallback.summitThemeTitle,
      summitThemeCopy: fallback.summitThemeCopy,
      featuredSectionTitle: fallback.featuredSectionTitle,
      programSectionTitle: fallback.programSectionTitle,
      programLead: fallback.programLead,
      experienceSectionTitle: fallback.experienceSectionTitle,
      experienceLead: fallback.experienceLead,
      heroPrimaryCta: fallback.heroPrimaryCta,
      heroSecondaryCta: fallback.heroSecondaryCta,
      programItems: fallback.programItems,
      experienceItems: fallback.experienceItems,
      footerNote: fallback.footerNote
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
            workerDirective: getWorkerGenerationDirective(implementationWorker.agent),
            designContract,
            designOutput: design,
            contentSeed: implementationSeed
          }
        })
      : null;
    const implementation = implementationResult?.output ?? null;

    const reviewWorker = assignments.get('review');
    const reviewResult = reviewWorker && implementation?.siteDocument?.trim()
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
            workerDirective: getWorkerGenerationDirective(reviewWorker.agent),
            designContract,
            implementedSite: {
              siteTitle: implementation.siteTitle,
              siteDocument: implementation.siteDocument
            },
            implementationSummary: {
              buildSummary: implementation.buildSummary,
              mobileStrategy: implementation.mobileStrategy,
              preservedSignals: implementation.preservedSignals,
              sectionHighlights: implementation.sectionHighlights
            }
          }
        })
      : null;
    const review = reviewResult?.output ?? null;

    const deploymentWorker = assignments.get('deployment');
    const deploymentSource = review?.siteDocument?.trim()
      ? {
          siteTitle: review.siteTitle,
          siteDocument: review.siteDocument
        }
      : implementation?.siteDocument?.trim()
        ? {
            siteTitle: implementation.siteTitle,
            siteDocument: implementation.siteDocument
          }
        : null;
    const deploymentResult = deploymentWorker && deploymentSource
      ? await runStructuredWorker({
          client,
          schema: DeploymentWorkerSchema,
          schemaName: 'conference_deployment_worker_output',
          systemPrompt: getDeploymentSystemPrompt(),
          assignment: deploymentWorker,
          sink,
          context: {
            ...baseContext,
            stage: 'deployment',
            worker: summarizeWorker(deploymentWorker.agent, deploymentWorker.roleName),
            workerDirective: getWorkerGenerationDirective(deploymentWorker.agent),
            designContract,
            reviewedSite: deploymentSource,
            reviewSummary: review
              ? {
                  reviewSummary: review.reviewSummary,
                  correctionsMade: review.correctionsMade,
                  mobileChecks: review.mobileChecks,
                  riskCallout: review.riskCallout
                }
              : null
          }
        })
      : null;
    const finalDocumentWorker =
      deploymentResult?.output && deploymentWorker
        ? deploymentWorker
        : review?.siteDocument?.trim() && reviewWorker
          ? reviewWorker
          : implementation?.siteDocument?.trim() && implementationWorker
            ? implementationWorker
            : null;
    const finalDocument =
      deploymentResult?.output ??
      review ??
      implementation ??
      null;

    const usedFallback = Boolean(
      designResult?.usedFallback ||
        implementationResult?.usedFallback ||
        reviewResult?.usedFallback ||
        deploymentResult?.usedFallback
    );

    if (usedFallback) {
      const failedStages = [
        designResult?.usedFallback ? designWorker?.stageId : null,
        implementationResult?.usedFallback ? implementationWorker?.stageId : null,
        reviewResult?.usedFallback ? reviewWorker?.stageId : null,
        deploymentResult?.usedFallback ? deploymentWorker?.stageId : null
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
    const workerTrace = buildWorkerTrace({
      studioName: input.studioName?.trim() || 'Ghost Studio',
      designWorker,
      design,
      implementationWorker,
      implementation,
      reviewWorker,
      review,
      finalDocumentWorker,
      finalDocument
    });

    return {
      artifact: {
        ...artifact,
        workerTrace
      },
      usedFallback: false
    };
  } catch (error) {
    console.error('Conference site generation failed.', error);
    throw error;
  }
}
