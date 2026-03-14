import { PrivyProvider } from '@privy-io/react-auth';
import { SmartWalletsProvider } from '@privy-io/react-auth/smart-wallets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { sepolia } from 'viem/chains';

type AppProvidersProps = {
  children: ReactNode;
  privyAppId: string;
};

export function AppProviders({ children, privyAppId }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: false
          },
          mutations: {
            retry: false
          }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={privyAppId}
        config={{
          loginMethods: ['email', 'wallet'],
          supportedChains: [sepolia],
          defaultChain: sepolia,
          appearance: {
            walletChainType: 'ethereum-only'
          },
          embeddedWallets: {
            ethereum: {
              createOnLogin: 'all-users'
            }
          }
        }}
      >
        <SmartWalletsProvider>{children}</SmartWalletsProvider>
      </PrivyProvider>
    </QueryClientProvider>
  );
}
