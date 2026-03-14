import type { OrgRoleHatUpsertRequest, OrgRoleHatUpsertResponse } from '../../src/contracts/org';
import { upsertOrgRoleHat, upsertPlayer } from '../_lib/db.js';
import { handleRouteError, HttpError, json, options, parseOptionalJsonBody, withCors } from '../_lib/http.js';
import { requirePrivyUser } from '../_lib/privy.js';

export const runtime = 'nodejs';

export const OPTIONS = options;

export async function POST(request: Request): Promise<Response> {
  try {
    const privyUser = await requirePrivyUser(request);
    const body = await parseOptionalJsonBody<OrgRoleHatUpsertRequest>(request);

    if (
      typeof body?.roleId !== 'string' ||
      !body.roleId.trim() ||
      typeof body?.roleName !== 'string' ||
      !body.roleName.trim() ||
      typeof body?.chainId !== 'number' ||
      typeof body?.hatId !== 'string' ||
      !body.hatId.trim() ||
      typeof body?.adminHatId !== 'string' ||
      !body.adminHatId.trim() ||
      typeof body?.eligibilityAddress !== 'string' ||
      !body.eligibilityAddress.trim() ||
      typeof body?.toggleAddress !== 'string' ||
      !body.toggleAddress.trim() ||
      typeof body?.txHash !== 'string' ||
      !body.txHash.trim()
    ) {
      throw new HttpError(400, 'A valid org role payload is required.');
    }

    const player = await upsertPlayer({
      privyUserId: privyUser.id,
      walletAddress: null
    });

    const orgRoleHat = await upsertOrgRoleHat({
      playerId: player.id,
      roleId: body.roleId.trim(),
      roleName: body.roleName.trim(),
      chainId: body.chainId,
      hatId: body.hatId.trim(),
      adminHatId: body.adminHatId.trim(),
      eligibilityAddress: body.eligibilityAddress.trim(),
      toggleAddress: body.toggleAddress.trim(),
      txHash: body.txHash.trim()
    });

    const response: OrgRoleHatUpsertResponse = { orgRoleHat };
    return withCors(request, json(response));
  } catch (error) {
    return handleRouteError(request, error);
  }
}
