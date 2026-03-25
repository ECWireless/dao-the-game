import type {
  Agent,
  ArtifactBundle,
  ClientReview,
  HatRole,
  RunResult
} from '../types';

export type AssignmentLogEntry = {
  id: string;
  message: string;
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
  runCount: number;
  assignmentLog: AssignmentLogEntry[];
};
