import { create } from 'zustand';

export type ViewMode = 'shell' | 'engine';

type ViewModeState = {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
};

export const useViewModeStore = create<ViewModeState>((set) => ({
  viewMode: 'shell',
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleViewMode: () =>
    set((state) => ({
      viewMode: state.viewMode === 'shell' ? 'engine' : 'shell'
    }))
}));
