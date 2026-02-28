export type ChatAuthor = 'friend' | 'player' | 'system' | 'client';
export type AppSwitchPhase = 'idle' | 'out' | 'in';

export type ChatLine = {
  id: string;
  author: ChatAuthor;
  text: string;
};

export type RunSummary = {
  passed: boolean;
  qualityScore: number;
  cost: number;
  events: string[];
};

export type AssignmentLogEntry = {
  id: string;
  message: string;
};
