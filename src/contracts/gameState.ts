import type {
  Agent,
  ArtifactBundle,
  ClientReview,
  HatRole,
  PipelineStageId,
  RunResult
} from '../types';

export type AssignmentLogEntry = {
  id: string;
  message: string;
};

export type ArtifactGenerationRecovery = {
  cycle: 1 | 2;
  status: 'pending' | 'failed';
  lastKnownPhase: 'starting' | 'worker' | 'publishing';
  lastKnownStageId?: PipelineStageId;
  lastKnownWorkerName?: string;
  error?: string;
};

export type GameStateSnapshot = {
  storySceneIndex: number;
  unlockedRoleCount: number;
  seed: number;
  treasury: number;
  studioName: string;
  hasSeenIntroDialog: boolean;
  roles: HatRole[];
  agents: Agent[];
  latestRun?: RunResult;
  latestArtifacts?: ArtifactBundle;
  runHistory?: Partial<Record<1 | 2, RunResult>>;
  artifactHistory?: Partial<Record<1 | 2, ArtifactBundle>>;
  clientReviews?: Partial<Record<1 | 2, ClientReview>>;
  artifactGenerationRecovery?: ArtifactGenerationRecovery;
  runCount: number;
  assignmentLog: AssignmentLogEntry[];
};
