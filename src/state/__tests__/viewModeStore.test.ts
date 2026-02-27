import { beforeEach, describe, expect, it } from 'vitest';
import { useViewModeStore } from '../viewMode';

beforeEach(() => {
  localStorage.clear();
  useViewModeStore.setState({ viewMode: 'shell' });
});

describe('viewModeStore persistence', () => {
  it('persists mode choice to localStorage', () => {
    useViewModeStore.getState().setViewMode('engine');

    const raw = localStorage.getItem('dao-the-game:view-mode:v1');
    expect(raw).toBeTruthy();

    const stored = JSON.parse(raw ?? '{}');
    expect(stored.state.viewMode).toBe('engine');
  });
});
