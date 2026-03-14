import App from './App';
import { AppProviders } from './providers/AppProviders';

type AppRuntimeProps = {
  privyAppId: string;
  autoStartLogin?: boolean;
  onAutoStartLoginHandled?: () => void;
};

export default function AppRuntime({
  privyAppId,
  autoStartLogin = false,
  onAutoStartLoginHandled
}: AppRuntimeProps) {
  return (
    <AppProviders privyAppId={privyAppId}>
      <App
        autoStartLogin={autoStartLogin}
        onAutoStartLoginHandled={onAutoStartLoginHandled}
      />
    </AppProviders>
  );
}
