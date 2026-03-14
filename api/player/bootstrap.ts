import type {
  PlayerBootstrapRequest,
  PlayerBootstrapResponse
} from '../../src/contracts/player';
import { getGameState, getOrgRoleHats, getOrgTree, getProgressSummary, upsertPlayer } from '../_lib/db.js';
import { handleRouteError, json, options, parseOptionalJsonBody, withCors } from '../_lib/http.js';
import { requirePrivyUser } from '../_lib/privy.js';

export const runtime = 'nodejs';

export const OPTIONS = options;

export async function POST(request: Request): Promise<Response> {
  try {
    const privyUser = await requirePrivyUser(request);
    const body = await parseOptionalJsonBody<PlayerBootstrapRequest>(request);
    const walletAddress =
      typeof body?.walletAddress === 'string' && body.walletAddress.trim()
        ? body.walletAddress.trim()
        : null;

    const player = await upsertPlayer({
      privyUserId: privyUser.id,
      walletAddress
    });

    const [progress, gameState, orgTree, orgRoleHats] = await Promise.all([
      getProgressSummary(player.id),
      getGameState(player.id),
      getOrgTree(player.id),
      getOrgRoleHats(player.id)
    ]);

    const response: PlayerBootstrapResponse = {
      player,
      progress,
      gameState,
      orgTree,
      orgRoleHats
    };

    return withCors(request, json(response));
  } catch (error) {
    return handleRouteError(request, error);
  }
}
