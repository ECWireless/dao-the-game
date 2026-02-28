export type StoryApp = 'messages' | 'mail' | 'whiteboard' | 'guild' | 'machine';

export type StoryScene = {
  id: string;
  app: StoryApp;
  title: string;
  subtitle: string;
};

export const STORY_SCENES: StoryScene[] = [
  {
    id: 'messages-warmup',
    app: 'messages',
    title: 'Messages',
    subtitle: 'Anonymous guide thread'
  },
  {
    id: 'messages-hold',
    app: 'messages',
    title: 'Messages',
    subtitle: 'Hold for a second'
  },
  {
    id: 'messages-notification',
    app: 'messages',
    title: 'Messages',
    subtitle: 'New inbox alert'
  },
  {
    id: 'mail-offer',
    app: 'mail',
    title: 'Mail',
    subtitle: 'Frantic client request'
  },
  {
    id: 'messages-convince',
    app: 'messages',
    title: 'Messages',
    subtitle: 'Gremlin persuasion protocol'
  },
  {
    id: 'whiteboard-first',
    app: 'whiteboard',
    title: 'Whiteboard',
    subtitle: 'Rough role blueprint'
  },
  {
    id: 'messages-cant-do',
    app: 'messages',
    title: 'Messages',
    subtitle: 'Skill gap panic'
  },
  {
    id: 'guild-first',
    app: 'guild',
    title: 'RaidGuild Server',
    subtitle: '#hiring-board'
  },
  {
    id: 'machine-first',
    app: 'machine',
    title: 'Autonomous Machine',
    subtitle: 'Cycle one'
  },
  {
    id: 'mail-fail',
    app: 'mail',
    title: 'Mail',
    subtitle: 'Client response'
  },
  {
    id: 'messages-pivot',
    app: 'messages',
    title: 'Messages',
    subtitle: 'Patch strategy'
  },
  {
    id: 'whiteboard-expand',
    app: 'whiteboard',
    title: 'Whiteboard',
    subtitle: 'Expanded Hats tree'
  },
  {
    id: 'guild-second',
    app: 'guild',
    title: 'RaidGuild Server',
    subtitle: '#hiring-board'
  },
  {
    id: 'machine-second',
    app: 'machine',
    title: 'Autonomous Machine',
    subtitle: 'Cycle two'
  },
  {
    id: 'mail-success',
    app: 'mail',
    title: 'Mail',
    subtitle: 'Approval notice'
  }
] as const;

export const STORY_SCENE_COUNT = STORY_SCENES.length;
export const FINAL_SCENE_INDEX = STORY_SCENES.length - 1;

export function getScene(index: number): StoryScene {
  const bounded = Math.max(0, Math.min(index, FINAL_SCENE_INDEX));
  return STORY_SCENES[bounded] ?? STORY_SCENES[0];
}
