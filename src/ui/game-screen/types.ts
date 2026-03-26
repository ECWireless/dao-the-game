import type { PipelineStageId } from '../../types';

export type ChatAuthor = 'friend' | 'player' | 'system' | 'client';
export type AppSwitchPhase = 'idle' | 'out' | 'in';

export type ArtifactGenerationProgress =
  | {
      phase: 'starting';
      note: string;
    }
  | {
      phase: 'worker';
      stageId: PipelineStageId;
      workerName: string;
      workerSpecialty: string;
      note: string;
    }
  | {
      phase: 'publishing';
      note: string;
    };

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
