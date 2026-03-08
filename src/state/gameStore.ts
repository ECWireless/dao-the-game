import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { FINAL_SCENE_INDEX } from '../levels/story';
import {
  TUTORIAL_BRIEF,
  TUTORIAL_ROLES,
  TUTORIAL_SEED,
  TUTORIAL_TREASURY
} from '../levels/tutorial';
import { getRoleAffinityLabel } from '../roleAffinity';
import { generateArtifacts, generateStartingAgents, simulateRun } from '../sim';
import type { Agent, ArtifactBundle, HatRole, RunResult, RunState, ScoreBreakdown } from '../types';

const GAME_STATE_STORAGE_KEY = 'dao-the-game:state:v2';
const FIRST_CYCLE_ROLE_COUNT = 1;
const DEFAULT_STUDIO_NAME = '';

export type AssignmentLogEntry = {
  id: string;
  message: string;
};

type GameStore = {
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
  resetTutorial: () => void;
};

type PersistedGameState = Pick<
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
  | 'runCount'
  | 'assignmentLog'
>;

function cloneTutorialRoles(): HatRole[] {
  return TUTORIAL_ROLES.map((role) => ({ ...role, isConfigured: role.isConfigured ?? false }));
}

function createAssignmentLogEntry(message: string): AssignmentLogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    message
  };
}

function getInitialState() {
  return {
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
    runCount: 0,
    assignmentLog: []
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
    return sum + (agent?.cost ?? 0);
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

        const nextAffinity = getRoleAffinityLabel(roleId);

        set({
          agents: state.agents.map((item) =>
            item.id === agent.id
              ? {
                  ...item,
                  roleAffinity: nextAffinity
                }
              : item
          ),
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
              `${role.name} assigned to ${nextAffinity} (${agent.id})`
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
        const cycle = state.runCount === 0 ? 1 : 2;

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

        const artifacts = generateArtifacts({
          result,
          brief: TUTORIAL_BRIEF,
          cycle,
          studioName: state.studioName
        });

        set({
          runCount: state.runCount + 1,
          latestRun: result,
          latestArtifacts: artifacts,
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
      resetTutorial: () => {
        set(getInitialState());
      }
    }),
    {
      name: GAME_STATE_STORAGE_KEY,
      version: 4,
      storage: createJSONStorage(() => localStorage),
      partialize: (state): PersistedGameState => ({
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
        runCount: state.runCount,
        assignmentLog: state.assignmentLog
      }),
      migrate: (persistedState) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return getInitialState();
        }

        const candidate = persistedState as Partial<PersistedGameState>;
        const initial = getInitialState();

        return {
          ...initial,
          ...candidate,
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
              : initial.unlockedRoleCount
        };
      }
    }
  )
);
