import {
  getIdentityToken,
  getEmbeddedConnectedWallet,
  usePrivy,
  useWallets
} from '@privy-io/react-auth';
import { useSmartWallets } from '@privy-io/react-auth/smart-wallets';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Address } from 'viem';
import type {
  ArtifactDeployEvent,
  ArtifactDeployRequest
} from './contracts/artifact';
import type {
  OrgRoleHatRecord,
  OrgRoleHatUpsertRequest,
  OrgRoleHatUpsertResponse,
  OrgTreeUpsertRequest,
  OrgTreeUpsertResponse
} from './contracts/org';
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
import type { ArtifactGenerationRecovery } from './contracts/gameState';
import { clientEnv } from './config';
import { TUTORIAL_BRIEF } from './levels/tutorial';
import { getScene } from './levels/story';
import {
  HATS_CHAIN_ID,
  changeHatDetails,
  createEmbeddedWalletExecutionClient,
  createRoleHat,
  mintTopHat,
  type HatsExecutionClient
} from './lib/hats';
import { deployArtifactWithProgress, postApi } from './lib/api';
import { buildGameStateSnapshot, useGameStore } from './state/gameStore';
import { usePlayerStore } from './state/playerStore';
import { generateArtifacts } from './sim';
import GameScreen, { type IntroDialogConfig } from './ui/GameScreen';
import type { ArtifactGenerationProgress } from './ui/game-screen/types';
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

function getSnapshotSaveDelay(attempt: number): number {
  if (attempt <= 0) {
    return 500;
  }

  return Math.min(1000 * 2 ** (attempt - 1), 10_000);
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function formatTxHash(hash: string): string {
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}

function buildArtifactRecoveryMessage(recovery: ArtifactGenerationRecovery): string {
  if (recovery.status === 'failed' && recovery.error?.trim()) {
    return recovery.error;
  }

  if (recovery.lastKnownPhase === 'worker' && recovery.lastKnownWorkerName) {
    return `Assembly was interrupted during ${recovery.lastKnownWorkerName}'s pass. Re-run the assembly to restore the output.`;
  }

  if (recovery.lastKnownPhase === 'publishing') {
    return 'Assembly was interrupted while publishing the finished site. Re-run the assembly to restore the output.';
  }

  return 'Assembly was interrupted before the site reached the output node. Re-run the assembly to restore it.';
}

function sortRoleHats(roleHats: OrgRoleHatRecord[]): OrgRoleHatRecord[] {
  return [...roleHats].sort((left, right) => left.roleId.localeCompare(right.roleId));
}

type ResolveExecutionClientOptions = {
  expectedWearerAddress?: string | null;
  requireSmartWallet?: boolean;
};

type AppProps = {
  autoStartLogin?: boolean;
  onAutoStartLoginHandled?: () => void;
};

export default function App({
  autoStartLogin = false,
  onAutoStartLoginHandled
}: AppProps) {
  const queryClient = useQueryClient();
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const { getClientForChain } = useSmartWallets();
  const embeddedWallet = getEmbeddedConnectedWallet(wallets);
  const walletAddress = embeddedWallet?.address ?? null;

  const storySceneIndex = useGameStore((state) => state.storySceneIndex);
  const hasSeenIntroDialog = useGameStore((state) => state.hasSeenIntroDialog);
  const dismissIntroDialog = useGameStore((state) => state.dismissIntroDialog);
  const hydrateForPlayer = useGameStore((state) => state.hydrateForPlayer);
  const resetTutorial = useGameStore((state) => state.resetTutorial);
  const setStudioName = useGameStore((state) => state.setStudioName);
  const configureRole = useGameStore((state) => state.configureRole);
  const runProduction = useGameStore((state) => state.runProduction);
  const setLatestArtifacts = useGameStore((state) => state.setLatestArtifacts);
  const artifactGenerationRecovery = useGameStore((state) => state.artifactGenerationRecovery);
  const setArtifactGenerationRecovery = useGameStore((state) => state.setArtifactGenerationRecovery);
  const gameStateSnapshot = useGameStore((state) => buildGameStateSnapshot(state), shallow);

  const player = usePlayerStore((state) => state.player);
  const setPlayer = usePlayerStore((state) => state.setPlayer);
  const clearPlayer = usePlayerStore((state) => state.clearPlayer);

  const scene = getScene(storySceneIndex);
  const serializedSnapshot = useMemo(() => JSON.stringify(gameStateSnapshot), [gameStateSnapshot]);

  const [hasHydratedPlayerState, setHasHydratedPlayerState] = useState(false);
  const [gameScreenKey, setGameScreenKey] = useState(0);
  const [identityToken, setIdentityToken] = useState<string | null>(null);
  const [identityTokenError, setIdentityTokenError] = useState<string | null>(null);
  const [identityTokenRequestCount, setIdentityTokenRequestCount] = useState(0);
  const [artifactGenerationProgress, setArtifactGenerationProgress] =
    useState<ArtifactGenerationProgress | null>(null);
  const [artifactGenerationError, setArtifactGenerationError] = useState<string | null>(null);
  const [gameStateSaveRetry, setGameStateSaveRetry] = useState<{
    snapshot: string | null;
    attempt: number;
  }>({
    snapshot: null,
    attempt: 0
  });
  const hydrationKeyRef = useRef<string | null>(null);
  const lastTrackedBeatRef = useRef<string | null>(null);
  const lastSavedSnapshotRef = useRef<string | null>(null);
  const pendingSnapshotRef = useRef<string | null>(null);
  const artifactDeployRequestRef = useRef<ArtifactDeployRequest | null>(null);
  const hasTriggeredAutoLoginRef = useRef(false);
  const snapshotSaveRetryAttempt =
    gameStateSaveRetry.snapshot === serializedSnapshot ? gameStateSaveRetry.attempt : 0;
  const bootstrapQueryKey = useMemo(
    () => ['player-bootstrap', user?.id ?? null, walletAddress] as const,
    [user?.id, walletAddress]
  );

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

  useEffect(() => {
    if (!autoStartLogin) {
      hasTriggeredAutoLoginRef.current = false;
      return;
    }

    if (!ready || authenticated || hasTriggeredAutoLoginRef.current) {
      return;
    }

    hasTriggeredAutoLoginRef.current = true;
    onAutoStartLoginHandled?.();
    void login();
  }, [authenticated, autoStartLogin, login, onAutoStartLoginHandled, ready]);

  const bootstrapQuery = useQuery({
    queryKey: bootstrapQueryKey,
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

      return postApi<ProgressRequest, ProgressResponse>('/api/progress', identityToken, body);
    }
  });

  const gameStateMutation = useMutation({
    mutationFn: async (body: GameStateRequest) => {
      if (!identityToken) {
        throw new Error('Missing Privy identity token.');
      }

      return postApi<GameStateRequest, GameStateResponse>('/api/game-state', identityToken, body);
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

  const artifactDeployMutation = useMutation({
    mutationFn: async ({
      body,
      onEvent
    }: {
      body: ArtifactDeployRequest;
      onEvent?: (event: ArtifactDeployEvent) => void;
    }) => {
      if (!identityToken) {
        throw new Error('Missing Privy identity token.');
      }

      return deployArtifactWithProgress(identityToken, body, onEvent);
    }
  });

  const orgTreeMutation = useMutation({
    mutationFn: async (body: OrgTreeUpsertRequest) => {
      if (!identityToken) {
        throw new Error('Missing Privy identity token.');
      }

      return postApi<OrgTreeUpsertRequest, OrgTreeUpsertResponse>(
        '/api/org/tree',
        identityToken,
        body
      );
    }
  });

  const orgRoleHatMutation = useMutation({
    mutationFn: async (body: OrgRoleHatUpsertRequest) => {
      if (!identityToken) {
        throw new Error('Missing Privy identity token.');
      }

      return postApi<OrgRoleHatUpsertRequest, OrgRoleHatUpsertResponse>(
        '/api/org/role',
        identityToken,
        body
      );
    }
  });

  const updateBootstrapCache = useCallback(
    (updater: (current: PlayerBootstrapResponse) => PlayerBootstrapResponse) => {
      queryClient.setQueryData<PlayerBootstrapResponse>(bootstrapQueryKey, (current) =>
        current ? updater(current) : current
      );
    },
    [bootstrapQueryKey, queryClient]
  );

  const syncResetRefs = useCallback(() => {
    lastTrackedBeatRef.current = null;
    lastSavedSnapshotRef.current = null;
    pendingSnapshotRef.current = null;
    setGameStateSaveRetry({ snapshot: null, attempt: 0 });
  }, []);

  const resolveExecutionClient = useCallback(
    async ({
      expectedWearerAddress = null,
      requireSmartWallet = false
    }: ResolveExecutionClientOptions = {}): Promise<HatsExecutionClient> => {
      if (!embeddedWallet) {
        throw new Error(
          'The embedded gameplay wallet is unavailable right now. Sign out and back in, then try again.'
        );
      }

      const normalizedExpectedAddress = expectedWearerAddress?.toLowerCase() ?? null;
      let smartWalletExecutionClient: HatsExecutionClient | null = null;

      if (requireSmartWallet || normalizedExpectedAddress) {
        try {
          const smartWalletClient = await getClientForChain({ id: HATS_CHAIN_ID });
          const smartWalletAddress = smartWalletClient?.account?.address as Address | undefined;

          if (smartWalletClient && smartWalletAddress) {
            smartWalletExecutionClient = {
              kind: 'smart',
              address: smartWalletAddress,
              client: smartWalletClient
            };
          }
        } catch (error) {
          if (requireSmartWallet) {
            throw new Error(
              getErrorMessage(
                error,
                'Smart-wallet execution is enabled, but the Privy smart wallet is unavailable right now.'
              )
            );
          }
        }
      }

      if (
        smartWalletExecutionClient &&
        (!normalizedExpectedAddress ||
          smartWalletExecutionClient.address.toLowerCase() === normalizedExpectedAddress)
      ) {
        return smartWalletExecutionClient;
      }

      if (requireSmartWallet) {
        throw new Error(
          'Smart-wallet execution is enabled, but this org is not linked to an available Sepolia smart wallet.'
        );
      }

      const embeddedExecutionClient = await createEmbeddedWalletExecutionClient(embeddedWallet);

      if (
        normalizedExpectedAddress &&
        embeddedExecutionClient.address.toLowerCase() !== normalizedExpectedAddress
      ) {
        throw new Error(
          'This studio Hats tree is linked to a different execution wallet. Sign out and back in before editing the org.'
        );
      }

      return embeddedExecutionClient;
    },
    [embeddedWallet, getClientForChain]
  );

  const orgTree = bootstrapQuery.data?.orgTree ?? null;
  const orgRoleHats = useMemo(
    () => bootstrapQuery.data?.orgRoleHats ?? [],
    [bootstrapQuery.data?.orgRoleHats]
  );
  const orgRoleHatByRoleId = useMemo(
    () => new Map(orgRoleHats.map((roleHat) => [roleHat.roleId, roleHat])),
    [orgRoleHats]
  );

  const handleSetStudioName = useCallback(
    async (name: string) => {
      const normalizedName = name.trim();

      if (!normalizedName) {
        return;
      }

      if (orgTree) {
        if (orgTree.studioName?.trim() !== normalizedName) {
          const executionClient = await resolveExecutionClient({
            expectedWearerAddress: orgTree.wearerAddress
          });
          const { txHash } = await changeHatDetails({
            executionClient,
            hatId: BigInt(orgTree.topHatId),
            details: normalizedName
          }).catch((error) => {
            throw new Error(getErrorMessage(error, 'Could not update the studio top hat.'));
          });

          try {
            const response = await orgTreeMutation.mutateAsync({
              chainId: orgTree.chainId,
              topHatId: orgTree.topHatId,
              studioName: normalizedName,
              wearerAddress: orgTree.wearerAddress,
              eligibilityAddress: orgTree.eligibilityAddress,
              toggleAddress: orgTree.toggleAddress,
              txHash
            });

            updateBootstrapCache((current) => ({
              ...current,
              orgTree: response.orgTree
            }));
          } catch {
            throw new Error(
              `The studio name updated onchain (${formatTxHash(txHash)}), but local sync failed. Refresh before retrying.`
            );
          }
        }

        setStudioName(normalizedName);
        return;
      }

      const executionClient = await resolveExecutionClient({
        requireSmartWallet: clientEnv.preferSmartWalletExecution
      });
      const wearerAddress = executionClient.address;

      const { hatId, txHash } = await mintTopHat({
        executionClient,
        wearerAddress,
        details: normalizedName
      }).catch((error) => {
        throw new Error(getErrorMessage(error, 'Could not create the studio top hat.'));
      });

      try {
        const response = await orgTreeMutation.mutateAsync({
          chainId: HATS_CHAIN_ID,
          topHatId: hatId.toString(),
          studioName: normalizedName,
          wearerAddress,
          eligibilityAddress: wearerAddress,
          toggleAddress: wearerAddress,
          txHash
        });

        updateBootstrapCache((current) => ({
          ...current,
          orgTree: response.orgTree
        }));
      } catch {
        throw new Error(
          `The studio top hat was created onchain (${formatTxHash(txHash)}), but local sync failed. Refresh before retrying.`
        );
      }

      setStudioName(normalizedName);
    },
    [orgTree, orgTreeMutation, resolveExecutionClient, setStudioName, updateBootstrapCache]
  );

  const handleConfigureRole = useCallback(
    async (roleId: string, name: string) => {
      const existingRoleHat = orgRoleHatByRoleId.get(roleId);
      const normalizedName = name.trim();

      if (!normalizedName) {
        return;
      }

      if (existingRoleHat) {
        configureRole(roleId, normalizedName);
        return;
      }

      if (!orgTree) {
        throw new Error('Create the studio root onchain before adding roles.');
      }

      const executionClient = await resolveExecutionClient({
        expectedWearerAddress: orgTree.wearerAddress
      });
      const { hatId, txHash } = await createRoleHat({
        executionClient,
        adminHatId: BigInt(orgTree.topHatId),
        details: normalizedName,
        eligibilityAddress: orgTree.wearerAddress as Address,
        toggleAddress: orgTree.wearerAddress as Address
      }).catch((error) => {
        throw new Error(getErrorMessage(error, `Could not create the ${normalizedName} hat.`));
      });

      try {
        const response = await orgRoleHatMutation.mutateAsync({
          roleId,
          roleName: normalizedName,
          chainId: orgTree.chainId,
          hatId: hatId.toString(),
          adminHatId: orgTree.topHatId,
          eligibilityAddress: orgTree.wearerAddress,
          toggleAddress: orgTree.wearerAddress,
          txHash
        });

        updateBootstrapCache((current) => ({
          ...current,
          orgRoleHats: sortRoleHats([
            ...current.orgRoleHats.filter((roleHat) => roleHat.roleId !== roleId),
            response.orgRoleHat
          ])
        }));
      } catch {
        throw new Error(
          `The ${normalizedName} hat was created onchain (${formatTxHash(txHash)}), but local sync failed. Refresh before retrying.`
        );
      }

      configureRole(roleId, normalizedName);
    },
    [
      configureRole,
      orgRoleHatByRoleId,
      orgRoleHatMutation,
      orgTree,
      resolveExecutionClient,
      updateBootstrapCache
    ]
  );

  const handleResetDemo = useCallback(async () => {
    const response = await resetMutation.mutateAsync();

    updateBootstrapCache((current) => ({
      ...current,
      progress: response.progress,
      gameState: null
    }));
    setArtifactGenerationProgress(null);
    setArtifactGenerationError(null);
    artifactDeployRequestRef.current = null;
    setArtifactGenerationRecovery(undefined);
    syncResetRefs();
  }, [resetMutation, setArtifactGenerationRecovery, syncResetRefs, updateBootstrapCache]);

  const buildArtifactDeployRequest = useCallback((cycle: 1 | 2): ArtifactDeployRequest | null => {
    const currentState = useGameStore.getState();
    const result =
      currentState.runHistory[cycle] ??
      (currentState.runCount === cycle ? currentState.latestRun : undefined);

    if (!result) {
      return null;
    }

    const draftArtifacts = generateArtifacts({
      result,
      brief: TUTORIAL_BRIEF,
      cycle,
      studioName: currentState.studioName,
      roles: currentState.roles,
      agents: currentState.agents
    });

    if (!draftArtifacts) {
      return null;
    }

    return {
      artifact: draftArtifacts,
      generationInput: {
        result,
        brief: TUTORIAL_BRIEF,
        cycle: draftArtifacts.provenance.cycle,
        studioName: currentState.studioName,
        roles: currentState.roles,
        agents: currentState.agents
      }
    };
  }, []);

  const handleArtifactDeployEvent = useCallback((event: ArtifactDeployEvent) => {
    switch (event.type) {
      case 'generation-start':
        setArtifactGenerationError(null);
        setArtifactGenerationProgress({
          phase: 'starting',
          note: 'Routing the conference brief through the worker line.'
        });
        setArtifactGenerationRecovery((current) => current ? {
          ...current,
          status: 'pending',
          lastKnownPhase: 'starting',
          lastKnownStageId: undefined,
          lastKnownWorkerName: undefined,
          error: undefined
        } : current);
        return;
      case 'worker-start':
        setArtifactGenerationProgress({
          phase: 'worker',
          stageId: event.stageId,
          workerName: event.workerName,
          workerSpecialty: event.workerSpecialty,
          note: event.note
        });
        setArtifactGenerationRecovery((current) => current ? {
          ...current,
          status: 'pending',
          lastKnownPhase: 'worker',
          lastKnownStageId: event.stageId,
          lastKnownWorkerName: event.workerName,
          error: undefined
        } : current);
        return;
      case 'worker-output':
        if (clientEnv.artifactDebugWorkers) {
          console.groupCollapsed(
            `[artifact worker] ${event.stageId} :: ${event.workerName}${event.usedFallback ? ' (fallback)' : ''}`
          );
          console.log('model', event.model ?? null);
          console.log('durationMs', event.durationMs ?? null);
          if (event.error) {
            console.warn('error', event.error);
          }
          console.log('output', event.output);
          console.log('rawOutputText', event.rawOutputText ?? null);
          console.groupEnd();
        }
        return;
      case 'artifact-generated':
        if (clientEnv.artifactDebugWorkers) {
          console.groupCollapsed(
            `[artifact worker] generated site${event.usedFallback ? ' (with fallback fields)' : ''}`
          );
          console.log('artifact', event.artifact);
          console.groupEnd();
        }
        setArtifactGenerationError(null);
        setLatestArtifacts(event.artifact);
        return;
      case 'publishing-start':
        setArtifactGenerationProgress({
          phase: 'publishing',
          note: 'Uploading the assembled site to Pinata.'
        });
        setArtifactGenerationRecovery((current) => current ? {
          ...current,
          status: 'pending',
          lastKnownPhase: 'publishing',
          lastKnownStageId: undefined,
          error: undefined
        } : current);
        return;
      case 'artifact-deployed':
        if (clientEnv.artifactDebugWorkers) {
          console.groupCollapsed('[artifact worker] deployed site');
          console.log('artifact', event.artifact);
          console.groupEnd();
        }
        setArtifactGenerationError(null);
        setLatestArtifacts(event.artifact);
        return;
      case 'error':
        if (import.meta.env.DEV || clientEnv.artifactDebugWorkers) {
          console.error('[artifact worker] deploy error', event.error);
        }
        setArtifactGenerationError(event.error);
        setArtifactGenerationProgress(null);
        setArtifactGenerationRecovery((current) =>
          current
            ? {
                ...current,
                status: 'failed',
                error: event.error
              }
            : current
        );
        return;
    }
  }, [setArtifactGenerationRecovery, setLatestArtifacts]);

  const executeArtifactDeploy = useCallback(
    async (body: ArtifactDeployRequest) => {
      const cycle = body.artifact.provenance.cycle;
      artifactDeployRequestRef.current = body;
      setArtifactGenerationError(null);
      setArtifactGenerationProgress({
        phase: 'starting',
        note: 'Routing the conference brief through the worker line.'
      });
      setArtifactGenerationRecovery({
        cycle,
        status: 'pending',
        lastKnownPhase: 'starting'
      });
      setLatestArtifacts(undefined);

      try {
        const response = await artifactDeployMutation.mutateAsync({
          body,
          onEvent: handleArtifactDeployEvent
        });
        setArtifactGenerationError(null);
        setLatestArtifacts(response.artifact);
        setArtifactGenerationProgress(null);
        setArtifactGenerationRecovery(undefined);
        artifactDeployRequestRef.current = null;
      } catch (error) {
        const errorMessage = getErrorMessage(
          error,
          'Assembly failed before a site could be routed to the output node.'
        );

        setArtifactGenerationError(errorMessage);
        setArtifactGenerationProgress(null);
        setArtifactGenerationRecovery((current) => ({
          cycle,
          status: 'failed',
          lastKnownPhase: current?.lastKnownPhase ?? 'starting',
          lastKnownStageId: current?.lastKnownStageId,
          lastKnownWorkerName: current?.lastKnownWorkerName,
          error: errorMessage
        }));
      }
    },
    [
      artifactDeployMutation,
      handleArtifactDeployEvent,
      setArtifactGenerationRecovery,
      setLatestArtifacts
    ]
  );

  const handleRunProduction = useCallback(async () => {
    const result = runProduction();

    if (!result) {
      return;
    }

    const nextCycle = Math.min(useGameStore.getState().runCount, 2) as 1 | 2;
    const deployRequest = buildArtifactDeployRequest(nextCycle);

    if (!deployRequest) {
      setArtifactGenerationError('No draft artifact was available for assembly.');
      return;
    }

    await executeArtifactDeploy(deployRequest);
  }, [buildArtifactDeployRequest, executeArtifactDeploy, runProduction]);

  const handleRetryArtifactDeploy = useCallback(async () => {
    const previousRequest =
      artifactDeployRequestRef.current ??
      (artifactGenerationRecovery
        ? buildArtifactDeployRequest(artifactGenerationRecovery.cycle)
        : null);

    if (!previousRequest) {
      setArtifactGenerationError('There is no interrupted assembly to re-run yet.');
      return;
    }

    await executeArtifactDeploy(previousRequest);
  }, [artifactGenerationRecovery, buildArtifactDeployRequest, executeArtifactDeploy]);

  useEffect(() => {
    if (!ready || authenticated) {
      return;
    }

    clearPlayer();
    setHasHydratedPlayerState(false);
    setArtifactGenerationProgress(null);
    setArtifactGenerationError(null);
    setIdentityToken(null);
    setIdentityTokenError(null);
    artifactDeployRequestRef.current = null;
    hydrationKeyRef.current = null;
    lastTrackedBeatRef.current = null;
    lastSavedSnapshotRef.current = null;
    pendingSnapshotRef.current = null;
    setGameStateSaveRetry({ snapshot: null, attempt: 0 });
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
    setGameStateSaveRetry({ snapshot: null, attempt: 0 });
    setHasHydratedPlayerState(true);
  }, [bootstrapQuery.data, hydrateForPlayer, setPlayer]);

  useEffect(() => {
    if (!hasHydratedPlayerState || artifactDeployMutation.isPending || !artifactGenerationRecovery) {
      return;
    }

    artifactDeployRequestRef.current = buildArtifactDeployRequest(artifactGenerationRecovery.cycle);
    setArtifactGenerationProgress(null);
    setArtifactGenerationError((current) => current ?? buildArtifactRecoveryMessage(artifactGenerationRecovery));
  }, [
    artifactDeployMutation.isPending,
    artifactGenerationRecovery,
    buildArtifactDeployRequest,
    hasHydratedPlayerState,
    setArtifactGenerationRecovery
  ]);

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
  }, [authenticated, hasHydratedPlayerState, identityToken, player, progressMutation, scene.id]);

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
            setGameStateSaveRetry({ snapshot: null, attempt: 0 });
          },
          onError: () => {
            pendingSnapshotRef.current = null;
            setGameStateSaveRetry((current) => ({
              snapshot: serializedSnapshot,
              attempt: current.snapshot === serializedSnapshot ? current.attempt + 1 : 1
            }));
          }
        }
      );
    }, getSnapshotSaveDelay(snapshotSaveRetryAttempt));

    return () => window.clearTimeout(timer);
  }, [
    authenticated,
    gameStateMutation,
    gameStateSnapshot,
    hasHydratedPlayerState,
    identityToken,
    player,
    serializedSnapshot,
    snapshotSaveRetryAttempt
  ]);

  useEffect(() => {
    if (!authenticated || !player || !hasHydratedPlayerState || hasSeenIntroDialog) {
      return;
    }

    dismissIntroDialog();
  }, [authenticated, dismissIntroDialog, hasHydratedPlayerState, hasSeenIntroDialog, player]);
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
      key={gameScreenKey}
      forceIntroDialog={forceIntroDialog}
      suppressIntroDialog={suppressIntroDialog}
      introDialogConfig={introDialogConfig}
      orgTree={orgTree}
      onSetStudioName={handleSetStudioName}
      onConfigureRole={handleConfigureRole}
      onRunProduction={handleRunProduction}
      onRetryArtifactGeneration={handleRetryArtifactDeploy}
      isRetryingArtifactGeneration={artifactDeployMutation.isPending}
      onResetDemo={handleResetDemo}
      artifactGenerationProgress={artifactGenerationProgress}
      artifactGenerationError={artifactGenerationError}
      artifactGenerationRecovery={artifactGenerationRecovery ?? null}
      headerAccessory={
        showSessionBar && player ? (
          <PlayerSessionBar
            label={getSessionLabel(player.walletAddress)}
            embeddedWalletAddress={embeddedWallet?.address ?? null}
            onReset={() => {
              void (async () => {
                const confirmed = window.confirm(
                  'Reset the current demo run? Your farthest progress will stay recorded.'
                );

                if (!confirmed) {
                  return;
                }

                try {
                  setArtifactGenerationProgress(null);
                  setArtifactGenerationError(null);
                  artifactDeployRequestRef.current = null;
                  setArtifactGenerationRecovery(undefined);
                  await handleResetDemo();
                  resetTutorial();
                  setGameScreenKey((current) => current + 1);
                } catch (error) {
                  window.alert(
                    getErrorMessage(error, 'Could not reset the current run right now.')
                  );
                }
              })();
            }}
            onSignOut={() => {
              void (async () => {
                setArtifactGenerationProgress(null);
                setArtifactGenerationError(null);
                artifactDeployRequestRef.current = null;
                setArtifactGenerationRecovery(undefined);
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
