import {
  getIdentityToken,
  getEmbeddedConnectedWallet,
  usePrivy,
  useWallets
} from '@privy-io/react-auth';
import {
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { shallow } from 'zustand/shallow';
import type {
  GameStateRequest,
  GameStateResponse,
  PlayerBootstrapRequest,
  PlayerBootstrapResponse,
  ProgressRequest,
  ProgressResponse,
  ResetResponse
} from './contracts/player';
import { getScene } from './levels/story';
import { postApi } from './lib/api';
import { buildGameStateSnapshot, useGameStore } from './state/gameStore';
import { usePlayerStore } from './state/playerStore';
import GameScreen, { type IntroDialogConfig } from './ui/GameScreen';
import { PlayerSessionBar } from './ui/PlayerSessionBar';

function getSessionLabel(walletAddress: string | null): string {
  if (!walletAddress) {
    return 'Privy session active';
  }

  return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
}

async function requireIdentityToken(): Promise<string> {
  const identityToken = await getIdentityToken();

  if (!identityToken) {
    throw new Error(
      'Privy identity tokens are unavailable. In the Privy dashboard, enable User management > Authentication > Advanced > Return user data in an identity token.'
    );
  }

  return identityToken;
}

export default function App() {
  const queryClient = useQueryClient();
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const embeddedWallet = getEmbeddedConnectedWallet(wallets);
  const walletAddress = embeddedWallet?.address ?? null;

  const storySceneIndex = useGameStore((state) => state.storySceneIndex);
  const hasSeenIntroDialog = useGameStore((state) => state.hasSeenIntroDialog);
  const dismissIntroDialog = useGameStore((state) => state.dismissIntroDialog);
  const hydrateForPlayer = useGameStore((state) => state.hydrateForPlayer);
  const resetTutorial = useGameStore((state) => state.resetTutorial);
  const gameStateSnapshot = useGameStore((state) => buildGameStateSnapshot(state), shallow);

  const player = usePlayerStore((state) => state.player);
  const setPlayer = usePlayerStore((state) => state.setPlayer);
  const clearPlayer = usePlayerStore((state) => state.clearPlayer);

  const scene = getScene(storySceneIndex);
  const serializedSnapshot = JSON.stringify(gameStateSnapshot);

  const [hasHydratedPlayerState, setHasHydratedPlayerState] = useState(false);
  const [identityToken, setIdentityToken] = useState<string | null>(null);
  const [identityTokenError, setIdentityTokenError] = useState<string | null>(null);
  const [identityTokenRequestCount, setIdentityTokenRequestCount] = useState(0);
  const hydrationKeyRef = useRef<string | null>(null);
  const lastTrackedBeatRef = useRef<string | null>(null);
  const lastSavedSnapshotRef = useRef<string | null>(null);
  const pendingSnapshotRef = useRef<string | null>(null);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!authenticated) {
      setIdentityToken(null);
      setIdentityTokenError(null);
      return;
    }

    let isCancelled = false;

    void (async () => {
      try {
        const nextIdentityToken = await requireIdentityToken();

        if (isCancelled) {
          return;
        }

        setIdentityToken(nextIdentityToken);
        setIdentityTokenError(null);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setIdentityToken(null);
        setIdentityTokenError(
          error instanceof Error ? error.message : 'Could not fetch a Privy identity token.'
        );
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [authenticated, identityTokenRequestCount, ready]);

  const bootstrapQuery = useQuery({
    queryKey: ['player-bootstrap', user?.id ?? null, walletAddress],
    enabled: ready && authenticated && Boolean(user?.id) && Boolean(identityToken),
    queryFn: async () =>
      postApi<PlayerBootstrapRequest, PlayerBootstrapResponse>(
        '/api/player/bootstrap',
        identityToken!,
        { walletAddress }
      )
  });

  const progressMutation = useMutation({
    mutationFn: async (body: ProgressRequest) => {
      if (!identityToken) {
        throw new Error('Missing Privy identity token.');
      }

      return postApi<ProgressRequest, ProgressResponse>(
        '/api/progress',
        identityToken,
        body
      );
    }
  });

  const gameStateMutation = useMutation({
    mutationFn: async (body: GameStateRequest) => {
      if (!identityToken) {
        throw new Error('Missing Privy identity token.');
      }

      return postApi<GameStateRequest, GameStateResponse>(
        '/api/game-state',
        identityToken,
        body
      );
    }
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      if (!identityToken) {
        throw new Error('Missing Privy identity token.');
      }

      return postApi<undefined, ResetResponse>('/api/reset', identityToken);
    }
  });

  useEffect(() => {
    if (!ready || authenticated) {
      return;
    }

    clearPlayer();
    setHasHydratedPlayerState(false);
    setIdentityToken(null);
    setIdentityTokenError(null);
    hydrationKeyRef.current = null;
    lastTrackedBeatRef.current = null;
    lastSavedSnapshotRef.current = null;
    pendingSnapshotRef.current = null;
    queryClient.removeQueries({ queryKey: ['player-bootstrap'] });
  }, [authenticated, clearPlayer, queryClient, ready]);

  useEffect(() => {
    if (!bootstrapQuery.data) {
      return;
    }

    const nextPlayer = bootstrapQuery.data.player;
    const nextGameState = bootstrapQuery.data.gameState;
    const hydrationKey = `${nextPlayer.id}:${nextGameState?.updatedAt ?? 'none'}`;

    setPlayer(nextPlayer);

    if (hydrationKey !== hydrationKeyRef.current) {
      hydrateForPlayer(nextPlayer.id, nextGameState?.snapshot ?? null);
      hydrationKeyRef.current = hydrationKey;
      lastTrackedBeatRef.current = null;
    }

    lastSavedSnapshotRef.current = nextGameState ? JSON.stringify(nextGameState.snapshot) : null;
    pendingSnapshotRef.current = null;
    setHasHydratedPlayerState(true);
  }, [bootstrapQuery.data, hydrateForPlayer, setPlayer]);

  useEffect(() => {
    if (!player || !authenticated || !identityToken || !hasHydratedPlayerState) {
      return;
    }

    const trackingKey = `${player.id}:${scene.id}`;

    if (lastTrackedBeatRef.current === trackingKey) {
      return;
    }

    lastTrackedBeatRef.current = trackingKey;
    progressMutation.mutate(
      { beat: scene.id },
      {
        onError: () => {
          lastTrackedBeatRef.current = null;
        }
      }
    );
  }, [
    authenticated,
    hasHydratedPlayerState,
    identityToken,
    player,
    progressMutation,
    scene.id
  ]);

  useEffect(() => {
    if (!player || !authenticated || !identityToken || !hasHydratedPlayerState) {
      return;
    }

    if (
      lastSavedSnapshotRef.current === serializedSnapshot ||
      pendingSnapshotRef.current === serializedSnapshot
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      pendingSnapshotRef.current = serializedSnapshot;
      gameStateMutation.mutate(
        { snapshot: gameStateSnapshot },
        {
          onSuccess: () => {
            lastSavedSnapshotRef.current = serializedSnapshot;
            pendingSnapshotRef.current = null;
          },
          onError: () => {
            pendingSnapshotRef.current = null;
          }
        }
      );
    }, 500);

    return () => window.clearTimeout(timer);
  }, [
    authenticated,
    gameStateMutation,
    gameStateSnapshot,
    hasHydratedPlayerState,
    identityToken,
    player,
    serializedSnapshot
  ]);

  useEffect(() => {
    if (!authenticated || !player || !hasHydratedPlayerState || hasSeenIntroDialog) {
      return;
    }

    dismissIntroDialog();
  }, [
    authenticated,
    dismissIntroDialog,
    hasHydratedPlayerState,
    hasSeenIntroDialog,
    player
  ]);
  let forceIntroDialog = false;
  let introDialogConfig: IntroDialogConfig | null = null;

  if (!ready) {
    forceIntroDialog = true;
    introDialogConfig = {
      primaryActionLabel: 'Preparing session',
      primaryActionDisabled: true,
      onPrimaryAction: () => {}
    };
  } else if (!authenticated) {
    forceIntroDialog = true;
    introDialogConfig = {
      primaryActionLabel: 'Continue',
      onPrimaryAction: login
    };
  } else if (identityTokenError) {
    forceIntroDialog = true;
    introDialogConfig = {
      primaryActionLabel: 'Try again',
      onPrimaryAction: () => {
        setIdentityToken(null);
        setIdentityTokenError(null);
        setIdentityTokenRequestCount((current) => current + 1);
      },
      secondaryActionLabel: 'Sign out',
      onSecondaryAction: () => {
        void logout();
        queryClient.clear();
      }
    };
  } else if (bootstrapQuery.isError) {
    forceIntroDialog = true;
    introDialogConfig = {
      primaryActionLabel: 'Retry',
      onPrimaryAction: () => {
        void bootstrapQuery.refetch();
      },
      secondaryActionLabel: 'Sign out',
      onSecondaryAction: () => {
        void logout();
        queryClient.clear();
      }
    };
  } else if (!identityToken || bootstrapQuery.isPending || !hasHydratedPlayerState || !player) {
    forceIntroDialog = true;
    introDialogConfig = {
      primaryActionLabel: 'Restoring player',
      primaryActionDisabled: true,
      onPrimaryAction: () => {}
    };
  }

  const showSessionBar = Boolean(authenticated && player && hasHydratedPlayerState);
  const suppressIntroDialog = Boolean(authenticated && player && hasHydratedPlayerState);

  return (
    <GameScreen
      forceIntroDialog={forceIntroDialog}
      suppressIntroDialog={suppressIntroDialog}
      introDialogConfig={introDialogConfig}
      headerAccessory={
        showSessionBar && player ? (
          <PlayerSessionBar
            label={getSessionLabel(player.walletAddress)}
            onReset={() => {
              void (async () => {
                const confirmed = window.confirm(
                  'Reset the current demo run? Your farthest progress will stay recorded.'
                );

                if (!confirmed) {
                  return;
                }

                await resetMutation.mutateAsync();
                resetTutorial();
                lastTrackedBeatRef.current = null;
                lastSavedSnapshotRef.current = null;
                pendingSnapshotRef.current = null;
              })();
            }}
            onSignOut={() => {
              void (async () => {
                await logout();
                queryClient.clear();
              })();
            }}
            isResetting={resetMutation.isPending}
          />
        ) : null
      }
    />
  );
}
