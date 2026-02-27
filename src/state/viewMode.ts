import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ViewMode = 'shell' | 'engine';
const VIEW_MODE_STORAGE_KEY = 'dao-the-game:view-mode:v1';

type ViewModeState = {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
};

export const useViewModeStore = create<ViewModeState>()(
  persist(
    (set) => ({
      viewMode: 'shell',
      setViewMode: (mode) => set({ viewMode: mode }),
      toggleViewMode: () =>
        set((state) => ({
          viewMode: state.viewMode === 'shell' ? 'engine' : 'shell'
        }))
    }),
    {
      name: VIEW_MODE_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        viewMode: state.viewMode
      })
    }
  )
);
