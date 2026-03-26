import type { ChatLine } from './types';

export const OFFER_INSTALL_REMINDER = "don't forget to install the game before tomorrow.";
export const PIVOT_CHECKIN = 'how did the deployment go?';

export const INTRO_MESSAGES_THREAD: ChatLine[] = [
  {
    id: 'a',
    author: 'friend',
    text: 'new management sim just dropped. supply chains, bottlenecks, tiny disasters. you in?'
  },
  { id: 'b', author: 'player', text: 'not tonight.' },
  {
    id: 'c',
    author: 'friend',
    text: "you've been in a rut all week. one run, then you can go back to staring at the ceiling."
  },
  { id: 'd', author: 'player', text: 'not in the mood. tomorrow.' },
  { id: 'e', author: 'friend', text: 'fine. i will bother you tomorrow.' }
];

export const OFFER_MESSAGES_THREAD: ChatLine[] = [
  { id: 'f', author: 'friend', text: OFFER_INSTALL_REMINDER },
  {
    id: 'g',
    author: 'player',
    text: 'someone just accidentally emailed me offering $15k to redo their site.'
  },
  { id: 'h', author: 'player', text: 'i think they emailed the wrong person.' },
  {
    id: 'i',
    author: 'friend',
    text: 'fifteen grand is a ridiculous amount of money for your qualifications. no offense.'
  },
  {
    id: 'j',
    author: 'friend',
    text: 'take the job anyway. we can fake the part where you are a real studio.'
  },
  { id: 'k', author: 'player', text: "this feels like a bad idea. fine. i'm in." },
  { id: 'l', author: 'player', text: 'i have no idea where to even start.' },
  {
    id: 'm',
    author: 'friend',
    text: 'i am dropping a planning board onto your phone right now. do not ask how i got root.'
  }
];

export const HELP_THREAD: ChatLine[] = [
  { id: 'help-a', author: 'friend', text: 'are you done whiteboarding?' },
  { id: 'help-b', author: 'player', text: "ya, but i can't code. can you just do this for me?" },
  { id: 'help-c', author: 'friend', text: 'absolutely not. i prefer to remain deniable.' },
  {
    id: 'help-d',
    author: 'friend',
    text: 'i can, however, point you toward the right weirdos. opening a guild channel now.'
  }
];

export const PIVOT_THREAD: ChatLine[] = [
  { id: 'pivot-a', author: 'friend', text: PIVOT_CHECKIN },
  { id: 'pivot-b', author: 'player', text: 'client hated it. tell me you have a fix' },
  {
    id: 'pivot-c',
    author: 'friend',
    text: 'of course. your graph is starving. add Designer and Reviewer.'
  },
  {
    id: 'pivot-d',
    author: 'friend',
    text: 'same factory, better wiring. patch the tree, hire again, rerun.'
  }
];
