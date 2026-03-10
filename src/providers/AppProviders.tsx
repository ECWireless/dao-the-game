import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

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
        {children}
      </PrivyProvider>
    </QueryClientProvider>
  );
}
