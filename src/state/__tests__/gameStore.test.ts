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

function configureExpandedCycleTwoRoles() {
  const state = useGameStore.getState();
  state.configureRole('hat-01', 'Web Developer');
  state.configureRole('hat-02', 'Designer');
  state.configureRole('hat-03', 'QA Reviewer');
  state.assignRole('hat-02', 'agent-02');
  state.assignRole('hat-03', 'agent-03');
}

describe('gameStore role visibility', () => {
  it('tracks intro dialog dismissal and restores it on reset', () => {
    const state = useGameStore.getState();

    expect(state.hasSeenIntroDialog).toBe(false);

    state.dismissIntroDialog();
    expect(useGameStore.getState().hasSeenIntroDialog).toBe(true);

    useGameStore.getState().resetTutorial();
    expect(useGameStore.getState().hasSeenIntroDialog).toBe(false);
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

  it('updates assigned agent affinity to match the role they fill', () => {
    const state = useGameStore.getState();
    state.unlockExpandedRoles();
    state.configureRole('hat-02', 'Designer');
    state.assignRole('hat-02', 'agent-02');

    const assignedAgent = useGameStore.getState().agents.find((agent) => agent.id === 'agent-02');

    expect(assignedAgent?.roleAffinity).toBe('Product Designer');
  });
});

describe('gameStore narrative run shaping', () => {
  it('forces first cycle to fail', () => {
    assignAllVisibleRoles();

    const firstRun = useGameStore.getState().runProduction();
    const firstArtifacts = useGameStore.getState().latestArtifacts;

    expect(firstRun).toBeDefined();
    expect(firstRun?.passed).toBe(false);
    expect(firstRun?.events[firstRun.events.length - 1]).toContain('Critical role coverage gap');
    expect(firstArtifacts?.notes.join(' ')).not.toContain('Client');
    expect(firstArtifacts?.notes.join(' ')).not.toContain('rejection');
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

  it('attaches the prebuilt deployment preview to generated artifacts', () => {
    useGameStore.getState().setStudioName('Coopa LLC');
    assignAllVisibleRoles();
    useGameStore.getState().runProduction();

    const firstCycleArtifacts = useGameStore.getState().latestArtifacts;

    expect(firstCycleArtifacts?.previewUrl).toBe('/deployments/cycle-one/index.html');
    expect(firstCycleArtifacts?.publicUrl).toBe('https://cycle1.coopa-llc.daothegame.com');

    useGameStore.getState().unlockExpandedRoles();
    assignAllVisibleRoles();
    useGameStore.getState().runProduction();

    const secondCycleArtifacts = useGameStore.getState().latestArtifacts;

    expect(secondCycleArtifacts?.previewUrl).toBe('/deployments/cycle-two/index.html');
    expect(secondCycleArtifacts?.publicUrl).toBe('https://cycle2.coopa-llc.daothegame.com');
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
