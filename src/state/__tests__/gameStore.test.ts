import { beforeEach, describe, expect, it } from 'vitest';
import {
  countAssignedRoles,
  estimateRunCost,
  estimateRunwayAfterRun,
  getActiveRoles,
  useGameStore
} from '../gameStore';

beforeEach(() => {
  localStorage.clear();
  useGameStore.getState().resetTutorial();
});

function assignAllVisibleRoles() {
  const state = useGameStore.getState();
  const activeRoles = getActiveRoles(state.roles, state.unlockedRoleCount);

  activeRoles.forEach((role, index) => {
    state.assignRole(role.id, `agent-${String(index + 1).padStart(2, '0')}`);
  });
}

describe('gameStore role visibility', () => {
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
});

describe('gameStore narrative run shaping', () => {
  it('forces first cycle to fail', () => {
    assignAllVisibleRoles();

    const firstRun = useGameStore.getState().runProduction();

    expect(firstRun).toBeDefined();
    expect(firstRun?.passed).toBe(false);
    expect(firstRun?.events[firstRun.events.length - 1]).toContain('client rejection');
  });

  it('forces second cycle to pass after expansion', () => {
    assignAllVisibleRoles();
    useGameStore.getState().runProduction();

    useGameStore.getState().unlockExpandedRoles();
    assignAllVisibleRoles();

    const secondRun = useGameStore.getState().runProduction();

    expect(secondRun).toBeDefined();
    expect(secondRun?.passed).toBe(true);
    expect(secondRun?.qualityScore).toBeGreaterThanOrEqual(72);
  });

  it('writes persisted gameplay snapshot to localStorage', () => {
    const state = useGameStore.getState();
    state.setStorySceneIndex(4);
    state.unlockExpandedRoles();

    const raw = localStorage.getItem('dao-the-game:state:v2');
    expect(raw).toBeTruthy();

    const stored = JSON.parse(raw ?? '{}');
    expect(stored.state.storySceneIndex).toBe(4);
    expect(stored.state.unlockedRoleCount).toBe(4);
  });

  it('tracks assignment count from active roles', () => {
    assignAllVisibleRoles();

    const state = useGameStore.getState();
    const activeRoles = getActiveRoles(state.roles, state.unlockedRoleCount);

    expect(countAssignedRoles(activeRoles)).toBe(activeRoles.length);
  });
});
