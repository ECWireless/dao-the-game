export type PipelineStageId = 'design' | 'implementation' | 'review' | 'deployment';

export type ArtifactType = 'conference-site';

export type RoleTagId =
  | 'ui-designer'
  | 'brand-designer'
  | 'frontend-engineer'
  | 'code-reviewer';

export type RoleTagDefinition = {
  id: RoleTagId;
  label: string;
  description: string;
};

export type WorkerManifest = {
  specVersion: 'dao-the-game.worker.v1';
  identity: {
    name: string;
    handle: string;
    roleTag: RoleTagId;
    bio: string;
    shortPitch: string;
  };
  execution: {
    publicEndpoint: string;
    paymentProtocol?: 'x402';
  };
  pricing: {
    asset: 'USDC';
    amount: string;
    chargeModel: 'per_request_attempt';
  };
};

export type WorkerRegistration = {
  erc8004Id?: string | null;
  ownerAddress?: string | null;
  engineerEmail?: string | null;
  status: 'pending' | 'registered';
  submittedAt?: string | null;
  updatedAt?: string | null;
};

export type WorkerPresentation = {
  accent: string;
  shadow: string;
};

export type DeploymentMetricId = 'visualIdentity' | 'launchStability' | 'communityHype' | 'trust';

export type DeploymentMetrics = Record<DeploymentMetricId, number>;

export type DeploymentProfileTag = 'premium' | 'flashy' | 'stable' | 'messy' | 'failed';

export type DeploymentContribution = {
  workerId: string;
  workerName: string;
  metricId: DeploymentMetricId;
  impact: number;
  summary: string;
};

export type DeploymentSynergyNote = {
  type: 'synergy' | 'tension';
  metricId?: DeploymentMetricId;
  impact: number;
  relatedWorkerIds: string[];
  summary: string;
};

export type DeploymentEvaluation = {
  artifactType: ArtifactType;
  profileTag: DeploymentProfileTag;
  headline: string;
  strongestMetricId: DeploymentMetricId;
  weakestMetricId: DeploymentMetricId;
  metrics: DeploymentMetrics;
  contributions: DeploymentContribution[];
  synergies: DeploymentSynergyNote[];
};

export type CapabilityVector = Record<PipelineStageId, number>;

export type WorkerStyleProfile = {
  signature: string;
  execution: string;
  collaboration: string;
};

export type WorkerTemperament = {
  profile: string;
  pace: number;
  resilience: number;
  teamwork: number;
};

export type WorkerPlayerGuidance = {
  strengthLabel?: string;
  pairingHint?: string;
  riskLabel?: string;
  shortPitch?: string;
};

export type WorkerGameplayProfile = {
  roleAffinity: string;
  capabilityVector: CapabilityVector;
  styleProfile: WorkerStyleProfile;
  temperament: WorkerTemperament;
  traits: string[];
  playerGuidance?: WorkerPlayerGuidance;
};

export type WorkerRegistryRecord = {
  registryRecordId: string;
  manifest: WorkerManifest;
  registration: WorkerRegistration;
  availability: 'active' | 'paused';
  presentation?: WorkerPresentation;
};

export type Worker = WorkerRegistryRecord & {
  id: string;
  name: string;
  handle: string;
  roleTag: RoleTagId;
  specialty: string;
  bio: string;
  shortPitch: string;
  accent: string;
  shadow: string;
  roleAffinity: string;
  capabilityVector: CapabilityVector;
  styleProfile: WorkerStyleProfile;
  temperament: WorkerTemperament;
  traits: string[];
  gameplay: WorkerGameplayProfile;
};

export type EngineerIntake = {
  name: string;
  roleTag: RoleTagId;
  description: string;
  priceUsdc: string;
  referenceUrls?: string[];
  styleNotes?: string;
  engineerEmail?: string;
};

export type HatExecutionMode = 'worker' | 'squad';

export type HatMetadata = {
  allowedRoleTagIds: RoleTagId[];
  pipelinePath: number[];
  executionMode: HatExecutionMode;
};

export type HatRole = {
  id: string;
  name: string;
  isConfigured?: boolean;
  assignedWorkerId?: string;
  pipelineStageId?: PipelineStageId;
  metadata?: HatMetadata;
};

export type ConferenceSiteProgramPillar = {
  id: string;
  metricId: DeploymentMetricId;
  eyebrow: string;
  title: string;
  summary: string;
};

export type ConferenceSiteExperienceMoment = {
  id: string;
  label: string;
  title: string;
  summary: string;
};

export type ConferenceSiteBriefSpec = {
  editionLabel: string;
  location: string;
  audience: string[];
  positioning: string;
  attendeePromise: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  toneKeywords: string[];
  visualDirection: string[];
  internalRequirements: string[];
  programPillars: ConferenceSiteProgramPillar[];
  experienceMoments: ConferenceSiteExperienceMoment[];
};

export type Brief = {
  id: string;
  artifactType: ArtifactType;
  clientName: string;
  mission: string;
  requirements: string[];
  baseScore: number;
  passThreshold: number;
  conferenceSiteSpec?: ConferenceSiteBriefSpec;
};

export type ArtifactContributor = {
  workerId: string;
  workerName: string;
  workerHandle: string;
  roleId?: string;
  roleName?: string;
  stageId?: PipelineStageId;
  roleTag: RoleTagId;
  specialty?: string;
  traits: string[];
};

export type ArtifactWorkerHighlight = {
  label: string;
  value: string;
};

export type ArtifactWorkerTrace = {
  stageId: PipelineStageId;
  roleName?: string;
  workerName: string;
  workerSpecialty: string;
  reportTo: string;
  reportBody: string;
  summary: string;
  highlights: ArtifactWorkerHighlight[];
  finalizedDocument?: boolean;
};

export type ArtifactProvenance = {
  artifactType: ArtifactType;
  briefId: string;
  clientName: string;
  studioName: string;
  cycle: 1 | 2;
  profileTag: DeploymentProfileTag;
  rawProfileTag?: DeploymentProfileTag;
  headline?: string;
  metrics?: DeploymentMetrics;
  contributors: ArtifactContributor[];
};

export type ArtifactBundle = {
  artifactType: ArtifactType;
  profileTag: DeploymentProfileTag;
  siteTitle: string;
  publicUrl?: string;
  previewUrl?: string;
  ensName: string;
  cid?: string;
  notes: string[];
  siteDocument: string;
  provenance: ArtifactProvenance;
  workerTrace?: ArtifactWorkerTrace[];
};

export type ClientReview = {
  cycle: 1 | 2;
  outcome: 'rejected' | 'approved';
  tone: 'fail' | 'success';
  sender: string;
  subject: string;
  notificationTitle: string;
  notificationPreview: string;
  inboxPreview: string;
  body: string[];
};

export type CostBreakdown = {
  base: number;
  licenses: number;
  events: number;
  total: number;
};

export type ScoreBreakdown = {
  base: number;
  stageInfluence?: number;
  visualIdentityInfluence: number;
  launchStabilityInfluence: number;
  communityHypeInfluence: number;
  trustInfluence: number;
  roleCoverageBonus: number;
  eventModifier: number;
  budgetPenalty: number;
  total: number;
};

export type RunDiagnostics = {
  seed: number;
  variance: number;
  passThreshold: number;
  runwayAfterRun: number;
  assignedRoleCount: number;
  totalRoleCount: number;
  coveredStageCount?: number;
  totalStageCount?: number;
  duplicateStageIds?: PipelineStageId[];
  costBreakdown: CostBreakdown;
  scoreBreakdown: ScoreBreakdown;
};

export type PipelineStageDefinition = {
  id: PipelineStageId;
  label: string;
  shortLabel: string;
  summary: string;
};

export type PipelineStageStatus = 'strong' | 'steady' | 'strained' | 'blocked';

export type PipelineStageResult = {
  id: PipelineStageId;
  label: string;
  roleId?: string;
  roleName?: string;
  assignedWorkerId?: string;
  operatorAffinity?: string;
  score: number;
  qualityDelta: number;
  cost: number;
  status: PipelineStageStatus;
  note: string;
  eventLabel?: string;
};

export type RunPipeline = {
  order: PipelineStageId[];
  stages: PipelineStageResult[];
  coveredStageCount: number;
  missingStageCount: number;
  strongestStageId?: PipelineStageId;
  weakestStageId?: PipelineStageId;
};

export type RunResult = {
  qualityScore: number;
  cost: number;
  events: string[];
  cid: string;
  passed: boolean;
  evaluation?: DeploymentEvaluation;
  diagnostics: RunDiagnostics;
  pipeline?: RunPipeline;
};

export type RunState = {
  seed: number;
  treasury: number;
  brief: Brief;
  roles: HatRole[];
  workers: Worker[];
};

export type RunArtifactsInput = {
  result: RunResult;
  brief: Brief;
  cycle: 1 | 2;
  studioName?: string;
  roles: HatRole[];
  workers: Worker[];
};
