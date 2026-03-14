import { Analytics } from '@vercel/analytics/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { clientEnv } from './config';
import type { IntroDialogConfig } from './ui/GameScreen';
import GameScreen from './ui/GameScreen';

const GAME_STATE_STORAGE_HINT_KEY = 'dao-the-game:state:v2';

type AppRuntimeComponent = typeof import('./AppRuntime').default;

function hasPersistedGameStateHint(): boolean {
  try {
    return Boolean(window.localStorage.getItem(GAME_STATE_STORAGE_HINT_KEY));
  } catch {
    return false;
  }
}

export default function RootApp() {
  const [runtimeComponent, setRuntimeComponent] = useState<AppRuntimeComponent | null>(null);
  const [runtimeStatus, setRuntimeStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    hasPersistedGameStateHint() ? 'loading' : 'idle'
  );
  const [autoStartLogin, setAutoStartLogin] = useState(false);
  const loadPromiseRef = useRef<Promise<void> | null>(null);

  const loadRuntime = useCallback(
    async ({ startLogin = false }: { startLogin?: boolean } = {}) => {
      if (startLogin) {
        setAutoStartLogin(true);
      }

      if (runtimeComponent) {
        setRuntimeStatus('ready');
        return;
      }

      if (loadPromiseRef.current) {
        return loadPromiseRef.current;
      }

      setRuntimeStatus('loading');
      loadPromiseRef.current = import('./AppRuntime')
        .then((module) => {
          setRuntimeComponent(() => module.default);
          setRuntimeStatus('ready');
        })
        .catch(() => {
          setRuntimeStatus('error');
          loadPromiseRef.current = null;
        });

      return loadPromiseRef.current;
    },
    [runtimeComponent]
  );

  useEffect(() => {
    if (runtimeStatus !== 'loading' || runtimeComponent) {
      return;
    }

    void loadRuntime();
  }, [loadRuntime, runtimeComponent, runtimeStatus]);

  if (!clientEnv.privyAppId) {
    return (
      <>
        <GameScreen
          forceIntroDialog
          introDialogConfig={{
            primaryActionLabel: 'Set VITE_PRIVY_APP_ID',
            primaryActionDisabled: true,
            onPrimaryAction: () => {}
          }}
        />
        <Analytics />
      </>
    );
  }

  if (runtimeComponent) {
    const AppRuntime = runtimeComponent;

    return (
      <>
        <AppRuntime
          privyAppId={clientEnv.privyAppId}
          autoStartLogin={autoStartLogin}
          onAutoStartLoginHandled={() => setAutoStartLogin(false)}
        />
        <Analytics />
      </>
    );
  }

  let introDialogConfig: IntroDialogConfig;

  if (runtimeStatus === 'error') {
    introDialogConfig = {
      primaryActionLabel: 'Retry sign in',
      onPrimaryAction: () => {
        void loadRuntime({ startLogin: true });
      }
    };
  } else if (runtimeStatus === 'loading') {
    introDialogConfig = {
      primaryActionLabel: autoStartLogin ? 'Loading sign-in...' : 'Preparing session',
      primaryActionDisabled: true,
      onPrimaryAction: () => {}
    };
  } else {
    introDialogConfig = {
      primaryActionLabel: 'Continue',
      onPrimaryAction: () => {
        void loadRuntime({ startLogin: true });
      }
    };
  }

  return (
    <>
      <GameScreen forceIntroDialog introDialogConfig={introDialogConfig} />
      <Analytics />
    </>
  );
}
