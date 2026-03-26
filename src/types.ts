export type PipelineStageId = 'design' | 'implementation' | 'review' | 'deployment';

export type ArtifactType = 'conference-site';

export type DeploymentMetricId = 'visualIdentity' | 'launchStability' | 'communityHype' | 'trust';

export type DeploymentMetrics = Record<DeploymentMetricId, number>;

export type DeploymentProfileTag = 'premium' | 'flashy' | 'stable' | 'messy' | 'failed';

export type DeploymentContribution = {
  agentId: string;
  agentName: string;
  metricId: DeploymentMetricId;
  impact: number;
  summary: string;
};

export type DeploymentSynergyNote = {
  type: 'synergy' | 'tension';
  metricId?: DeploymentMetricId;
  impact: number;
  relatedAgentIds: string[];
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

export type Agent = {
  id: string;
  name: string;
  handle: string;
  specialty: string;
  roleAffinity: string;
  capabilityVector: CapabilityVector;
  styleProfile: WorkerStyleProfile;
  temperament: WorkerTemperament;
  traits: string[];
  bio: string;
  accent: string;
  shadow: string;
  contractCost: number;
  playerGuidance?: WorkerPlayerGuidance;
};

export type HatRole = {
  id: string;
  name: string;
  isConfigured?: boolean;
  assignedAgentId?: string;
  pipelineStageId?: PipelineStageId;
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
  agentId: string;
  agentName: string;
  agentHandle: string;
  roleId?: string;
  roleName?: string;
  stageId?: PipelineStageId;
  specialty: string;
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
  agents: number;
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
  assignedAgentId?: string;
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
  agents: Agent[];
};

export type RunArtifactsInput = {
  result: RunResult;
  brief: Brief;
  cycle: 1 | 2;
  studioName?: string;
  roles: HatRole[];
  agents: Agent[];
};
