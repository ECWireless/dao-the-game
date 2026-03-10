import type { ProgressRequest, ProgressResponse } from '../src/contracts/player';
import { getSceneIndex } from '../src/levels/story.js';
import { recordProgress, upsertPlayer } from './_lib/db.js';
import { handleRouteError, HttpError, json, options, parseOptionalJsonBody, withCors } from './_lib/http.js';
import { requirePrivyUser } from './_lib/privy.js';

export const runtime = 'nodejs';

export const OPTIONS = options;

export async function POST(request: Request): Promise<Response> {
  try {
    const privyUser = await requirePrivyUser(request);
    const body = await parseOptionalJsonBody<ProgressRequest>(request);

    if (typeof body?.beat !== 'string' || !body.beat.trim()) {
      throw new HttpError(400, 'A valid beat is required.');
    }

    const beat = body.beat.trim();
    const sceneIndex = getSceneIndex(beat);

    if (sceneIndex < 0) {
      throw new HttpError(400, `Unknown beat: ${beat}`);
    }

    const player = await upsertPlayer({
      privyUserId: privyUser.id,
      walletAddress: null
    });

    const progress = await recordProgress({
      playerId: player.id,
      beat,
      sceneIndex
    });

    const response: ProgressResponse = { progress };
    return withCors(request, json(response));
  } catch (error) {
    return handleRouteError(request, error);
  }
}
