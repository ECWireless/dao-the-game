import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildGameStateSnapshot,
  countAssignedRoles,
  estimateRunCost,
  estimateRunwayAfterRun,
  getActiveRoles,
  useGameStore
} from '../gameStore';
import { FINAL_SCENE_INDEX } from '../../levels/story';
import { TUTORIAL_BRIEF } from '../../levels/tutorial';
import { generateArtifacts } from '../../sim';

beforeEach(() => {
  localStorage.clear();
  useGameStore.getState().clearPlayerState();
});

function assignAllVisibleRoles() {
  const state = useGameStore.getState();
  const activeRoles = getActiveRoles(state.roles, state.unlockedRoleCount);
  const recommendedAssignments: Record<string, string> = {
    'hat-01': 'agent-01',
    'hat-02': 'agent-03',
    'hat-03': 'agent-05',
    'hat-04': 'agent-06'
  };

  activeRoles.forEach((role, index) => {
    state.assignRole(
      role.id,
      recommendedAssignments[role.id] ?? `agent-${String(index + 1).padStart(2, '0')}`
    );
  });
}

function configureExpandedCycleTwoRoles() {
  const state = useGameStore.getState();
  state.configureRole('hat-01', 'Frontend Engineer');
  state.configureRole('hat-02', 'Designer');
  state.configureRole('hat-03', 'QA Reviewer');
  state.assignRole('hat-02', 'agent-03');
  state.assignRole('hat-03', 'agent-05');
}

describe('gameStore role visibility', () => {
  it('keeps current state when hydrating the same player without a snapshot', () => {
    const state = useGameStore.getState();
    state.hydrateForPlayer('player-one', null);
    state.setStorySceneIndex(4);
    state.unlockExpandedRoles();
    state.setStudioName('Night Shift');
    state.dismissIntroDialog();

    useGameStore.getState().hydrateForPlayer('player-one', null);
    const next = useGameStore.getState();

    expect(next.ownerPlayerId).toBe('player-one');
    expect(next.storySceneIndex).toBe(4);
    expect(next.unlockedRoleCount).toBe(next.roles.length);
    expect(next.studioName).toBe('Night Shift');
    expect(next.hasSeenIntroDialog).toBe(true);
  });

  it('resets to the initial tutorial state when switching players without a snapshot', () => {
    const state = useGameStore.getState();
    state.hydrateForPlayer('player-one', null);
    state.setStorySceneIndex(4);
    state.unlockExpandedRoles();
    state.setStudioName('Night Shift');
    state.dismissIntroDialog();
    state.assignRole('hat-01', 'agent-01');

    useGameStore.getState().hydrateForPlayer('player-two', null);
    const next = useGameStore.getState();

    expect(next.ownerPlayerId).toBe('player-two');
    expect(next.storySceneIndex).toBe(0);
    expect(next.unlockedRoleCount).toBe(1);
    expect(next.studioName).toBe('');
    expect(next.hasSeenIntroDialog).toBe(false);
    expect(next.roles.every((role) => role.assignedAgentId === undefined)).toBe(true);
  });

  it('tracks intro dialog dismissal and restores it on reset', () => {
    const state = useGameStore.getState();

    expect(state.hasSeenIntroDialog).toBe(false);

    state.dismissIntroDialog();
    expect(useGameStore.getState().hasSeenIntroDialog).toBe(true);

    useGameStore.getState().resetTutorial();
    expect(useGameStore.getState().hasSeenIntroDialog).toBe(false);
  });

  it('preserves ownerPlayerId when resetting the tutorial', () => {
    const state = useGameStore.getState();
    state.hydrateForPlayer('player-one', null);
    state.setStorySceneIndex(4);
    state.unlockExpandedRoles();
    state.setStudioName('Night Shift');

    useGameStore.getState().resetTutorial();
    const next = useGameStore.getState();

    expect(next.ownerPlayerId).toBe('player-one');
    expect(next.storySceneIndex).toBe(0);
    expect(next.unlockedRoleCount).toBe(1);
    expect(next.studioName).toBe('');
  });

  it('starts with one unlocked role for first cycle', () => {
    const state = useGameStore.getState();
    const activeRoles = getActiveRoles(state.roles, state.unlockedRoleCount);

    expect(activeRoles).toHaveLength(1);
  });

  it('unlocks full role tree when expanded', () => {
    const state = useGameStore.getState();
    state.unlockExpandedRoles();

    const next = useGameStore.getState();
    const activeRoles = getActiveRoles(next.roles, next.unlockedRoleCount);

    expect(activeRoles).toHaveLength(next.roles.length);
  });

  it('estimates cost/runway from active role subset', () => {
    const state = useGameStore.getState();
    const activeRoles = getActiveRoles(state.roles, state.unlockedRoleCount);

    const cost = estimateRunCost(activeRoles, state.agents);
    const runway = estimateRunwayAfterRun(state.treasury, activeRoles, state.agents);

    expect(runway).toBe(state.treasury - cost);
  });

  it('keeps agent assignments unique across roles', () => {
    const state = useGameStore.getState();
    state.unlockExpandedRoles();

    const expanded = useGameStore.getState();
    expanded.assignRole('hat-01', 'agent-01');
    expanded.assignRole('hat-02', 'agent-01');

    const next = useGameStore.getState();
    const roleOne = next.roles.find((role) => role.id === 'hat-01');
    const roleTwo = next.roles.find((role) => role.id === 'hat-02');

    expect(roleOne?.assignedAgentId).toBeUndefined();
    expect(roleTwo?.assignedAgentId).toBe('agent-01');
  });

  it('preserves worker identity when assigning them to a role', () => {
    const state = useGameStore.getState();
    state.unlockExpandedRoles();
    state.configureRole('hat-02', 'Designer');
    state.assignRole('hat-02', 'agent-03');

    const assignedAgent = useGameStore.getState().agents.find((agent) => agent.id === 'agent-03');

    expect(assignedAgent?.name).toBe('Kestrel Vale');
    expect(assignedAgent?.roleAffinity).toBe('Skeuomorphic interaction and product design');
  });
});

describe('gameStore narrative run shaping', () => {
  it('forces first cycle to fail', () => {
    assignAllVisibleRoles();

    const firstRun = useGameStore.getState().runProduction();

    expect(firstRun).toBeDefined();
    expect(firstRun?.passed).toBe(false);
    expect(firstRun?.pipeline?.order).toEqual([
      'design',
      'implementation',
      'review',
      'deployment'
    ]);
    expect(firstRun?.pipeline?.coveredStageCount).toBe(1);
    expect(firstRun?.events[firstRun.events.length - 1]).toContain('Critical role coverage gap');
    expect(useGameStore.getState().latestArtifacts).toBeUndefined();
  });

  it('forces second cycle to pass after expansion', () => {
    assignAllVisibleRoles();
    useGameStore.getState().runProduction();

    useGameStore.getState().unlockExpandedRoles();
    assignAllVisibleRoles();

    const secondRun = useGameStore.getState().runProduction();

    expect(secondRun).toBeDefined();
    expect(secondRun?.passed).toBe(true);
    expect(secondRun?.pipeline?.coveredStageCount).toBe(4);
    expect(secondRun?.qualityScore).toBeGreaterThanOrEqual(72);
  });

  it('attaches a generated deployment artifact to each run', () => {
    const state = useGameStore.getState();
    state.setStudioName('Coopa LLC');
    assignAllVisibleRoles();
    state.runProduction();
    const firstRun = useGameStore.getState().latestRun;
    const firstCycleArtifacts = firstRun
      ? generateArtifacts({
          result: firstRun,
          brief: TUTORIAL_BRIEF,
          cycle: 1,
          studioName: useGameStore.getState().studioName,
          roles: useGameStore.getState().roles,
          agents: useGameStore.getState().agents
        })
      : undefined;

    expect(['messy', 'failed']).toContain(firstCycleArtifacts?.profileTag);
    expect(firstCycleArtifacts?.ensName).toBe('coopa-llc.daothegame.eth');
    expect(firstCycleArtifacts?.publicUrl).toBeUndefined();
    expect(firstCycleArtifacts?.siteDocument).toContain('Regen Frontier Global Conference');
    expect(firstCycleArtifacts?.siteDocument).not.toContain('Visual identity');
    expect(firstCycleArtifacts?.siteDocument).not.toContain('Launch stability');

    useGameStore.getState().unlockExpandedRoles();
    assignAllVisibleRoles();
    useGameStore.getState().runProduction();
    const secondRun = useGameStore.getState().latestRun;
    const secondCycleArtifacts = secondRun
      ? generateArtifacts({
          result: secondRun,
          brief: TUTORIAL_BRIEF,
          cycle: 2,
          studioName: useGameStore.getState().studioName,
          roles: useGameStore.getState().roles,
          agents: useGameStore.getState().agents
        })
      : undefined;

    expect(['stable', 'flashy', 'premium']).toContain(secondCycleArtifacts?.profileTag);
    expect(secondCycleArtifacts?.publicUrl).toBeUndefined();
    expect(secondCycleArtifacts?.siteDocument).toContain('Featured programming');
  });

  it('allows second cycle to run with configured branches even if later unlocked roles stay unconfigured', () => {
    assignAllVisibleRoles();
    useGameStore.getState().runProduction();

    useGameStore.getState().unlockExpandedRoles();
    configureExpandedCycleTwoRoles();

    const state = useGameStore.getState();
    const activeRoles = getActiveRoles(state.roles, state.unlockedRoleCount);
    const configuredRoles = activeRoles.filter((role) => role.isConfigured);

    expect(estimateRunCost(activeRoles, state.agents)).toBe(estimateRunCost(configuredRoles, state.agents));

    const secondRun = useGameStore.getState().runProduction();

    expect(secondRun).toBeDefined();
    expect(secondRun?.passed).toBe(true);
  });

  it('writes persisted gameplay snapshot to localStorage', () => {
    const state = useGameStore.getState();
    state.setStorySceneIndex(4);
    state.unlockExpandedRoles();

    const raw = localStorage.getItem('dao-the-game:state:v3');
    expect(raw).toBeTruthy();

    const stored = JSON.parse(raw ?? '{}');
    expect(stored.state.storySceneIndex).toBe(4);
    expect(stored.state.unlockedRoleCount).toBe(4);
  });

  it('persists artifact generation recovery so interrupted builds can be retried after refresh', () => {
    const state = useGameStore.getState();

    state.setArtifactGenerationRecovery({
      cycle: 1,
      status: 'pending',
      lastKnownPhase: 'worker',
      lastKnownStageId: 'review',
      lastKnownWorkerName: 'Sable Quill'
    });

    const snapshot = buildGameStateSnapshot(useGameStore.getState());
    const raw = localStorage.getItem('dao-the-game:state:v3');
    const stored = JSON.parse(raw ?? '{}');

    expect(snapshot.artifactGenerationRecovery).toEqual({
      cycle: 1,
      status: 'pending',
      lastKnownPhase: 'worker',
      lastKnownStageId: 'review',
      lastKnownWorkerName: 'Sable Quill'
    });
    expect(stored.state.artifactGenerationRecovery).toEqual(snapshot.artifactGenerationRecovery);
  });

  it('migrates older persisted shapes by clamping and normalizing player-scoped state', async () => {
    const migrate = useGameStore.persist.getOptions().migrate;

    expect(migrate).toBeDefined();

    const migrated = await migrate!(
      {
        storySceneIndex: FINAL_SCENE_INDEX + 10,
        unlockedRoleCount: 0,
        seed: 123,
        treasury: 456,
        studioName: 'Legacy Studio',
        hasSeenIntroDialog: true,
        roles: [
          {
            id: 'hat-01',
            name: 'Legacy Lead',
            assignedAgentId: 'agent-01'
          }
        ],
        agents: useGameStore.getState().agents,
        latestRun: undefined,
        latestArtifacts: undefined,
        runCount: 2,
        assignmentLog: 'bad-shape'
      },
      4
    );
    const migratedState = migrated as ReturnType<typeof useGameStore.getState> & {
      ownerPlayerId: string | null;
    };

    expect(migratedState.ownerPlayerId).toBeNull();
    expect(migratedState.storySceneIndex).toBe(FINAL_SCENE_INDEX);
    expect(migratedState.unlockedRoleCount).toBe(1);
    expect(migratedState.studioName).toBe('Legacy Studio');
    expect(migratedState.hasSeenIntroDialog).toBe(true);
    expect(migratedState.assignmentLog).toEqual([]);
    expect(migratedState.roles[0]?.isConfigured).toBe(true);
    expect(buildGameStateSnapshot(migratedState).storySceneIndex).toBe(FINAL_SCENE_INDEX);
  });

  it('tracks assignment count from active roles', () => {
    assignAllVisibleRoles();

    const state = useGameStore.getState();
    const activeRoles = getActiveRoles(state.roles, state.unlockedRoleCount);

    expect(countAssignedRoles(activeRoles)).toBe(activeRoles.length);
  });
});
