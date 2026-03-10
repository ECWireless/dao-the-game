import type { GameStateRequest, GameStateResponse } from '../src/contracts/player';
import { saveGameState, upsertPlayer } from './_lib/db.js';
import { handleRouteError, HttpError, json, options, parseOptionalJsonBody, withCors } from './_lib/http.js';
import { requirePrivyUser } from './_lib/privy.js';

export const runtime = 'nodejs';

export const OPTIONS = options;

export async function POST(request: Request): Promise<Response> {
  try {
    const privyUser = await requirePrivyUser(request);
    const body = await parseOptionalJsonBody<GameStateRequest>(request);

    if (!body?.snapshot || typeof body.snapshot !== 'object' || Array.isArray(body.snapshot)) {
      throw new HttpError(400, 'A valid game state snapshot is required.');
    }

    const player = await upsertPlayer({
      privyUserId: privyUser.id,
      walletAddress: null
    });

    const gameState = await saveGameState({
      playerId: player.id,
      snapshot: body.snapshot
    });

    const response: GameStateResponse = { gameState };
    return withCors(request, json(response));
  } catch (error) {
    return handleRouteError(request, error);
  }
}
