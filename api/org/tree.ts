import type { OrgTreeUpsertRequest, OrgTreeUpsertResponse } from '../../src/contracts/org';
import { upsertOrgTree, upsertPlayer } from '../_lib/db.js';
import { handleRouteError, HttpError, json, options, parseOptionalJsonBody, withCors } from '../_lib/http.js';
import { requirePrivyUser } from '../_lib/privy.js';

export const runtime = 'nodejs';

export const OPTIONS = options;

export async function POST(request: Request): Promise<Response> {
  try {
    const privyUser = await requirePrivyUser(request);
    const body = await parseOptionalJsonBody<OrgTreeUpsertRequest>(request);

    if (
      typeof body?.chainId !== 'number' ||
      typeof body?.topHatId !== 'string' ||
      !body.topHatId.trim() ||
      typeof body?.wearerAddress !== 'string' ||
      !body.wearerAddress.trim() ||
      typeof body?.eligibilityAddress !== 'string' ||
      !body.eligibilityAddress.trim() ||
      typeof body?.toggleAddress !== 'string' ||
      !body.toggleAddress.trim() ||
      typeof body?.txHash !== 'string' ||
      !body.txHash.trim()
    ) {
      throw new HttpError(400, 'A valid org tree payload is required.');
    }

    const player = await upsertPlayer({
      privyUserId: privyUser.id,
      walletAddress: null
    });

    const orgTree = await upsertOrgTree({
      playerId: player.id,
      chainId: body.chainId,
      topHatId: body.topHatId.trim(),
      studioName:
        typeof body.studioName === 'string' && body.studioName.trim()
          ? body.studioName.trim()
          : null,
      wearerAddress: body.wearerAddress.trim(),
      eligibilityAddress: body.eligibilityAddress.trim(),
      toggleAddress: body.toggleAddress.trim(),
      txHash: body.txHash.trim()
    });

    const response: OrgTreeUpsertResponse = { orgTree };
    return withCors(request, json(response));
  } catch (error) {
    return handleRouteError(request, error);
  }
}
