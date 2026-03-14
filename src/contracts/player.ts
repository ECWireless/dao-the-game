import type { GameStateSnapshot } from './gameState';
import type { OrgRoleHatRecord, OrgTreeRecord } from './org';

export type PlayerRecord = {
  id: string;
  privyUserId: string;
  walletAddress: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProgressSummaryRecord = {
  currentBeat: string;
  currentSceneIndex: number;
  furthestBeat: string;
  furthestSceneIndex: number;
  updatedAt: string;
};

export type StoredGameStateRecord = {
  snapshot: GameStateSnapshot;
  updatedAt: string;
};

export type PlayerBootstrapRequest = {
  walletAddress?: string | null;
};

export type PlayerBootstrapResponse = {
  player: PlayerRecord;
  progress: ProgressSummaryRecord | null;
  gameState: StoredGameStateRecord | null;
  orgTree: OrgTreeRecord | null;
  orgRoleHats: OrgRoleHatRecord[];
};

export type ProgressRequest = {
  beat: string;
};

export type ProgressResponse = {
  progress: ProgressSummaryRecord;
};

export type GameStateRequest = {
  snapshot: GameStateSnapshot;
};

export type GameStateResponse = {
  gameState: StoredGameStateRecord;
};

export type ResetResponse = {
  progress: ProgressSummaryRecord;
};
