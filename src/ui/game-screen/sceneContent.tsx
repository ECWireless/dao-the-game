import type { ReactNode } from 'react';
import type { Agent, HatRole } from '../../types';
import type { AssignmentLogEntry, ChatLine, RunSummary } from './types';
import { MessagesScene } from './scenes/CommunicationScenes';
import { MailScene } from './scenes/MailScenes';
import { GuildScene, MachineScene } from './scenes/OperationsScenes';
import { WhiteboardScene } from './scenes/WhiteboardScene';
import { HELP_THREAD, INTRO_MESSAGES_THREAD, OFFER_MESSAGES_THREAD, PIVOT_THREAD } from './storyThreads';

type SceneContentArgs = {
  sceneId: string;
  isInteractive: boolean;
  mailOfferReplyLocked: boolean;
  studioName: string;
  activeRoles: HatRole[];
  agents: Agent[];
  assignmentLog: AssignmentLogEntry[];
  assignedActiveRoles: number;
  latestRunSummary?: RunSummary;
  runCount: number;
  runwayAfterRun: number;
  advanceStory: () => void;
  onMailOfferReply: () => void;
  queueCrossAppAdvance: () => void;
  setStudioName: (name: string) => void;
  configureRole: (roleId: string, name: string) => void;
  unlockExpandedRoles: () => void;
  assignRole: (roleId: string, agentId: string) => void;
  runProduction: () => void;
  resetTutorial: () => void;
  setIsMachineLocked: (isLocked: boolean) => void;
};

function getPassiveThread(thread: ChatLine[], draft?: string, isInteractive = true): ChatLine[] {
  if (isInteractive || !draft) {
    return thread;
  }

  return [...thread, { id: `${thread[thread.length - 1]?.id ?? 'draft'}-passive-player`, author: 'player', text: draft }];
}

function renderMessageStep({
  thread,
  draft,
  isInteractive,
  onSend,
  initialThreadDelayMs = 0,
  appendPassiveDraft = true
}: {
  thread: ChatLine[];
  draft?: string;
  isInteractive: boolean;
  onSend?: () => void;
  initialThreadDelayMs?: number;
  appendPassiveDraft?: boolean;
}) {
  const visibleThread = appendPassiveDraft && draft ? getPassiveThread(thread, draft, isInteractive) : thread;
  return <MessagesScene thread={visibleThread} initialThreadDelayMs={initialThreadDelayMs} disableEntryAnimation={!isInteractive} draft={isInteractive ? draft : undefined} sendLabel={isInteractive && draft ? 'Send' : undefined} onSend={isInteractive ? onSend : undefined} />;
}

export function renderSceneContent({
  sceneId,
  isInteractive,
  mailOfferReplyLocked,
  studioName,
  activeRoles,
  agents,
  assignmentLog,
  assignedActiveRoles,
  latestRunSummary,
  runCount,
  runwayAfterRun,
  advanceStory,
  onMailOfferReply,
  queueCrossAppAdvance,
  setStudioName,
  configureRole,
  unlockExpandedRoles,
  assignRole,
  runProduction,
  resetTutorial,
  setIsMachineLocked
}: SceneContentArgs): ReactNode {
  switch (sceneId) {
    case 'messages-warmup':
      return renderMessageStep({ thread: INTRO_MESSAGES_THREAD.slice(0, 1), draft: 'not tonight.', isInteractive, onSend: advanceStory, initialThreadDelayMs: 2000 });
    case 'messages-hold':
      return renderMessageStep({ thread: INTRO_MESSAGES_THREAD.slice(0, 3), draft: 'not in the mood. tomorrow.', isInteractive, onSend: advanceStory });
    case 'messages-notification':
      return renderMessageStep({ thread: INTRO_MESSAGES_THREAD, isInteractive, appendPassiveDraft: false });
    case 'mail-offer':
      return (
        <MailScene
          tone="panic"
          from="Lina, Event Director"
          subject="URGENT: Full rebrand needed in 48 hours"
          body={[
            'Our conference brand is collapsing and our website is unusable.',
            'Budget approved: $15,000 for an immediate redesign and rebuild.',
            'Need strategy, design, QA, and deployment. No delays.'
          ]}
          draft="I think you emailed the wrong person. I have no idea how to build this."
          sendLabel="Send Reply"
          onSend={isInteractive && !mailOfferReplyLocked ? onMailOfferReply : undefined}
          isPrimaryActionDisabled={mailOfferReplyLocked || !isInteractive}
        />
      );
    case 'messages-offer-share':
      return renderMessageStep({ thread: OFFER_MESSAGES_THREAD.slice(0, 1), draft: 'someone just accidentally emailed me offering $15k to redo their site.', isInteractive, onSend: advanceStory });
    case 'messages-offer-doubt':
      return renderMessageStep({ thread: OFFER_MESSAGES_THREAD.slice(0, 2), draft: 'i think they emailed the wrong person.', isInteractive, onSend: advanceStory });
    case 'messages-convince':
      return renderMessageStep({ thread: OFFER_MESSAGES_THREAD.slice(0, 5), draft: 'this feels like a bad idea. fine. i am in.', isInteractive, onSend: advanceStory });
    case 'messages-start-where':
      return renderMessageStep({ thread: OFFER_MESSAGES_THREAD.slice(0, 6), draft: 'i have no idea where to even start.', isInteractive, onSend: advanceStory });
    case 'messages-board-drop':
      return renderMessageStep({ thread: OFFER_MESSAGES_THREAD, isInteractive, appendPassiveDraft: false });
    case 'whiteboard-first':
      return (
        <WhiteboardScene
          roles={activeRoles}
          studioName={studioName}
          isExpanded={false}
          onSetStudioName={isInteractive ? setStudioName : undefined}
          onConfigureRole={isInteractive ? configureRole : undefined}
          onComplete={isInteractive ? queueCrossAppAdvance : undefined}
          isReadOnly={!isInteractive}
        />
      );
    case 'messages-cant-do':
      return renderMessageStep({ thread: HELP_THREAD, draft: 'right. hiring help. try not to vanish.', isInteractive, onSend: queueCrossAppAdvance });
    case 'guild-first': {
      const firstRoleAssigned = Boolean(activeRoles[0]?.assignedAgentId);

      return (
        <GuildScene
          studioName={studioName}
          roles={activeRoles}
          agents={agents}
          assignmentLog={assignmentLog}
          onAssign={isInteractive ? assignRole : undefined}
          guidance="Post your role to RaidGuild. Pick one candidate and bind them to the board."
          onContinue={isInteractive ? queueCrossAppAdvance : undefined}
          continueDisabled={!firstRoleAssigned}
          isReadOnly={!isInteractive}
        />
      );
    }
    case 'machine-first':
      return (
        <MachineScene
          studioName={studioName}
          cycle={1}
          canRun={assignedActiveRoles === activeRoles.length}
          hasRun={runCount >= 1}
          latestRunSummary={runCount >= 1 ? latestRunSummary : undefined}
          onRun={
            isInteractive
              ? async () => {
                  runProduction();
                }
              : undefined
          }
          onContinue={isInteractive ? queueCrossAppAdvance : undefined}
          onLockChange={isInteractive ? setIsMachineLocked : undefined}
          isReadOnly={!isInteractive}
        />
      );
    case 'mail-fail':
      return (
        <MailScene
          tone="fail"
          from="Lina, Event Director"
          subject="Re: URGENT rebrand"
          body={[
            'We reviewed the output. This does not feel production-ready.',
            'Visual quality and QA confidence are below threshold.',
            'Please revise role coverage and resubmit quickly.'
          ]}
          actionLabel={isInteractive ? 'Close Thread' : undefined}
          onAction={isInteractive ? queueCrossAppAdvance : undefined}
        />
      );
    case 'messages-pivot':
      return renderMessageStep({ thread: PIVOT_THREAD, draft: 'patching the tree now. do not become mysteriously correct about me.', isInteractive, onSend: () => {
        unlockExpandedRoles();
        queueCrossAppAdvance();
      } });
    case 'whiteboard-expand':
      return (
        <WhiteboardScene
          roles={activeRoles}
          studioName={studioName}
          isExpanded
          onComplete={isInteractive ? queueCrossAppAdvance : undefined}
          completeLabel={isInteractive ? 'Commit Update' : undefined}
          isReadOnly={!isInteractive}
        />
      );
    case 'guild-second': {
      const allAssigned = assignedActiveRoles === activeRoles.length;

      return (
        <GuildScene
          studioName={studioName}
          roles={activeRoles}
          agents={agents}
          assignmentLog={assignmentLog}
          onAssign={isInteractive ? assignRole : undefined}
          guidance="Hire for every remaining role, then snap assignments into the whiteboard graph."
          onContinue={isInteractive ? queueCrossAppAdvance : undefined}
          continueDisabled={!allAssigned}
          isReadOnly={!isInteractive}
        />
      );
    }
    case 'machine-second':
      return (
        <MachineScene
          studioName={studioName}
          cycle={2}
          canRun={assignedActiveRoles === activeRoles.length && runwayAfterRun >= 0}
          hasRun={runCount >= 2}
          latestRunSummary={runCount >= 2 ? latestRunSummary : undefined}
          onRun={
            isInteractive
              ? async () => {
                  runProduction();
                }
              : undefined
          }
          onContinue={isInteractive ? queueCrossAppAdvance : undefined}
          onLockChange={isInteractive ? setIsMachineLocked : undefined}
          isReadOnly={!isInteractive}
        />
      );
    default:
      return (
        <MailScene
          tone="success"
          from="Lina, Event Director"
          subject="Approved: Relaunch accepted"
          body={[
            'This second submission is exactly what we needed.',
            'The work feels polished, the review pass is strong, and deployment confidence is high.',
            'Congrats. Your team turned panic into a clean relaunch.'
          ]}
          actionLabel={isInteractive ? 'Play Again' : undefined}
          onAction={isInteractive ? resetTutorial : undefined}
        />
      );
  }
}
