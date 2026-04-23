import { PrivyClient } from '@privy-io/node';
import { getAddress, isAddress, type Address } from 'viem';
import { getPrivyAppId, getPrivyAppSecret } from './env.js';
import { HttpError } from './http.js';

let privyClient: PrivyClient | null = null;

export function getPrivyClient(): PrivyClient {
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

export type VerifiedPrivyAuth = {
  identityToken: string;
  user: VerifiedPrivyUser;
};

export type EmbeddedPrivyEthereumWallet = Extract<
  VerifiedPrivyUser['linked_accounts'][number],
  {
    type: 'wallet';
    chain_type: 'ethereum';
    connector_type: 'embedded';
    wallet_client_type: 'privy';
  }
>;

export function getBearerToken(request: Request): string | null {
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

export async function requirePrivyAuth(request: Request): Promise<VerifiedPrivyAuth> {
  const identityToken = getBearerToken(request);

  if (!identityToken) {
    throw new HttpError(401, 'Missing Privy identity token.');
  }

  try {
    const user = await getPrivyClient().users().get({
      id_token: identityToken
    });

    return {
      identityToken,
      user
    };
  } catch {
    throw new HttpError(401, 'Invalid Privy identity token.');
  }
}

export async function requirePrivyUser(request: Request): Promise<VerifiedPrivyUser> {
  const auth = await requirePrivyAuth(request);
  return auth.user;
}

export function getEmbeddedPrivyEthereumWallet(
  user: VerifiedPrivyUser,
  walletAddress: string
): EmbeddedPrivyEthereumWallet {
  if (!isAddress(walletAddress)) {
    throw new HttpError(400, 'A valid embedded wallet address is required for worker payments.');
  }

  const normalizedWalletAddress = getAddress(walletAddress);
  const linkedWallet = user.linked_accounts.find(
    (account): account is EmbeddedPrivyEthereumWallet =>
      account.type === 'wallet' &&
      account.chain_type === 'ethereum' &&
      account.connector_type === 'embedded' &&
      account.wallet_client_type === 'privy' &&
      getAddress(account.address as Address) === normalizedWalletAddress
  );

  if (!linkedWallet || !linkedWallet.id) {
    throw new HttpError(
      403,
      'The selected embedded wallet is not available for this player session.'
    );
  }

  return linkedWallet;
}
