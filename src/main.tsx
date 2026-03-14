import './polyfills';
import { Analytics } from '@vercel/analytics/react';
import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { clientEnv } from './config';
import './theme/fonts.css';
import './theme/tokens.css';
import './theme/global.css';
import GameScreen from './ui/GameScreen';

const AppRuntime = lazy(() => import('./AppRuntime'));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {clientEnv.privyAppId ? (
      <Suspense
        fallback={
          <GameScreen
            forceIntroDialog
            introDialogConfig={{
              primaryActionLabel: 'Loading...',
              primaryActionDisabled: true,
              onPrimaryAction: () => {}
            }}
          />
        }
      >
        <AppRuntime privyAppId={clientEnv.privyAppId} />
      </Suspense>
    ) : (
      <GameScreen
        forceIntroDialog
        introDialogConfig={{
          primaryActionLabel: 'Set VITE_PRIVY_APP_ID',
          primaryActionDisabled: true,
          onPrimaryAction: () => {}
        }}
      />
    )}
    <Analytics />
  </React.StrictMode>
);
