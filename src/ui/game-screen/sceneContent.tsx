import type { ReactNode } from 'react';
import type { Agent, HatRole } from '../../types';
import type { AssignmentLogEntry, ChatLine, RunSummary } from './types';
import { MailScene, MessagesScene } from './scenes/CommunicationScenes';
import { GuildScene, MachineScene, WhiteboardScene } from './scenes/OperationsScenes';

type SceneContentArgs = {
  sceneId: string;
  activeRoles: HatRole[];
  agents: Agent[];
  assignmentLog: AssignmentLogEntry[];
  assignedActiveRoles: number;
  latestRunSummary?: RunSummary;
  runCount: number;
  runwayAfterRun: number;
  advanceStory: () => void;
  unlockExpandedRoles: () => void;
  assignRole: (roleId: string, agentId: string) => void;
  runProduction: () => void;
  resetTutorial: () => void;
  setIsMachineLocked: (isLocked: boolean) => void;
};

export function renderSceneContent({
  sceneId,
  activeRoles,
  agents,
  assignmentLog,
  assignedActiveRoles,
  latestRunSummary,
  runCount,
  runwayAfterRun,
  advanceStory,
  unlockExpandedRoles,
  assignRole,
  runProduction,
  resetTutorial,
  setIsMachineLocked
}: SceneContentArgs): ReactNode {
  switch (sceneId) {
    case 'messages-warmup': {
      const thread: ChatLine[] = [
        { id: 'a', author: 'friend', text: 'yo accidental operator, you online?' },
        { id: 'b', author: 'player', text: 'barely. why?' },
        { id: 'c', author: 'friend', text: 'keep this thread open. chaos is inbound.' }
      ];

      return <MessagesScene thread={thread} draft="uh okay... waiting for chaos" sendLabel="Send" onSend={advanceStory} />;
    }
    case 'messages-notification': {
      const thread: ChatLine[] = [
        { id: 'd', author: 'system', text: 'Push alert: new email marked URGENT.' },
        { id: 'e', author: 'friend', text: 'that ping is your plot twist. open mail now.' }
      ];

      return (
        <MessagesScene
          thread={thread}
          showNotification
          footerActionLabel="Switch to Mail"
          onFooterAction={advanceStory}
        />
      );
    }
    case 'mail-offer':
      return (
        <MailScene
          tone="panic"
          from="Lina, Event Director"
          subject="URGENT: Full rebrand needed in 48 hours"
          body={[
            'Our conference brand is collapsing and our website is unusable.',
            'Budget approved: 2800 credits for immediate autonomous rebuild.',
            'Need architecture, design, QA, deployment. No delays.'
          ]}
          draft="I think you emailed the wrong person. I have no idea how to build this."
          sendLabel="Send Reply"
          onSend={advanceStory}
        />
      );
    case 'messages-convince': {
      const thread: ChatLine[] = [
        { id: 'f', author: 'player', text: 'they offered 2800 credits. wrong address though.' },
        { id: 'g', author: 'friend', text: 'wrong address? no. destiny typo.' },
        {
          id: 'h',
          author: 'friend',
          text: 'you do not need to build it yourself. you orchestrate. machine does the lifting.'
        }
      ];

      return (
        <MessagesScene
          thread={thread}
          draft="fine. i accept the contract. please don’t let me crash this."
          sendLabel="Send"
          onSend={advanceStory}
        />
      );
    }
    case 'whiteboard-first':
      return (
        <WhiteboardScene
          roles={activeRoles}
          agents={agents}
          isExpanded={false}
          copy="You open a whiteboard app. Gremlin rule: keep it clumsy and fast. One role only for cycle one."
          actionLabel="Ask Guide About Hiring"
          onAction={advanceStory}
        />
      );
    case 'messages-cant-do': {
      const thread: ChatLine[] = [
        { id: 'i', author: 'player', text: 'can you fill this role for me?' },
        { id: 'j', author: 'friend', text: 'heck no. i am advisory chaos only.' },
        {
          id: 'k',
          author: 'friend',
          text: 'dropping you into RaidGuild server. post the role, hire someone, assign them.'
        }
      ];

      return (
        <MessagesScene
          thread={thread}
          draft="copy that. opening guild and posting role now."
          sendLabel="Send"
          onSend={advanceStory}
        />
      );
    }
    case 'guild-first': {
      const firstRoleAssigned = Boolean(activeRoles[0]?.assignedAgentId);

      return (
        <GuildScene
          roles={activeRoles}
          agents={agents}
          assignmentLog={assignmentLog}
          onAssign={assignRole}
          guidance="Post your role to RaidGuild. Pick one candidate and bind them to the board."
          onContinue={advanceStory}
          continueDisabled={!firstRoleAssigned}
        />
      );
    }
    case 'machine-first':
      return (
        <MachineScene
          cycle={1}
          canRun={assignedActiveRoles === activeRoles.length}
          hasRun={runCount >= 1}
          latestRunSummary={runCount >= 1 ? latestRunSummary : undefined}
          onRun={async () => {
            runProduction();
          }}
          onContinue={advanceStory}
          onLockChange={setIsMachineLocked}
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
          actionLabel="Text Your Guide"
          onAction={advanceStory}
        />
      );
    case 'messages-pivot': {
      const thread: ChatLine[] = [
        { id: 'l', author: 'player', text: 'client hated it. i am cooked.' },
        {
          id: 'm',
          author: 'friend',
          text: 'nah. your graph was under-scoped. add Designer + Reviewer + Deployment roles.'
        },
        { id: 'n', author: 'friend', text: 'expand hats tree, hire again, rerun. same machine, better topology.' }
      ];

      return (
        <MessagesScene
          thread={thread}
          draft="patching tree now. let’s run this back."
          sendLabel="Send"
          onSend={() => {
            unlockExpandedRoles();
            advanceStory();
          }}
        />
      );
    }
    case 'whiteboard-expand':
      return (
        <WhiteboardScene
          roles={activeRoles}
          agents={agents}
          isExpanded
          copy="You expand from one role to a full autonomous chain. Authority wiring now spans design, review, and deployment."
          actionLabel="Open RaidGuild Hiring"
          onAction={advanceStory}
        />
      );
    case 'guild-second': {
      const allAssigned = assignedActiveRoles === activeRoles.length;

      return (
        <GuildScene
          roles={activeRoles}
          agents={agents}
          assignmentLog={assignmentLog}
          onAssign={assignRole}
          guidance="Hire for every remaining role, then snap assignments into the whiteboard graph."
          onContinue={advanceStory}
          continueDisabled={!allAssigned}
        />
      );
    }
    case 'machine-second':
      return (
        <MachineScene
          cycle={2}
          canRun={assignedActiveRoles === activeRoles.length && runwayAfterRun >= 0}
          hasRun={runCount >= 2}
          latestRunSummary={runCount >= 2 ? latestRunSummary : undefined}
          onRun={async () => {
            runProduction();
          }}
          onContinue={advanceStory}
          onLockChange={setIsMachineLocked}
        />
      );
    default:
      return (
        <MailScene
          tone="success"
          from="Lina, Event Director"
          subject="Approved: Autonomous relaunch accepted"
          body={[
            'This second submission is exactly what we needed.',
            'Role coverage is clear, quality is strong, and deployment confidence is high.',
            'Congrats. You turned panic into a working machine.'
          ]}
          actionLabel="Play Again"
          onAction={resetTutorial}
        />
      );
  }
}
