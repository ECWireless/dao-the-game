export type Agent = {
  id: string;
  roleAffinity: string;
  creativity: number;
  reliability: number;
  speed: number;
  cost: number;
};

export type HatRole = {
  id: string;
  name: string;
  assignedAgentId?: string;
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
  costBreakdown: CostBreakdown;
  scoreBreakdown: ScoreBreakdown;
};

export type RunResult = {
  qualityScore: number;
  cost: number;
  events: string[];
  cid: string;
  passed: boolean;
  diagnostics: RunDiagnostics;
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
};
