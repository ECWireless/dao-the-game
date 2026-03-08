import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { Agent, ArtifactBundle, HatRole, RunResult } from '../../../types';
import { buildMachineRoleLanes, hasRoleWithKeyword } from '../machineUtils';
import { usePannableViewport } from '../usePannableViewport';
import { MachinePreview } from './MachinePreview';
type MachineSceneProps = {
  studioName?: string;
  cycle: 1 | 2;
  roles: HatRole[];
  agents: Agent[];
  canRun: boolean;
  hasRun: boolean;
  latestRun?: RunResult;
  latestArtifacts?: ArtifactBundle;
  onRun?: () => void | Promise<void>;
  onContinue?: () => void;
  onLockChange?: (isLocked: boolean) => void;
  isReadOnly?: boolean;
};

type PositionedRoleLane = ReturnType<typeof buildMachineRoleLanes>[number] & {
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

export function MachineScene({
  studioName,
  cycle,
  roles,
  agents,
  canRun,
  hasRun,
  latestRun,
  latestArtifacts,
  onRun,
  onContinue,
  onLockChange,
  isReadOnly = false
}: MachineSceneProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [packetIndex, setPacketIndex] = useState(0);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const roleLanes = useMemo(() => buildMachineRoleLanes(roles, agents), [agents, roles]);
  const hasDesigner = hasRoleWithKeyword(roles, 'design');
  const hasReviewer = hasRoleWithKeyword(roles, 'review');
  const hasDeploymentRole = hasRoleWithKeyword(roles, 'deploy');
  const deploymentTone = !hasDesigner || !hasReviewer ? 'rough' : 'polished';
  const heroTitle = latestArtifacts?.siteTitle ?? 'Pending deployable';
  const heroUrl = latestArtifacts?.publicUrl ?? 'Output rail locked until first run';
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
  const packetPosition = packetStops[safePacketIndex] ?? packetStops[0];
  const packetEnergy = packetStops.length > 1 ? 0.4 + safePacketIndex / (packetStops.length - 1) * 0.8 : 0.7;
  const isOutputReady = hasRun && !isRunning;
  const packetStyle = {
    left: `${packetPosition.x}px`,
    top: `${packetPosition.y}px`,
    '--packet-glow': `${0.6 + packetEnergy * 0.9}rem`,
    '--packet-scale': `${1 + packetEnergy * 0.08}`
  } as CSSProperties;
  const statusLabel = isRunning
    ? safePacketIndex === 0
      ? 'Client requirements loaded'
      : safePacketIndex === 1
        ? 'Root node shaping request'
        : safePacketIndex === lastPacketIndex
          ? 'Output node fabricating creation'
          : `${roleNodes[safePacketIndex - 2]?.roleName ?? 'Role'} processing`
    : hasRun
      ? 'Creation routed to output node'
      : 'Assembly line armed';
  const statusDetail = isRunning
    ? safePacketIndex <= 1
      ? 'Requirements are being piped through the studio chassis.'
      : safePacketIndex === lastPacketIndex
        ? 'The final creation is being compressed and pushed into the output node.'
        : `${roleNodes[safePacketIndex - 2]?.operatorName ?? 'Machine core'} is actively shaping this pass.`
    : hasRun
      ? latestRun?.events[latestRun.events.length - 1] ?? 'The line has cooled and the deploy preview is latched open.'
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
    onLockChange?.(isRunning);

    return () => {
      onLockChange?.(false);
    };
  }, [isRunning, onLockChange]);

  useEffect(() => {
    if (isRunning) {
      return;
    }

    setPacketIndex(hasRun ? lastPacketIndex : 0);
  }, [hasRun, isRunning, lastPacketIndex]);

  useEffect(() => {
    if (!isRunning || isReadOnly) {
      return;
    }

    const timer = window.setInterval(() => {
      setPacketIndex((current) => {
        if (current >= lastPacketIndex) {
          window.clearInterval(timer);
          return current;
        }

        return current + 1;
      });
    }, 860);

    return () => {
      window.clearInterval(timer);
    };
  }, [isReadOnly, isRunning, lastPacketIndex]);

  useEffect(() => {
    if (!isRunning || isReadOnly || packetIndex < lastPacketIndex || !onRun) {
      return;
    }

    const finalize = window.setTimeout(async () => {
      await onRun();
      setIsRunning(false);
      setIsPreviewVisible(false);
    }, 720);

    return () => {
      window.clearTimeout(finalize);
    };
  }, [isReadOnly, isRunning, lastPacketIndex, onRun, packetIndex]);

  useEffect(() => {
    if (!isRunning || isDragging) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      focusViewportOnPoint(packetPosition.x, packetPosition.y, safePacketIndex === 0 ? 'auto' : 'smooth');
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [focusViewportOnPoint, isDragging, isRunning, packetPosition.x, packetPosition.y, safePacketIndex]);

  return (
    <section className="scene-body machine-assembly-scene">
      <section className="machine-assembly-header">
        <div>
          <p className="machine-assembly-kicker">Machine companion • cycle {cycle}</p>
          <h2 className="machine-assembly-title">{studioName || 'Unnamed Studio'} assembly line</h2>
        </div>
        <span className={`machine-assembly-pill ${isRunning ? 'is-running' : hasRun ? 'is-ready' : 'is-armed'}`}>
          {isRunning ? 'Deploying' : hasRun ? 'Creation Ready' : 'Armed'}
        </span>
      </section>

      <section className={`machine-board-shell ${isOutputReady ? 'is-complete' : ''}`}>
        <div
          className={`machine-board-viewport ${isDragging ? 'is-dragging' : ''}`}
          ref={viewportRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        >
          <div className="machine-board-canvas" aria-label="Machine assembly tree">
            <svg className="machine-board-pipes" viewBox="0 0 1560 440" aria-hidden="true">
              {pipeSegments.map((segment, index) => {
                const segmentState = isRunning
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
                  <g key={segment.id} className={`machine-pipe is-${segmentState}`}>
                    <path className="machine-pipe-shell" d={linePath} />
                    <path className="machine-pipe-core" d={linePath} />
                    <path className="machine-pipe-flow" d={linePath} />
                  </g>
                );
              })}
            </svg>

            <div className="machine-packet" style={packetStyle}>
              <span />
            </div>

            <div
              className={`machine-node machine-node-input ${isRunning && safePacketIndex === 0 ? 'is-active' : safePacketIndex > 0 ? 'is-processed' : ''}`}
              style={{ left: `${sourceNode.x}px`, top: `${sourceNode.y}px` }}
            >
              <span className="machine-node-kicker">Client requirements</span>
              <span className="machine-node-title">Input feed</span>
              <span className="machine-node-meta">Raw brief enters the line</span>
            </div>

            <div
              className={`machine-node machine-node-root ${safePacketIndex >= 1 ? 'is-active' : ''}`}
              style={{ left: `${rootNode.x}px`, top: `${rootNode.y}px` }}
            >
              <span className="machine-node-kicker">Studio root</span>
              <span className="machine-node-title">{studioName || 'Unnamed Studio'}</span>
              <span className="machine-node-meta">Machine routes through your org</span>
            </div>

            {roleNodes.map((node, index) => {
              const nodeState = isRunning
                ? safePacketIndex > index + 2
                  ? 'is-processed'
                  : safePacketIndex === index + 2
                    ? 'is-active'
                    : ''
                : hasRun
                  ? 'is-processed'
                  : '';

              return (
                <div
                  key={node.id}
                  className={`machine-node machine-node-role ${nodeState}`}
                  style={{ left: `${node.x}px`, top: `${node.y}px` }}
                >
                  <span className="machine-node-kicker">{node.roleName}</span>
                  <span className="machine-node-title">{node.operatorName}</span>
                  <span className="machine-node-meta">{node.operatorMeta}</span>
                </div>
              );
            })}

            <button
              className={`machine-node machine-node-output ${isOutputReady ? 'is-actionable is-ready' : ''}`}
              type="button"
              data-pan-block="true"
              style={{ left: `${outputNode.x}px`, top: `${outputNode.y}px` }}
              disabled={!hasRun || isReadOnly}
              onClick={() => setIsPreviewVisible(true)}
            >
              <span className="machine-node-kicker">Output node</span>
              <span className="machine-node-title">
                {isOutputReady
                  ? isPreviewVisible
                    ? 'Preview Loaded'
                    : 'Preview Ready'
                  : isRunning
                    ? 'Fabricating...'
                    : 'Awaiting build'}
              </span>
              <span className="machine-node-meta">
                {isOutputReady ? 'Open the deployed site preview' : 'Finished builds land here'}
              </span>
              {isOutputReady ? (
                <span className="machine-node-callout">{isPreviewVisible ? 'Preview open' : 'Open deploy'}</span>
              ) : null}
            </button>
          </div>
        </div>

        <div className="machine-board-hud">
          <span>{statusLabel}</span>
          <span>{statusDetail}</span>
        </div>
      </section>

      {!hasRun && !isReadOnly ? (
        <button
          className="primary-action machine-run-button"
          type="button"
          disabled={!canRun || isRunning || !onRun}
          onClick={() => {
            setIsPreviewVisible(false);
            setIsRunning(true);
            setPacketIndex(0);
          }}
        >
          {isRunning ? 'Deploying...' : 'Deploy Through Machine'}
        </button>
      ) : null}

      {isPreviewVisible && hasRun ? (
        <MachinePreview
          deploymentTone={deploymentTone}
          heroTitle={heroTitle}
          heroUrl={heroUrl}
          latestRun={latestRun}
          latestArtifacts={latestArtifacts}
          capabilityGaps={capabilityGaps}
          isReadOnly={isReadOnly}
          onContinue={onContinue}
        />
      ) : null}
    </section>
  );
}
