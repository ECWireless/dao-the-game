import type { ResetResponse } from '../src/contracts/player';
import { STORY_SCENES } from '../src/levels/story';
import { resetPlayerState, upsertPlayer } from './_lib/db';
import { handleRouteError, json, options, withCors } from './_lib/http';
import { requirePrivyUser } from './_lib/privy';

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
