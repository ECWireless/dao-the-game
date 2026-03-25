import type { ReactNode } from 'react';
import type { ArtifactGenerationRecovery } from '../../contracts/gameState';
import type { OrgTreeRecord } from '../../contracts/org';
import { TUTORIAL_BRIEF } from '../../levels/tutorial';
import type { Agent, ArtifactBundle, ClientReview, HatRole, RunResult } from '../../types';
import type { ArtifactGenerationProgress, AssignmentLogEntry, ChatLine } from './types';
import { MessagesScene } from './scenes/CommunicationScenes';
import { MailScene } from './scenes/MailScenes';
import { GuildScene } from './scenes/GuildScene';
import { FactoryScene } from './scenes/FactoryScene';
import { WhiteboardScene } from './scenes/WhiteboardScene';
import {
  HELP_THREAD,
  INTRO_MESSAGES_THREAD,
  OFFER_MESSAGES_THREAD,
  PIVOT_THREAD
} from './storyThreads';

type SceneContentArgs = {
  sceneId: string;
  isInteractive: boolean;
  studioName: string;
  orgTree: OrgTreeRecord | null;
  activeRoles: HatRole[];
  agents: Agent[];
  assignmentLog: AssignmentLogEntry[];
  assignedActiveRoles: number;
  latestRun?: RunResult;
  latestArtifacts?: ArtifactBundle;
  runHistory?: Partial<Record<1 | 2, RunResult>>;
  clientReviews: Partial<Record<1 | 2, ClientReview>>;
  runCount: number;
  runwayAfterRun: number;
  artifactGenerationProgress?: ArtifactGenerationProgress | null;
  artifactGenerationError?: string | null;
  artifactGenerationRecovery?: ArtifactGenerationRecovery | null;
  retryArtifactGeneration?: () => Promise<void> | void;
  isRetryingArtifactGeneration?: boolean;
  advanceStory: () => void;
  queueCrossAppAdvance: () => void;
  setStudioName: (name: string) => Promise<void> | void;
  configureRole: (roleId: string, name: string) => Promise<void> | void;
  unlockExpandedRoles: () => void;
  assignRole: (roleId: string, agentId: string) => void;
  runProduction: () => Promise<void> | void;
  submitClientReview: (cycle: 1 | 2) => void;
  resetDemo: () => Promise<void> | void;
  setIsFactoryLocked: (isLocked: boolean) => void;
};

function getPassiveThread(thread: ChatLine[], draft?: string, isInteractive = true): ChatLine[] {
  if (isInteractive || !draft) {
    return thread;
  }

  return [
    ...thread,
    {
      id: `${thread[thread.length - 1]?.id ?? 'draft'}-passive-player`,
      author: 'player',
      text: draft
    }
  ];
}

function renderMessageStep({
  thread,
  draft,
  isInteractive,
  onSend,
  initialThreadDelayMs = 0,
  lineDelayOffsets,
  appendPassiveDraft = true
}: {
  thread: ChatLine[];
  draft?: string;
  isInteractive: boolean;
  onSend?: () => void;
  initialThreadDelayMs?: number;
  lineDelayOffsets?: Record<string, number>;
  appendPassiveDraft?: boolean;
}) {
  const visibleThread =
    appendPassiveDraft && draft ? getPassiveThread(thread, draft, isInteractive) : thread;
  return (
    <MessagesScene
      thread={visibleThread}
      initialThreadDelayMs={initialThreadDelayMs}
      lineDelayOffsets={lineDelayOffsets}
      disableEntryAnimation={!isInteractive}
      draft={isInteractive ? draft : undefined}
      sendLabel={isInteractive && draft ? 'Send' : undefined}
      onSend={isInteractive ? onSend : undefined}
    />
  );
}

export function renderSceneContent({
  sceneId,
  isInteractive,
  studioName,
  orgTree,
  activeRoles,
  agents,
  assignmentLog,
  assignedActiveRoles,
  latestRun,
  latestArtifacts,
  runHistory,
  clientReviews,
  runCount,
  runwayAfterRun,
  artifactGenerationProgress,
  artifactGenerationError,
  artifactGenerationRecovery,
  retryArtifactGeneration,
  isRetryingArtifactGeneration = false,
  advanceStory,
  queueCrossAppAdvance,
  setStudioName,
  configureRole,
  unlockExpandedRoles,
  assignRole,
  runProduction,
  submitClientReview,
  resetDemo,
  setIsFactoryLocked
}: SceneContentArgs): ReactNode {
  const configuredExpandedRoles = activeRoles.filter((role) => role.isConfigured);
  const secondCycleHiringRoles = configuredExpandedRoles.filter(
    (role) => role.id !== activeRoles[0]?.id
  );
  const assignedConfiguredRoles = configuredExpandedRoles.filter((role) =>
    Boolean(role.assignedAgentId)
  ).length;

  switch (sceneId) {
    case 'messages-warmup':
      return renderMessageStep({
        thread: INTRO_MESSAGES_THREAD.slice(0, 1),
        draft: 'not tonight.',
        isInteractive,
        onSend: advanceStory,
        initialThreadDelayMs: 2000
      });
    case 'messages-hold':
      return renderMessageStep({
        thread: INTRO_MESSAGES_THREAD.slice(0, 3),
        draft: 'not in the mood. tomorrow.',
        isInteractive,
        onSend: advanceStory
      });
    case 'messages-notification':
      return renderMessageStep({
        thread: INTRO_MESSAGES_THREAD,
        isInteractive,
        appendPassiveDraft: false
      });
    case 'mail-offer':
      return (
        <MailScene
          tone="panic"
          from="Lina, Event Director"
          subject="URGENT: Full rebrand needed in 48 hours"
          body={[
            'Our conference brand is collapsing and our website is unusable.',
            'Your studio came highly recommended by people I trust, so I am hoping you can rescue this.',
            'Budget approved: $15,000 for an immediate redesign and rebuild. We need this live in 48 hours.'
          ]}
        />
      );
    case 'messages-offer-share':
      return renderMessageStep({
        thread: OFFER_MESSAGES_THREAD.slice(0, 1),
        draft: 'someone just accidentally emailed me offering $15k to redo their site.',
        isInteractive,
        onSend: advanceStory
      });
    case 'messages-offer-doubt':
      return renderMessageStep({
        thread: OFFER_MESSAGES_THREAD.slice(0, 2),
        draft: 'i think they emailed the wrong person.',
        isInteractive,
        onSend: advanceStory
      });
    case 'messages-convince':
      return renderMessageStep({
        thread: OFFER_MESSAGES_THREAD.slice(0, 5),
        draft: "this feels like a bad idea. fine. i'm in.",
        isInteractive,
        onSend: advanceStory,
        lineDelayOffsets: { j: 1400 }
      });
    case 'messages-start-where':
      return renderMessageStep({
        thread: OFFER_MESSAGES_THREAD.slice(0, 6),
        draft: 'i have no idea where to even start.',
        isInteractive,
        onSend: advanceStory
      });
    case 'messages-board-drop':
      return renderMessageStep({
        thread: OFFER_MESSAGES_THREAD,
        isInteractive,
        appendPassiveDraft: false
      });
    case 'whiteboard-first':
      return (
        <WhiteboardScene
          roles={activeRoles}
          agents={agents}
          studioName={studioName}
          orgTree={orgTree}
          isExpanded={false}
          onSetStudioName={isInteractive ? setStudioName : undefined}
          onConfigureRole={isInteractive ? configureRole : undefined}
          onComplete={isInteractive ? queueCrossAppAdvance : undefined}
          isReadOnly={!isInteractive}
        />
      );
    case 'messages-cant-do':
      return renderMessageStep({
        thread: HELP_THREAD.slice(0, 1),
        draft: "ya, but i can't code. can you just do this for me?",
        isInteractive,
        onSend: advanceStory
      });
    case 'messages-guild-open':
      return renderMessageStep({
        thread: HELP_THREAD,
        isInteractive,
        appendPassiveDraft: false,
        lineDelayOffsets: { 'help-d': 1400 }
      });
    case 'guild-first': {
      return (
        <GuildScene
          studioName={studioName}
          roles={activeRoles}
          agents={agents}
          assignmentLog={assignmentLog}
          onAssign={isInteractive ? assignRole : undefined}
          onContinue={isInteractive ? queueCrossAppAdvance : undefined}
          isReadOnly={!isInteractive}
        />
      );
    }
    case 'whiteboard-integrate': {
      return (
        <WhiteboardScene
          roles={activeRoles}
          agents={agents}
          studioName={studioName}
          orgTree={orgTree}
          isExpanded={false}
          onAssignCandidateToRole={isInteractive ? assignRole : undefined}
          onComplete={isInteractive ? queueCrossAppAdvance : undefined}
          isReadOnly={!isInteractive}
        />
      );
    }
    case 'factory-first':
      return (
        <FactoryScene
          studioName={studioName}
          brief={TUTORIAL_BRIEF}
          cycle={1}
          roles={activeRoles}
          agents={agents}
          canRun={assignedActiveRoles === activeRoles.length}
          hasRun={runCount >= 1}
          latestRun={runCount >= 1 ? latestRun : undefined}
          latestArtifacts={runCount >= 1 ? latestArtifacts : undefined}
          previousRun={undefined}
          artifactGenerationProgress={artifactGenerationProgress}
          artifactGenerationError={runCount >= 1 ? artifactGenerationError : undefined}
          artifactGenerationRecovery={runCount >= 1 ? artifactGenerationRecovery : undefined}
          onRetryArtifactGeneration={isInteractive ? retryArtifactGeneration : undefined}
          isRetryingArtifactGeneration={isRetryingArtifactGeneration}
          onRun={isInteractive ? runProduction : undefined}
          onContinue={isInteractive ? () => submitClientReview(1) : undefined}
          onLockChange={isInteractive ? setIsFactoryLocked : undefined}
          isReadOnly={!isInteractive}
        />
      );
    case 'mail-fail':
      return (
        <MailScene
          tone={clientReviews[1]?.tone ?? 'fail'}
          from={clientReviews[1]?.sender ?? 'Lina, Event Director'}
          subject={clientReviews[1]?.subject ?? 'Re: URGENT rebrand'}
          body={
            clientReviews[1]?.body ?? [
              'I just opened this and my stomach dropped.',
              'I cannot put this in front of attendees like this, and we are running out of time.',
              'Please clean this up fast and send me something stronger before I completely lose my mind.'
            ]
          }
        />
      );
    case 'messages-pivot':
      return renderMessageStep({
        thread: PIVOT_THREAD.slice(0, 1),
        draft: 'client hated it. tell me you have a fix',
        isInteractive,
        onSend: () => {
          unlockExpandedRoles();
          advanceStory();
        }
      });
    case 'messages-pivot-fix':
      return renderMessageStep({
        thread: PIVOT_THREAD,
        isInteractive,
        appendPassiveDraft: false,
        lineDelayOffsets: { 'pivot-d': 1500 }
      });
    case 'whiteboard-expand':
      return (
        <WhiteboardScene
          roles={activeRoles}
          agents={agents}
          studioName={studioName}
          orgTree={orgTree}
          isExpanded
          onConfigureRole={isInteractive ? configureRole : undefined}
          onComplete={isInteractive ? queueCrossAppAdvance : undefined}
          autoAdvanceOnReady={isInteractive}
          isReadOnly={!isInteractive}
        />
      );
    case 'guild-second': {
      return (
        <GuildScene
          studioName={studioName}
          roles={secondCycleHiringRoles}
          agents={agents}
          assignmentLog={assignmentLog}
          onAssign={isInteractive ? assignRole : undefined}
          onContinue={isInteractive ? queueCrossAppAdvance : undefined}
          isReadOnly={!isInteractive}
        />
      );
    }
    case 'whiteboard-second-integrate':
      return (
        <WhiteboardScene
          roles={configuredExpandedRoles}
          agents={agents}
          studioName={studioName}
          orgTree={orgTree}
          isExpanded
          onAssignCandidateToRole={isInteractive ? assignRole : undefined}
          onComplete={isInteractive ? queueCrossAppAdvance : undefined}
          isReadOnly={!isInteractive}
        />
      );
    case 'factory-second':
      return (
        <FactoryScene
          studioName={studioName}
          brief={TUTORIAL_BRIEF}
          cycle={2}
          roles={configuredExpandedRoles}
          agents={agents}
          canRun={assignedConfiguredRoles === configuredExpandedRoles.length && runwayAfterRun >= 0}
          hasRun={runCount >= 2}
          latestRun={runCount >= 2 ? latestRun : undefined}
          latestArtifacts={runCount >= 2 ? latestArtifacts : undefined}
          previousRun={runHistory?.[1]}
          artifactGenerationProgress={artifactGenerationProgress}
          artifactGenerationError={runCount >= 2 ? artifactGenerationError : undefined}
          artifactGenerationRecovery={runCount >= 2 ? artifactGenerationRecovery : undefined}
          onRetryArtifactGeneration={isInteractive ? retryArtifactGeneration : undefined}
          isRetryingArtifactGeneration={isRetryingArtifactGeneration}
          onRun={isInteractive ? runProduction : undefined}
          onContinue={isInteractive ? () => submitClientReview(2) : undefined}
          onLockChange={isInteractive ? setIsFactoryLocked : undefined}
          isReadOnly={!isInteractive}
        />
      );
    case 'mail-success':
      return (
        <MailScene
          tone={clientReviews[2]?.tone ?? 'success'}
          from={clientReviews[2]?.sender ?? 'Lina, Event Director'}
          subject={clientReviews[2]?.subject ?? 'Approved: Relaunch accepted'}
          body={
            clientReviews[2]?.body ?? [
              `This is exactly what we needed, ${studioName || 'team'}.`,
              'I can finally breathe again. The site looks polished, the experience feels intentional, and I am comfortable putting this in front of attendees.',
              'Thank you for pulling this off under pressure. I am wiring the $15,000 over ASAP.'
            ]
          }
          actionLabel={isInteractive ? 'Play Again' : undefined}
          onAction={isInteractive ? () => void resetDemo() : undefined}
        />
      );
    default:
      return (
        <MailScene
          tone="success"
          from="Lina, Event Director"
          subject="Approved: Relaunch accepted"
          body={[
            `This is exactly what we needed, ${studioName || 'team'}.`,
            'I can finally breathe again. The site looks polished, the experience feels intentional, and I am comfortable putting this in front of attendees.',
            'Thank you for pulling this off under pressure. I am wiring the $15,000 over ASAP.'
          ]}
          actionLabel={isInteractive ? 'Play Again' : undefined}
          onAction={isInteractive ? () => void resetDemo() : undefined}
        />
      );
  }
}
