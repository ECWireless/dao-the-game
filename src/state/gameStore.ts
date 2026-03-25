import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AssignmentLogEntry, GameStateSnapshot } from '../contracts/gameState';
import { FINAL_SCENE_INDEX } from '../levels/story';
import {
  TUTORIAL_BRIEF,
  TUTORIAL_ROLES,
  TUTORIAL_SEED,
  TUTORIAL_TREASURY
} from '../levels/tutorial';
import { generateStartingAgents, simulateRun } from '../sim';
import type {
  Agent,
  ArtifactBundle,
  ClientReview,
  HatRole,
  RunResult,
  RunState,
  ScoreBreakdown
} from '../types';

const GAME_STATE_STORAGE_KEY = 'dao-the-game:state:v3';
const FIRST_CYCLE_ROLE_COUNT = 1;
const DEFAULT_STUDIO_NAME = '';

type GameStore = {
  ownerPlayerId: string | null;
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
  runHistory: Partial<Record<1 | 2, RunResult>>;
  artifactHistory: Partial<Record<1 | 2, ArtifactBundle>>;
  clientReviews: Partial<Record<1 | 2, ClientReview>>;
  runCount: number;
  assignmentLog: AssignmentLogEntry[];
  hydrateForPlayer: (playerId: string, snapshot?: Partial<GameStateSnapshot> | null) => void;
  clearPlayerState: () => void;
  setStorySceneIndex: (next: number) => void;
  advanceStory: () => void;
  retreatStory: () => void;
  setStudioName: (name: string) => void;
  dismissIntroDialog: () => void;
  configureRole: (roleId: string, name: string) => void;
  unlockExpandedRoles: () => void;
  assignRole: (roleId: string, agentId: string) => void;
  unassignRole: (roleId: string) => void;
  runProduction: () => RunResult | undefined;
  setLatestArtifacts: (artifacts?: ArtifactBundle) => void;
  setClientReview: (cycle: 1 | 2, review: ClientReview) => void;
  resetTutorial: () => void;
};

type PersistedGameState = Omit<GameStateSnapshot, 'clientReviews'> & {
  runHistory: Partial<Record<1 | 2, RunResult>>;
  artifactHistory: Partial<Record<1 | 2, ArtifactBundle>>;
  clientReviews: Partial<Record<1 | 2, ClientReview>>;
  ownerPlayerId: string | null;
};

function cloneTutorialRoles(): HatRole[] {
  return TUTORIAL_ROLES.map((role) => ({ ...role, isConfigured: role.isConfigured ?? false }));
}

function createAssignmentLogEntry(message: string): AssignmentLogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    message
  };
}

function getInitialState(ownerPlayerId: string | null = null): PersistedGameState {
  return {
    ownerPlayerId,
    storySceneIndex: 0,
    unlockedRoleCount: FIRST_CYCLE_ROLE_COUNT,
    seed: TUTORIAL_SEED,
    treasury: TUTORIAL_TREASURY,
    studioName: DEFAULT_STUDIO_NAME,
    hasSeenIntroDialog: false,
    roles: cloneTutorialRoles(),
    agents: generateStartingAgents(TUTORIAL_SEED),
    latestRun: undefined,
    latestArtifacts: undefined,
    runHistory: {},
    artifactHistory: {},
    clientReviews: {},
    runCount: 0,
    assignmentLog: []
  };
}

function normalizeGameStateSnapshot(
  candidate: Partial<GameStateSnapshot> | undefined,
  ownerPlayerId: string | null
): PersistedGameState {
  const initial = getInitialState(ownerPlayerId);

  if (!candidate || typeof candidate !== 'object') {
    return initial;
  }

  return {
    ...initial,
    ...candidate,
    ownerPlayerId,
    storySceneIndex:
      typeof candidate.storySceneIndex === 'number'
        ? clampSceneIndex(candidate.storySceneIndex)
        : initial.storySceneIndex,
    unlockedRoleCount:
      typeof candidate.unlockedRoleCount === 'number'
        ? Math.max(
            FIRST_CYCLE_ROLE_COUNT,
            Math.min(candidate.unlockedRoleCount, initial.roles.length)
          )
        : initial.unlockedRoleCount,
    seed: typeof candidate.seed === 'number' ? candidate.seed : initial.seed,
    treasury: typeof candidate.treasury === 'number' ? candidate.treasury : initial.treasury,
    studioName:
      typeof candidate.studioName === 'string' ? candidate.studioName : initial.studioName,
    hasSeenIntroDialog:
      typeof candidate.hasSeenIntroDialog === 'boolean'
        ? candidate.hasSeenIntroDialog
        : initial.hasSeenIntroDialog,
    roles: Array.isArray(candidate.roles)
      ? initial.roles.map((role, index) => {
          const persistedRole = candidate.roles?.[index];

          if (!persistedRole) {
            return role;
          }

          return {
            ...role,
            ...persistedRole,
            isConfigured:
              typeof persistedRole.isConfigured === 'boolean'
                ? persistedRole.isConfigured
                : Boolean(persistedRole.assignedAgentId) || persistedRole.name !== role.name
          };
        })
      : initial.roles,
    agents: Array.isArray(candidate.agents) ? candidate.agents : initial.agents,
    latestRun: candidate.latestRun,
    latestArtifacts: candidate.latestArtifacts,
    runHistory:
      candidate.runHistory && typeof candidate.runHistory === 'object'
        ? (candidate.runHistory as Partial<Record<1 | 2, RunResult>>)
        : initial.runHistory,
    artifactHistory:
      candidate.artifactHistory && typeof candidate.artifactHistory === 'object'
        ? (candidate.artifactHistory as Partial<Record<1 | 2, ArtifactBundle>>)
        : initial.artifactHistory,
    clientReviews:
      candidate.clientReviews && typeof candidate.clientReviews === 'object'
        ? (candidate.clientReviews as Partial<Record<1 | 2, ClientReview>>)
        : initial.clientReviews,
    runCount: typeof candidate.runCount === 'number' ? candidate.runCount : initial.runCount,
    assignmentLog: Array.isArray(candidate.assignmentLog)
      ? candidate.assignmentLog
      : initial.assignmentLog
  };
}

export function buildGameStateSnapshot(
  state: Pick<
    GameStore,
    | 'storySceneIndex'
    | 'unlockedRoleCount'
    | 'seed'
    | 'treasury'
    | 'studioName'
    | 'hasSeenIntroDialog'
    | 'roles'
    | 'agents'
    | 'latestRun'
    | 'latestArtifacts'
    | 'runHistory'
    | 'artifactHistory'
    | 'clientReviews'
    | 'runCount'
    | 'assignmentLog'
  >
): GameStateSnapshot {
  return {
    storySceneIndex: state.storySceneIndex,
    unlockedRoleCount: state.unlockedRoleCount,
    seed: state.seed,
    treasury: state.treasury,
    studioName: state.studioName,
    hasSeenIntroDialog: state.hasSeenIntroDialog,
    roles: state.roles,
    agents: state.agents,
    latestRun: state.latestRun,
    latestArtifacts: state.latestArtifacts,
    runHistory: state.runHistory,
    artifactHistory: state.artifactHistory,
    clientReviews: state.clientReviews,
    runCount: state.runCount,
    assignmentLog: state.assignmentLog
  };
}

function clampSceneIndex(index: number): number {
  return Math.max(0, Math.min(index, FINAL_SCENE_INDEX));
}

function buildRunState(
  seed: number,
  treasury: number,
  roles: HatRole[],
  agents: Agent[]
): RunState {
  return {
    seed,
    treasury,
    brief: TUTORIAL_BRIEF,
    roles,
    agents
  };
}

export function getActiveRoles(roles: HatRole[], unlockedRoleCount: number): HatRole[] {
  const count = Math.max(FIRST_CYCLE_ROLE_COUNT, Math.min(unlockedRoleCount, roles.length));
  return roles.slice(0, count);
}

export function countAssignedRoles(roles: HatRole[]): number {
  return roles.filter((role) => Boolean(role.assignedAgentId)).length;
}

function getConfiguredRunRoles(roles: HatRole[]): HatRole[] {
  const configuredRoles = roles.filter((role) => role.isConfigured);
  return configuredRoles.length > 0 ? configuredRoles : roles;
}

export function estimateRunCost(roles: HatRole[], agents: Agent[]): number {
  const runnableRoles = getConfiguredRunRoles(roles);
  const agentById = new Map(agents.map((agent) => [agent.id, agent]));
  const assignedCost = runnableRoles.reduce((sum, role) => {
    if (!role.assignedAgentId) {
      return sum;
    }

    const agent = agentById.get(role.assignedAgentId);
    return sum + (agent?.contractCost ?? 0);
  }, 0);

  const baseCost = 36 + runnableRoles.length * 2;
  return baseCost + assignedCost;
}

export function estimateRunwayAfterRun(
  treasury: number,
  roles: HatRole[],
  agents: Agent[]
): number {
  return treasury - estimateRunCost(roles, agents);
}

function areRolesFullyAssigned(roles: HatRole[]): boolean {
  return roles.every((role) => Boolean(role.assignedAgentId));
}

function applyScoreOverride(result: RunResult, nextScore: number): RunResult {
  const scoreBreakdown: ScoreBreakdown = {
    ...result.diagnostics.scoreBreakdown,
    total: nextScore
  };

  return {
    ...result,
    qualityScore: nextScore,
    diagnostics: {
      ...result.diagnostics,
      scoreBreakdown
    }
  };
}

function forceFirstCycleFailure(result: RunResult): RunResult {
  const cappedScore = Math.min(result.qualityScore, TUTORIAL_BRIEF.passThreshold - 8);
  const withScore = applyScoreOverride(result, cappedScore);

  return {
    ...withScore,
    passed: false,
    events: [...withScore.events, 'Critical role coverage gap']
  };
}

function forceSecondCycleSuccess(result: RunResult): RunResult {
  if (result.passed) {
    return result;
  }

  const boostedScore = Math.max(result.qualityScore, TUTORIAL_BRIEF.passThreshold + 6);
  const withScore = applyScoreOverride(result, boostedScore);

  return {
    ...withScore,
    passed: true,
    events: [...withScore.events, 'Gremlin patch cadence stabilized client confidence']
  };
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...getInitialState(),
      hydrateForPlayer: (playerId, snapshot) => {
        const state = get();

        if (!snapshot) {
          if (state.ownerPlayerId === playerId) {
            set({ ownerPlayerId: playerId });
            return;
          }

          set(getInitialState(playerId));
          return;
        }

        set(normalizeGameStateSnapshot(snapshot, playerId));
      },
      clearPlayerState: () => {
        set(getInitialState());
      },
      setStorySceneIndex: (next) => {
        set({ storySceneIndex: clampSceneIndex(next) });
      },
      advanceStory: () => {
        set((state) => ({ storySceneIndex: clampSceneIndex(state.storySceneIndex + 1) }));
      },
      retreatStory: () => {
        set((state) => ({ storySceneIndex: clampSceneIndex(state.storySceneIndex - 1) }));
      },
      setStudioName: (name) => {
        set({ studioName: name.trim() });
      },
      dismissIntroDialog: () => {
        set({ hasSeenIntroDialog: true });
      },
      configureRole: (roleId, name) => {
        const state = get();
        const role = state.roles.find((item) => item.id === roleId);

        if (!role) {
          return;
        }

        const normalizedName = name.trim();

        if (!normalizedName) {
          return;
        }

        set({
          roles: state.roles.map((item) =>
            item.id === roleId
              ? {
                  ...item,
                  name: normalizedName,
                  isConfigured: true
                }
              : item
          ),
          assignmentLog: [
            createAssignmentLogEntry(`${normalizedName} added to the org chart.`),
            ...state.assignmentLog
          ].slice(0, 8)
        });
      },
      unlockExpandedRoles: () => {
        set((state) => ({ unlockedRoleCount: state.roles.length }));
      },
      assignRole: (roleId, agentId) => {
        const state = get();
        const activeRoles = getActiveRoles(state.roles, state.unlockedRoleCount);
        const isRoleUnlocked = activeRoles.some((role) => role.id === roleId);
        const role = state.roles.find((item) => item.id === roleId);
        const agent = state.agents.find((item) => item.id === agentId);

        if (!isRoleUnlocked || !role || !agent) {
          return;
        }

        set({
          roles: state.roles.map((item) =>
            item.id === roleId
              ? {
                  ...item,
                  assignedAgentId: agentId
                }
              : item.assignedAgentId === agentId
                ? {
                    ...item,
                    assignedAgentId: undefined
                  }
                : item
          ),
          assignmentLog: [
            createAssignmentLogEntry(
              `${role.name} assigned to ${agent.name}`
            ),
            ...state.assignmentLog
          ].slice(0, 8)
        });
      },
      unassignRole: (roleId) => {
        const state = get();
        const role = state.roles.find((item) => item.id === roleId);

        if (!role) {
          return;
        }

        set({
          roles: state.roles.map((item) =>
            item.id === roleId
              ? {
                  ...item,
                  assignedAgentId: undefined
                }
              : item
          ),
          assignmentLog: [
            createAssignmentLogEntry(`${role.name} unassigned`),
            ...state.assignmentLog
          ].slice(0, 8)
        });
      },
      runProduction: () => {
        const state = get();
        const activeRoles = getActiveRoles(state.roles, state.unlockedRoleCount);
        const runnableRoles = getConfiguredRunRoles(activeRoles);

        if (!areRolesFullyAssigned(runnableRoles)) {
          return undefined;
        }

        const runState = buildRunState(state.seed, state.treasury, runnableRoles, state.agents);
        let result = simulateRun(runState);

        if (state.runCount === 0) {
          result = forceFirstCycleFailure(result);
        } else if (state.runCount === 1) {
          result = forceSecondCycleSuccess(result);
        }

        set({
          runHistory: {
            ...state.runHistory,
            [Math.min(state.runCount + 1, 2) as 1 | 2]: result
          },
          runCount: state.runCount + 1,
          latestRun: result,
          latestArtifacts: undefined,
          treasury: state.treasury - result.cost,
          assignmentLog: [
            createAssignmentLogEntry(
              result.passed
                ? 'Build staged for client review.'
                : 'Build flagged for internal revision before client review.'
            ),
            ...state.assignmentLog
          ].slice(0, 8)
        });

        return result;
      },
      setLatestArtifacts: (artifacts) => {
        set((state) => ({
          latestArtifacts: artifacts,
          artifactHistory:
            artifacts && (state.runCount === 1 || state.runCount === 2)
              ? {
                  ...state.artifactHistory,
                  [state.runCount]: artifacts
                }
              : state.artifactHistory
        }));
      },
      setClientReview: (cycle, review) => {
        set((state) => ({
          clientReviews: {
            ...state.clientReviews,
            [cycle]: review
          }
        }));
      },
      resetTutorial: () => {
        set(getInitialState(get().ownerPlayerId));
      }
    }),
    {
      name: GAME_STATE_STORAGE_KEY,
      version: 6,
      storage: createJSONStorage(() => localStorage),
      partialize: (state): PersistedGameState => ({
        ownerPlayerId: state.ownerPlayerId,
        ...buildGameStateSnapshot(state),
        runHistory: state.runHistory,
        artifactHistory: state.artifactHistory,
        clientReviews: state.clientReviews
      }),
      migrate: (persistedState) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return getInitialState();
        }

        const candidate = persistedState as Partial<PersistedGameState>;
        return normalizeGameStateSnapshot(candidate, candidate.ownerPlayerId ?? null);
      }
    }
  )
);
