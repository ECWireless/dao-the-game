import type { StoryApp } from '../../levels/story';

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
    preview: 'last chance. you playing anything tonight or not?',
    icon: 'messages'
  },
  'whiteboard-first': {
    targetApp: 'whiteboard',
    appName: 'Whiteboard',
    title: 'Planning Board',
    preview: 'New board installed. Map this gig before you panic.',
    icon: 'whiteboard'
  },
  'messages-cant-do': {
    targetApp: 'messages',
    appName: 'Messages',
    title: 'murmur',
    preview: 'good. now ask me how to staff this thing.',
    icon: 'messages'
  },
  'guild-first': {
    targetApp: 'guild',
    appName: 'RaidGuild',
    title: '#hiring-board',
    preview: 'Server invite ready. Post the role.',
    icon: 'guild'
  },
  'machine-first': {
    targetApp: 'machine',
    appName: 'Machine',
    title: 'Cycle One Ready',
    preview: 'Your first run is primed. Review and launch.',
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
    title: 'Cycle Two Ready',
    preview: 'Expanded run is primed. Launch when ready.',
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
