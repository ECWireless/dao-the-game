import type { ResetResponse } from '../src/contracts/player';
import { STORY_SCENES } from '../src/levels/story.js';
import { resetPlayerState, upsertPlayer } from './_lib/db.js';
import { handleRouteError, json, options, withCors } from './_lib/http.js';
import { requirePrivyUser } from './_lib/privy.js';

export const runtime = 'nodejs';

const INITIAL_SCENE = STORY_SCENES[0];

export const OPTIONS = options;

export async function POST(request: Request): Promise<Response> {
  try {
    const privyUser = await requirePrivyUser(request);
    const player = await upsertPlayer({
      privyUserId: privyUser.id,
      walletAddress: null
    });

    const progress = await resetPlayerState({
      playerId: player.id,
      initialBeat: INITIAL_SCENE.id,
      initialSceneIndex: 0
    });

    const response: ResetResponse = { progress };
    return withCors(request, json(response));
  } catch (error) {
    return handleRouteError(request, error);
  }
}
