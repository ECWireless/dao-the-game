export type Agent = {
  id: string;
  roleAffinity: string;
  creativity: number;
  reliability: number;
  speed: number;
  cost: number;
};

export type PipelineStageId = 'design' | 'implementation' | 'review' | 'deployment';

export type HatRole = {
  id: string;
  name: string;
  isConfigured?: boolean;
  assignedAgentId?: string;
  pipelineStageId?: PipelineStageId;
};

export type Brief = {
  id: string;
  clientName: string;
  mission: string;
  requirements: string[];
  baseScore: number;
  passThreshold: number;
};

export type ArtifactBundle = {
  siteTitle: string;
  publicUrl: string;
  previewUrl?: string;
  ensName: string;
  cid: string;
  notes: string[];
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
  creativityInfluence: number;
  speedInfluence: number;
  reliabilityPenalty: number;
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
};
