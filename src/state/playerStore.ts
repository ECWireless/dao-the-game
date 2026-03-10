import { create } from 'zustand';
import type { PlayerRecord } from '../contracts/player';

type PlayerStore = {
  player: PlayerRecord | null;
  setPlayer: (player: PlayerRecord) => void;
  clearPlayer: () => void;
};

export const usePlayerStore = create<PlayerStore>((set) => ({
  player: null,
  setPlayer: (player) => set({ player }),
  clearPlayer: () => set({ player: null })
}));
