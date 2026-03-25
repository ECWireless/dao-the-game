import type { ArtifactBundle, PipelineStageId, RunArtifactsInput } from '../types';

export type ArtifactDeployRequest = {
  artifact: ArtifactBundle;
  generationInput?: RunArtifactsInput;
};

export type ArtifactDeployResponse = {
  artifact: ArtifactBundle;
};

export type ArtifactDeployEvent =
  | {
      type: 'generation-start';
      cycle?: 1 | 2;
      mode: 'workers' | 'deterministic';
      model?: string | null;
    }
  | {
      type: 'worker-start';
      stageId: PipelineStageId;
      workerName: string;
      workerSpecialty: string;
      note: string;
    }
  | {
      type: 'worker-output';
      stageId: PipelineStageId;
      workerName: string;
      workerSpecialty: string;
      output: Record<string, unknown> | null;
      rawOutputText?: string | null;
      usedFallback: boolean;
      error?: string;
    }
  | {
      type: 'artifact-generated';
      artifact: ArtifactBundle;
      usedFallback: boolean;
    }
  | {
      type: 'publishing-start';
      destination: 'pinata';
    }
  | {
      type: 'artifact-deployed';
      artifact: ArtifactBundle;
    }
  | {
      type: 'error';
      error: string;
    };
