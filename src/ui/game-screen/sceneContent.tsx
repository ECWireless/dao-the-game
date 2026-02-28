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
        {
          id: 'a',
          author: 'friend',
          text: 'new co-op crawler just dropped. weird relics, procedural bosses. you in?'
        }
      ];

      return (
        <MessagesScene
          thread={thread}
          initialThreadDelayMs={2000}
          draft="not tonight."
          sendLabel="Send"
          onSend={advanceStory}
        />
      );
    }
    case 'messages-hold': {
      const thread: ChatLine[] = [
        {
          id: 'a',
          author: 'friend',
          text: 'new co-op crawler just dropped. weird relics, procedural bosses. you in?'
        },
        {
          id: 'b',
          author: 'player',
          text: 'not tonight.'
        },
        {
          id: 'c',
          author: 'friend',
          text: 'you have been in a rut all week. one run, then you can go back to staring at the ceiling.'
        }
      ];

      return (
        <MessagesScene
          thread={thread}
          draft="not in the mood. tomorrow."
          sendLabel="Send"
          onSend={advanceStory}
        />
      );
    }
    case 'messages-notification': {
      const thread: ChatLine[] = [
        {
          id: 'a',
          author: 'friend',
          text: 'new co-op crawler just dropped. weird relics, procedural bosses. you in?'
        },
        {
          id: 'b',
          author: 'player',
          text: 'not tonight.'
        },
        {
          id: 'c',
          author: 'friend',
          text: 'you have been in a rut all week. one run, then you can go back to staring at the ceiling.'
        },
        {
          id: 'd',
          author: 'player',
          text: 'not in the mood. tomorrow.'
        },
        {
          id: 'e',
          author: 'friend',
          text: 'fine. i will bother you tomorrow.'
        }
      ];

      return <MessagesScene thread={thread} />;
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
        { id: 'f', author: 'player', text: 'they offered 2800 credits. this was definitely sent to the wrong person.' },
        { id: 'g', author: 'friend', text: 'competent people are mostly a payroll rumor.' },
        {
          id: 'h',
          author: 'friend',
          text: 'you do not build it. you arrange the right parts and let the machine take the blame.'
        }
      ];

      return (
        <MessagesScene
          thread={thread}
          draft="this feels like a bad idea. fine. i am in."
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
        { id: 'i', author: 'player', text: 'can you just do this for me?' },
        { id: 'j', author: 'friend', text: 'absolutely not. i prefer to remain deniable.' },
        {
          id: 'k',
          author: 'friend',
          text: 'i can, however, point you toward the right weirdos. opening a guild channel now.'
        }
      ];

      return (
        <MessagesScene
          thread={thread}
          draft="right. hiring help. try not to vanish."
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
        { id: 'l', author: 'player', text: 'client hated it. tell me you have a fix.' },
        {
          id: 'm',
          author: 'friend',
          text: 'of course. your graph is starving. add Designer, Reviewer, and Deployment.'
        },
        { id: 'n', author: 'friend', text: 'same machine, better wiring. patch the tree, hire again, rerun.' }
      ];

      return (
        <MessagesScene
          thread={thread}
          draft="patching the tree now. do not become mysteriously correct about me."
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
