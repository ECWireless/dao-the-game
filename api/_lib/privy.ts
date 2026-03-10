import { PrivyClient } from '@privy-io/node';
import { getPrivyAppId, getPrivyAppSecret } from './env.js';
import { HttpError } from './http.js';

let privyClient: PrivyClient | null = null;

function getPrivyClient(): PrivyClient {
  if (!privyClient) {
    privyClient = new PrivyClient({
      appId: getPrivyAppId(),
      appSecret: getPrivyAppSecret()
    });
  }

  return privyClient;
}

export type VerifiedPrivyUser = Awaited<
  ReturnType<ReturnType<PrivyClient['users']>['get']>
>;

function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get('authorization');

  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

export async function requirePrivyUser(request: Request): Promise<VerifiedPrivyUser> {
  const identityToken = getBearerToken(request);

  if (!identityToken) {
    throw new HttpError(401, 'Missing Privy identity token.');
  }

  try {
    return await getPrivyClient().users().get({
      id_token: identityToken
    });
  } catch {
    throw new HttpError(401, 'Invalid Privy identity token.');
  }
}
