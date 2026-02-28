import { STORY_SCENES, type StoryApp } from '../../levels/story';

export const RUN_PHASES = ['Designing', 'Building', 'Reviewing', 'Deploying', 'Client Reviewing'];
export const APP_ORDER: StoryApp[] = ['messages', 'mail', 'whiteboard', 'guild', 'machine'];

export const APP_META: Record<StoryApp, { label: string }> = {
  messages: { label: 'Messages' },
  mail: { label: 'Mail' },
  whiteboard: { label: 'Whiteboard' },
  guild: { label: 'RaidGuild' },
  machine: { label: 'Machine' }
};

export const APP_INTRO_SCENE_INDEX: Record<StoryApp, number> = APP_ORDER.reduce(
  (accumulator, app) => {
    accumulator[app] = STORY_SCENES.findIndex((scene) => scene.app === app);
    return accumulator;
  },
  {} as Record<StoryApp, number>
);
