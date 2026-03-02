import type { StoryApp } from '../../levels/story';
import { OFFER_INSTALL_REMINDER } from './storyThreads';

export type CrossAppHandoff = {
  targetApp: StoryApp;
  appName: string;
  title: string;
  preview: string;
  icon: StoryApp;
};

const CROSS_APP_HANDOFFS: Record<string, CrossAppHandoff> = {
  'messages-offer-share': {
    targetApp: 'messages',
    appName: 'Messages',
    title: 'murmur',
    preview: OFFER_INSTALL_REMINDER,
    icon: 'messages'
  },
  'whiteboard-first': {
    targetApp: 'whiteboard',
    appName: 'Whiteboard',
    title: 'Planning Board',
    preview: 'New board installed.',
    icon: 'whiteboard'
  },
  'messages-cant-do': {
    targetApp: 'messages',
    appName: 'Messages',
    title: 'murmur',
    preview: 'are you done whiteboarding?',
    icon: 'messages'
  },
  'guild-first': {
    targetApp: 'guild',
    appName: 'RaidGuild',
    title: '#hiring-board',
    preview: 'You have been invited to the server',
    icon: 'guild'
  },
  'whiteboard-integrate': {
    targetApp: 'whiteboard',
    appName: 'Whiteboard',
    title: 'Planning Board',
    preview: 'Integrate RaidGuild server?',
    icon: 'whiteboard'
  },
  'machine-first': {
    targetApp: 'machine',
    appName: 'Machine',
    title: 'Machine Companion',
    preview: 'Companion installed. Switch to deploy.',
    icon: 'machine'
  },
  'mail-fail': {
    targetApp: 'mail',
    appName: 'Mail',
    title: 'Re: URGENT rebrand',
    preview: 'Lina, Event Director',
    icon: 'mail'
  },
  'messages-pivot': {
    targetApp: 'messages',
    appName: 'Messages',
    title: 'murmur',
    preview: 'saw that. open chat before you spiral.',
    icon: 'messages'
  },
  'whiteboard-expand': {
    targetApp: 'whiteboard',
    appName: 'Whiteboard',
    title: 'Role Graph Updated',
    preview: 'Designer, Reviewer, Deployment are ready to slot in.',
    icon: 'whiteboard'
  },
  'guild-second': {
    targetApp: 'guild',
    appName: 'RaidGuild',
    title: '#hiring-board',
    preview: 'New openings posted. Fill the graph.',
    icon: 'guild'
  },
  'machine-second': {
    targetApp: 'machine',
    appName: 'Machine',
    title: 'Machine Companion',
    preview: 'Expanded rig is ready. Switch to deploy.',
    icon: 'machine'
  },
  'mail-success': {
    targetApp: 'mail',
    appName: 'Mail',
    title: 'Approved: Relaunch accepted',
    preview: 'Lina, Event Director',
    icon: 'mail'
  }
};

export function getCrossAppHandoff(sceneId: string): CrossAppHandoff | undefined {
  return CROSS_APP_HANDOFFS[sceneId];
}
