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
    title: 'Whiteboard',
    preview: 'A planning board just appeared.',
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
    title: 'Whiteboard',
    preview: 'RaidGuild applicants are waiting on the board.',
    icon: 'whiteboard'
  },
  'machine-first': {
    targetApp: 'machine',
    appName: 'Machine',
    title: 'Machine Companion',
    preview: 'Deployment rig is installed. Switch over.',
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
    title: 'Whiteboard',
    preview: 'The board just made room for more branches.',
    icon: 'whiteboard'
  },
  'guild-second': {
    targetApp: 'guild',
    appName: 'RaidGuild',
    title: 'Quartermaster Nyx',
    preview: 'any other work need filling?',
    icon: 'guild'
  },
  'whiteboard-second-integrate': {
    targetApp: 'whiteboard',
    appName: 'Whiteboard',
    title: 'Whiteboard',
    preview: 'RaidGuild applicants are queued on the board.',
    icon: 'whiteboard'
  },
  'machine-second': {
    targetApp: 'machine',
    appName: 'Machine',
    title: 'Machine Companion',
    preview: 'Updated crew loaded. Switch over.',
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
