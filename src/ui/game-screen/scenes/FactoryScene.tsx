import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { ArtifactGenerationRecovery } from '../../../contracts/gameState';
import { hasPipelineStage } from '../../../pipeline';
import type { Agent, ArtifactBundle, Brief, HatRole, RunResult } from '../../../types';
import type { ArtifactGenerationProgress } from '../types';
import { buildFactoryRoleLanes } from '../factoryUtils';
import { usePannableViewport } from '../usePannableViewport';
import { FactoryPreview } from './FactoryPreview';
import { FactoryRequirementsSheet } from './FactoryRequirementsSheet';
import { FactoryWorkerSheet } from './FactoryWorkerSheet';
type FactorySceneProps = {
  studioName?: string;
  brief: Brief;
  cycle: 1 | 2;
  roles: HatRole[];
  agents: Agent[];
  canRun: boolean;
  hasRun: boolean;
  latestRun?: RunResult;
  latestArtifacts?: ArtifactBundle;
  previousRun?: RunResult;
  artifactGenerationProgress?: ArtifactGenerationProgress | null;
  artifactGenerationError?: string | null;
  artifactGenerationRecovery?: ArtifactGenerationRecovery | null;
  onRetryArtifactGeneration?: () => void | Promise<void>;
  isRetryingArtifactGeneration?: boolean;
  onRun?: () => void | Promise<void>;
  onContinue?: () => void;
  onLockChange?: (isLocked: boolean) => void;
  isReadOnly?: boolean;
};

type PositionedRoleLane = ReturnType<typeof buildFactoryRoleLanes>[number] & {
  x: number;
  y: number;
  width: number;
  height: number;
};

type PipeSegment = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export function FactoryScene({
  studioName,
  brief,
  cycle,
  roles,
  agents,
  canRun,
  hasRun,
  latestRun,
  latestArtifacts,
  previousRun,
  artifactGenerationProgress = null,
  artifactGenerationError = null,
  artifactGenerationRecovery = null,
  onRetryArtifactGeneration,
  isRetryingArtifactGeneration = false,
  onRun,
  onContinue,
  onLockChange,
  isReadOnly = false
}: FactorySceneProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [packetIndex, setPacketIndex] = useState(0);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isRequirementsVisible, setIsRequirementsVisible] = useState(false);
  const [openTraceStageId, setOpenTraceStageId] = useState<PositionedRoleLane['stageId'] | null>(null);
  const hasTriggeredRunRef = useRef(false);
  const hasSettledOnOutputRef = useRef(false);
  const roleLanes = useMemo(() => buildFactoryRoleLanes(roles, agents), [agents, roles]);
  const workerTraceByStageId = useMemo(
    () => new Map((latestArtifacts?.workerTrace ?? []).map((trace) => [trace.stageId, trace])),
    [latestArtifacts?.workerTrace]
  );
  const hasDesigner = hasPipelineStage(roles, 'design');
  const hasReviewer = hasPipelineStage(roles, 'review');
  const hasDeploymentRole = hasPipelineStage(roles, 'deployment');
  const isRecoveryInterrupted = artifactGenerationRecovery?.status === 'pending';
  const deploymentTone = !hasDesigner || !hasReviewer ? 'rough' : 'polished';
  const isPipelineRunning = isRunning || Boolean(artifactGenerationProgress);
  const heroTitle =
    latestArtifacts?.siteTitle ??
    (isRecoveryInterrupted
      ? 'Assembly interrupted'
      : artifactGenerationError
        ? 'Assembly failed'
        : 'Pending deployable');
  const heroUrl =
    latestArtifacts?.publicUrl ??
    (latestArtifacts?.cid
      ? `ipfs://${latestArtifacts.cid}`
      : artifactGenerationError
        ? 'No artifact available'
        : latestArtifacts?.siteDocument
        ? 'Pinning assembled site to IPFS...'
        : 'Output rail locked until first run');
  const latestPipeline = latestRun?.pipeline;
  const weakestStage = latestPipeline?.stages.find((stage) => stage.id === latestPipeline.weakestStageId);
  const latestEvent = latestRun?.events.at(-1);
  const capabilityGaps = [
    !hasDesigner ? 'No design pass' : null,
    !hasReviewer ? 'No QA pass' : null,
    !hasDeploymentRole ? 'No deployment specialist' : null
  ].filter(Boolean) as string[];
  const sourceNode = { x: 48, y: 198, width: 150, height: 66 };
  const rootNode = { x: 222, y: 188, width: 200, height: 82 };
  const roleNodes: PositionedRoleLane[] = roleLanes.map((lane, index) => ({
    ...lane,
    x: 476 + index * 214,
    y: 202,
    width: 176,
    height: 56
  }));
  const lastRoleNode = roleNodes[roleNodes.length - 1];
  const outputNode = {
    x: lastRoleNode ? lastRoleNode.x + 214 : 690,
    y: 195,
    width: 170,
    height: 70
  };
  const packetStops = [
    {
      x: sourceNode.x + sourceNode.width / 2,
      y: sourceNode.y + sourceNode.height / 2
    },
    {
      x: rootNode.x + rootNode.width / 2,
      y: rootNode.y + rootNode.height / 2
    },
    ...roleNodes.map((node) => ({
      x: node.x + node.width / 2,
      y: node.y + node.height / 2
    })),
    {
      x: outputNode.x + outputNode.width / 2,
      y: outputNode.y + outputNode.height / 2
    }
  ];
  const lastPacketIndex = packetStops.length - 1;
  const safePacketIndex = Math.max(0, Math.min(packetIndex, lastPacketIndex));
  const activeGenerationRoleIndex =
    artifactGenerationProgress?.phase === 'worker'
      ? roleNodes.findIndex((node) => node.stageId === artifactGenerationProgress.stageId)
      : -1;
  const runningTargetPacketIndex = artifactGenerationProgress?.phase === 'publishing'
    ? lastPacketIndex
    : activeGenerationRoleIndex >= 0
      ? activeGenerationRoleIndex + 2
      : roleNodes.length > 0
        ? 2
        : 1;
  const packetPosition = packetStops[safePacketIndex] ?? packetStops[0];
  const packetEnergy = packetStops.length > 1 ? 0.4 + safePacketIndex / (packetStops.length - 1) * 0.8 : 0.7;
  const isMissingOutput = hasRun && !isPipelineRunning && !latestArtifacts;
  const isOutputReady = hasRun && !isPipelineRunning && Boolean(latestArtifacts);
  const isOutputErrored = isMissingOutput && (Boolean(artifactGenerationError) || !isReadOnly);
  const hasRecoverableOutput =
    hasRun &&
    !isPipelineRunning &&
    (!latestArtifacts || Boolean(artifactGenerationRecovery)) &&
    Boolean(onRetryArtifactGeneration) &&
    !isReadOnly;
  const recoveryActionLabel =
    artifactGenerationRecovery?.status === 'pending' ? 'Re-run assembly' : 'Retry assembly';
  const recoveryHeading =
    artifactGenerationRecovery?.status === 'pending'
      ? 'Assembly interrupted'
      : !latestArtifacts && !artifactGenerationError
        ? 'Output missing'
        : 'Assembly failed';
  const recoveryDetail =
    artifactGenerationError ??
    (artifactGenerationRecovery?.status === 'pending'
      ? 'The build was interrupted before the site reached the output node.'
      : !latestArtifacts
        ? 'The output is missing for this completed cycle. Re-run the assembly to restore it.'
        : 'Assembly failed before a public-facing site could be routed to the output node.');
  const openTrace = openTraceStageId ? workerTraceByStageId.get(openTraceStageId) ?? null : null;
  const packetStyle = {
    left: `${packetPosition.x}px`,
    top: `${packetPosition.y}px`,
    '--packet-glow': `${0.6 + packetEnergy * 0.9}rem`,
    '--packet-scale': `${1 + packetEnergy * 0.08}`
  } as CSSProperties;
  const statusLabel = isPipelineRunning
    ? artifactGenerationProgress?.phase === 'worker'
      ? `${roleNodes[activeGenerationRoleIndex]?.stageLabel ?? roleNodes[activeGenerationRoleIndex]?.roleName ?? 'Worker'} assembling`
      : artifactGenerationProgress?.phase === 'publishing'
        ? 'Publishing deploy'
        : safePacketIndex === 0
          ? 'Client requirements loaded'
          : safePacketIndex === 1
            ? 'Root node shaping request'
            : `${roleNodes[safePacketIndex - 2]?.stageLabel ?? roleNodes[safePacketIndex - 2]?.roleName ?? 'Stage'} processing`
    : hasRun
      ? isRecoveryInterrupted
        ? 'Assembly interrupted'
        : artifactGenerationError
          ? 'Assembly failed'
        : latestPipeline
          ? latestRun?.passed
            ? `${latestPipeline.coveredStageCount}/${latestPipeline.order.length} stages stabilized`
            : `${weakestStage?.label ?? 'Pipeline'} needs reinforcement`
          : 'Creation routed to output node'
      : 'Assembly line armed';
  const statusDetail = isPipelineRunning
    ? artifactGenerationProgress?.note ??
      (safePacketIndex <= 1
        ? 'Requirements are being piped through the studio chassis.'
        : safePacketIndex === lastPacketIndex
          ? 'The final creation is being compressed and pushed into the output node.'
          : `${roleNodes[safePacketIndex - 2]?.operatorName ?? 'Factory core'} is actively shaping the ${roleNodes[safePacketIndex - 2]?.stageLabel?.toLowerCase() ?? 'current'} pass.`)
    : hasRun
      ? artifactGenerationError ??
        weakestStage?.note ??
        latestEvent ??
        'The line stalled before a public-facing site could be assembled.'
      : `Ready to route through ${roleLanes.length} linked role ${roleLanes.length === 1 ? 'node' : 'nodes'}.`;
  const sharedRoleCenterY = roleNodes[0]?.y ? roleNodes[0].y + roleNodes[0].height / 2 : rootNode.y + rootNode.height / 2;
  const pipeSegments: PipeSegment[] = [
    {
      id: 'source-root',
      x1: sourceNode.x + sourceNode.width,
      y1: sourceNode.y + sourceNode.height / 2,
      x2: rootNode.x,
      y2: rootNode.y + rootNode.height / 2
    },
    {
      id: 'root-role',
      x1: rootNode.x + rootNode.width,
      y1: rootNode.y + rootNode.height / 2,
      x2: roleNodes[0]?.x ?? rootNode.x + rootNode.width + 54,
      y2: sharedRoleCenterY
    },
    ...roleNodes.slice(0, -1).map((node, index) => ({
      id: `role-${node.id}-next`,
      x1: node.x + node.width,
      y1: node.y + node.height / 2,
      x2: roleNodes[index + 1].x,
      y2: roleNodes[index + 1].y + roleNodes[index + 1].height / 2
    })),
    {
      id: 'role-output',
      x1: (lastRoleNode?.x ?? rootNode.x) + (lastRoleNode?.width ?? rootNode.width),
      y1: (lastRoleNode?.y ?? rootNode.y) + (lastRoleNode?.height ?? rootNode.height) / 2,
      x2: outputNode.x,
      y2: outputNode.y + outputNode.height / 2
    }
  ];
  const centerViewport = useCallback((viewport: HTMLDivElement) => {
    const desiredLeft = rootNode.x - viewport.clientWidth * 0.18;
    const desiredTop = rootNode.y - viewport.clientHeight * 0.2;
    const maxLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const maxTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight);

    viewport.scrollLeft = Math.max(0, Math.min(desiredLeft, maxLeft));
    viewport.scrollTop = Math.max(0, Math.min(desiredTop, maxTop));
  }, [rootNode.x, rootNode.y]);
  const {
    viewportRef,
    isDragging,
    focusViewportOnPoint,
    handlePointerDown,
    handlePointerMove,
    handlePointerEnd
  } = usePannableViewport(centerViewport);

  useEffect(() => {
    onLockChange?.(isPipelineRunning);

    return () => {
      onLockChange?.(false);
    };
  }, [isPipelineRunning, onLockChange]);

  useEffect(() => {
    if (isPipelineRunning) {
      return;
    }

    setPacketIndex(hasRun ? lastPacketIndex : 0);
  }, [hasRun, isPipelineRunning, lastPacketIndex]);

  useEffect(() => {
    if (!isPipelineRunning || isReadOnly) {
      return;
    }

    const timer = window.setInterval(() => {
      setPacketIndex((current) => {
        if (current >= runningTargetPacketIndex) {
          return current;
        }

        return current + 1;
      });
    }, 860);

    return () => {
      window.clearInterval(timer);
    };
  }, [isPipelineRunning, isReadOnly, runningTargetPacketIndex]);

  useEffect(() => {
    if (!isRunning || isReadOnly || !onRun) {
      return;
    }

    if (hasTriggeredRunRef.current) {
      return;
    }

    hasTriggeredRunRef.current = true;

    void (async () => {
      try {
        await onRun();
      } finally {
        setIsRunning(false);
        setIsPreviewVisible(false);
      }
    })();
  }, [isReadOnly, isRunning, onRun]);

  useEffect(() => {
    if (isPipelineRunning) {
      hasSettledOnOutputRef.current = false;
    }
  }, [isPipelineRunning]);

  useEffect(() => {
    if (isDragging) {
      return;
    }

    const shouldFollowPacket = isPipelineRunning;

    if (!shouldFollowPacket) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      focusViewportOnPoint(
        packetPosition.x,
        packetPosition.y,
        safePacketIndex === 0 ? 'auto' : 'smooth'
      );
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [
    focusViewportOnPoint,
    hasRun,
    isDragging,
    isPipelineRunning,
    lastPacketIndex,
    packetPosition.x,
    packetPosition.y,
    safePacketIndex
  ]);

  useEffect(() => {
    if (
      isDragging ||
      isPipelineRunning ||
      !hasRun ||
      safePacketIndex !== lastPacketIndex ||
      hasSettledOnOutputRef.current
    ) {
      return;
    }

    hasSettledOnOutputRef.current = true;

    const frame = window.requestAnimationFrame(() => {
      focusViewportOnPoint(packetPosition.x, packetPosition.y, 'smooth');
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [
    focusViewportOnPoint,
    hasRun,
    isDragging,
    isPipelineRunning,
    lastPacketIndex,
    packetPosition.x,
    packetPosition.y,
    safePacketIndex
  ]);

  useEffect(() => {
    if (!isPipelineRunning) {
      return;
    }

    setIsRequirementsVisible(false);
    setOpenTraceStageId(null);
  }, [isPipelineRunning]);

  useEffect(() => {
    if (artifactGenerationProgress?.phase !== 'starting') {
      return;
    }

    hasSettledOnOutputRef.current = false;
    setIsPreviewVisible(false);
    setIsRequirementsVisible(false);
    setOpenTraceStageId(null);
    setPacketIndex(0);

    const frame = window.requestAnimationFrame(() => {
      focusViewportOnPoint(
        sourceNode.x + sourceNode.width / 2,
        sourceNode.y + sourceNode.height / 2,
        'auto'
      );
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [
    artifactGenerationProgress?.phase,
    focusViewportOnPoint,
    sourceNode.height,
    sourceNode.width,
    sourceNode.x,
    sourceNode.y
  ]);

  const handleRetryGeneration = useCallback(async () => {
    hasSettledOnOutputRef.current = false;
    setIsPreviewVisible(false);
    setIsRequirementsVisible(false);
    setOpenTraceStageId(null);
    setPacketIndex(0);

    await onRetryArtifactGeneration?.();
  }, [onRetryArtifactGeneration]);

  return (
    <section className="scene-body factory-assembly-scene">
      <section className="factory-assembly-header">
        {isPreviewVisible ? (
          <div className="factory-assembly-actions">
            <button className="factory-assembly-close" type="button" onClick={() => setIsPreviewVisible(false)}>
              <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
                <path
                  d="M7.75 2.25 4 6l3.75 3.75"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
              <span>Back to Assembly</span>
            </button>
          </div>
        ) : null}
        <div className="factory-assembly-copy">
          <p className="factory-assembly-kicker">Factory • cycle {cycle}</p>
          <h2 className="factory-assembly-title">{studioName || 'Unnamed Studio'} assembly line</h2>
        </div>
      </section>

      <section className={`factory-board-shell ${isOutputReady ? 'is-complete' : ''}`}>
        <div
          className={`factory-board-viewport ${isDragging ? 'is-dragging' : ''}`}
          ref={viewportRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        >
          <div className="factory-board-canvas" aria-label="Factory assembly tree">
            <svg className="factory-board-pipes" viewBox="0 0 1560 440" aria-hidden="true">
              {pipeSegments.map((segment, index) => {
                const segmentState = isPipelineRunning
                  ? safePacketIndex > index + 1
                    ? 'done'
                    : safePacketIndex === index + 1
                      ? 'active'
                      : 'idle'
                  : hasRun
                    ? 'done'
                    : 'idle';
                const linePath = `M ${segment.x1} ${segment.y1} L ${segment.x2} ${segment.y2}`;

                return (
                  <g key={segment.id} className={`factory-pipe is-${segmentState}`}>
                    <path className="factory-pipe-shell" d={linePath} />
                    <path className="factory-pipe-core" d={linePath} />
                    <path className="factory-pipe-flow" d={linePath} />
                  </g>
                );
              })}
            </svg>

            <div className="factory-packet" style={packetStyle}>
              <span />
            </div>

            <button
              className={`factory-node factory-node-input is-actionable ${isRunning && safePacketIndex === 0 ? 'is-active' : safePacketIndex > 0 ? 'is-processed' : ''}`}
              type="button"
              data-pan-block="true"
              style={{ left: `${sourceNode.x}px`, top: `${sourceNode.y}px` }}
              onClick={() => setIsRequirementsVisible(true)}
            >
              <span className="factory-node-kicker">Client requirements</span>
              <span className="factory-node-title">Brief intake</span>
              <span className="factory-node-meta">Tap to inspect the conference brief</span>
            </button>

            <div
              className={`factory-node factory-node-root ${safePacketIndex >= 1 ? 'is-active' : ''}`}
              style={{ left: `${rootNode.x}px`, top: `${rootNode.y}px` }}
            >
              <span className="factory-node-kicker">Studio root</span>
              <span className="factory-node-title">{studioName || 'Unnamed Studio'}</span>
              <span className="factory-node-meta">Factory routes through your org</span>
            </div>

            {roleNodes.map((node, index) => {
              const nodeState = isPipelineRunning
                ? safePacketIndex > index + 2
                  ? 'is-processed'
                  : safePacketIndex === index + 2
                    ? 'is-active'
                    : ''
                : hasRun
                  ? 'is-processed'
                  : '';
              const trace = node.stageId ? workerTraceByStageId.get(node.stageId) : undefined;
              const isTraceAvailable = Boolean(trace);

              return (
                <button
                  key={node.id}
                  className={`factory-node factory-node-role ${nodeState} ${isTraceAvailable ? 'is-actionable' : ''}`}
                  type="button"
                  data-pan-block={isTraceAvailable || undefined}
                  style={{ left: `${node.x}px`, top: `${node.y}px` }}
                  disabled={!isTraceAvailable}
                  onClick={() => {
                    if (!node.stageId || !isTraceAvailable) {
                      return;
                    }

                    setOpenTraceStageId(node.stageId);
                  }}
                >
                  <span className="factory-node-kicker">{node.roleName}</span>
                  <span className="factory-node-title">{node.operatorName}</span>
                  <span className="factory-node-meta">{node.operatorMeta}</span>
                </button>
              );
            })}

            <button
              className={`factory-node factory-node-output ${isOutputReady || isOutputErrored ? 'is-actionable' : ''} ${isOutputReady ? 'is-ready' : ''} ${isOutputErrored ? 'is-error' : ''}`}
              type="button"
              data-pan-block="true"
              style={{ left: `${outputNode.x}px`, top: `${outputNode.y}px` }}
              disabled={!hasRun || isReadOnly}
              onClick={() => setIsPreviewVisible(true)}
            >
              <span className="factory-node-kicker">Output node</span>
              <span className="factory-node-title">
                {isOutputReady
                  ? isPreviewVisible
                    ? 'Preview Loaded'
                    : 'Preview Ready'
                  : isOutputErrored
                    ? isRecoveryInterrupted
                      ? 'Assembly interrupted'
                      : 'Assembly failed'
                  : artifactGenerationProgress?.phase === 'publishing'
                    ? 'Publishing...'
                    : isPipelineRunning
                    ? 'Fabricating...'
                    : 'Awaiting build'}
              </span>
              <span className="factory-node-meta">
                {isOutputReady
                  ? 'Open the deployed site preview'
                  : isOutputErrored
                    ? isRecoveryInterrupted
                      ? 'Open the interruption state and re-run assembly'
                      : 'Open the error state and retry assembly'
                    : 'Finished builds land here'}
              </span>
              {isOutputReady || isOutputErrored ? (
                <span className="factory-node-callout">
                  {isOutputReady
                    ? isPreviewVisible
                      ? 'Preview open'
                      : 'Open deploy'
                    : isRecoveryInterrupted
                      ? 'Recover'
                      : 'Retry'}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        <div className="factory-board-hud">
          <span>{statusLabel}</span>
          <span>{statusDetail}</span>
        </div>
      </section>

      {!hasRun && !isReadOnly ? (
        <button
          className="primary-action factory-run-button"
          type="button"
          disabled={!canRun || isPipelineRunning || !onRun}
          onClick={() => {
            hasTriggeredRunRef.current = false;
            setIsPreviewVisible(false);
            setIsRunning(true);
            setPacketIndex(0);
          }}
        >
          {isRunning ? 'Deploying...' : 'Deploy Through Factory'}
        </button>
      ) : null}

      {hasRecoverableOutput && !isPreviewVisible ? (
        <section className="factory-recovery-banner">
          <div className="factory-recovery-copy">
            <p className="factory-recovery-kicker">{recoveryHeading}</p>
            <p>{recoveryDetail}</p>
          </div>
          <button
            className="primary-action factory-recovery-button"
            type="button"
            onClick={() => void handleRetryGeneration()}
            disabled={isRetryingArtifactGeneration}
          >
            {isRetryingArtifactGeneration ? 'Rerouting...' : recoveryActionLabel}
          </button>
        </section>
      ) : null}

      {isPreviewVisible && hasRun ? (
        <FactoryPreview
          deploymentTone={deploymentTone}
          heroTitle={heroTitle}
          heroUrl={heroUrl}
          cycle={cycle}
          latestRun={latestRun}
          latestArtifacts={latestArtifacts}
          previousRun={previousRun}
          generationError={artifactGenerationError ?? (hasRecoverableOutput ? recoveryDetail : null)}
          recoveryStatus={artifactGenerationRecovery?.status ?? null}
          capabilityGaps={capabilityGaps}
          isReadOnly={isReadOnly}
          onRetryGeneration={handleRetryGeneration}
          isRetryingGeneration={isRetryingArtifactGeneration}
          onContinue={onContinue}
        />
      ) : null}

      {isRequirementsVisible ? (
        <FactoryRequirementsSheet brief={brief} onClose={() => setIsRequirementsVisible(false)} />
      ) : null}
      {openTrace ? <FactoryWorkerSheet trace={openTrace} onClose={() => setOpenTraceStageId(null)} /> : null}
    </section>
  );
}
