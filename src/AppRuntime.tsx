import App from './App';
import { AppProviders } from './providers/AppProviders';

type AppRuntimeProps = {
  privyAppId: string;
};

export default function AppRuntime({ privyAppId }: AppRuntimeProps) {
  return (
    <AppProviders privyAppId={privyAppId}>
      <App />
    </AppProviders>
  );
}
