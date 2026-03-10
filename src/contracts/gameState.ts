import type {
  Agent,
  ArtifactBundle,
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
  runCount: number;
  assignmentLog: AssignmentLogEntry[];
};
