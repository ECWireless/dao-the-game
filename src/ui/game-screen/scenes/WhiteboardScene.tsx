import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from 'react';
import type { Agent, HatRole } from '../../../types';
import { findRaidGuildMember, getRaidGuildCandidatesForRole } from '../guildData';
import {
  WhiteboardEdgeCue,
  WhiteboardHud,
  WhiteboardIntegrateCard
} from '../components/WhiteboardChrome';
import { WhiteboardSheet } from '../components/WhiteboardSheet';
import {
  buildWhiteboardLinks,
  getWhiteboardBranchTriggerPosition,
  getWhiteboardRolePosition,
  sortWhiteboardRoles,
  WHITEBOARD_ROLE_BLUEPRINTS
} from '../whiteboardBlueprints';

type WhiteboardSceneProps = {
  roles: HatRole[];
  agents?: Agent[];
  studioName: string;
  isExpanded: boolean;
  isReadOnly?: boolean;
  onSetStudioName?: (name: string) => void;
  onConfigureRole?: (roleId: string, name: string) => void;
  onAssignCandidateToRole?: (roleId: string, agentId: string) => void;
  onComplete?: () => void;
  autoAdvanceOnReady?: boolean;
};

type SheetMode = 'studio' | 'role' | 'integrate' | null;
type CueState = { side: 'left' | 'right'; top: number; angle: number } | null;

const STUDIO_NAME_LIMIT = 20;
const DEFAULT_ROLE_NAME = WHITEBOARD_ROLE_BLUEPRINTS[0].label;
const CUE_SIZE = 32;
const CUE_MARGIN = 9;
const DRAG_START_THRESHOLD = 6;

function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(value, max)); }

export function WhiteboardScene({
  roles,
  agents = [],
  studioName,
  isExpanded,
  isReadOnly = false,
  onSetStudioName,
  onConfigureRole,
  onAssignCandidateToRole,
  onComplete,
  autoAdvanceOnReady = false
}: WhiteboardSceneProps) {
  const firstRole = roles[0];
  const firstRoleReady = Boolean(firstRole?.isConfigured);
  const configuredRoleCount = roles.filter((role) => role.isConfigured).length;
  const isInteractive = !isReadOnly;
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);
  const [activeRoleId, setActiveRoleId] = useState<string | null>(null);
  const [stagedRoleCount, setStagedRoleCount] = useState(Math.max(configuredRoleCount, firstRoleReady ? 1 : 0));
  const [studioDraft, setStudioDraft] = useState(studioName);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [cueState, setCueState] = useState<CueState>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImportSelecting, setIsImportSelecting] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const branchTriggerRef = useRef<HTMLButtonElement | null>(null);
  const nodeRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const dragRef = useRef<{ pointerId: number; originX: number; originY: number; startX: number; startY: number; hasMoved: boolean } | null>(null);
  const suppressClickUntilRef = useRef(0);

  useEffect(() => setStudioDraft(studioName), [studioName]);

  useEffect(() => {
    const minimumVisibleRoles = Math.max(configuredRoleCount, firstRoleReady ? 1 : 0);
    if (minimumVisibleRoles > stagedRoleCount) {
      setStagedRoleCount(minimumVisibleRoles);
      return;
    }
    if (!studioName && configuredRoleCount === 0 && stagedRoleCount !== 0) setStagedRoleCount(0);
  }, [configuredRoleCount, firstRoleReady, stagedRoleCount, studioName]);

  const studioReady = studioDraft.trim().length >= 2;
  const canOpenStudio = !studioName && isInteractive && Boolean(onSetStudioName);
  const visibleRoleCount = isExpanded ? Math.min(stagedRoleCount, roles.length) : firstRoleReady || stagedRoleCount > 0 ? 1 : 0;
  const visibleRoles = sortWhiteboardRoles(roles.slice(0, visibleRoleCount), isExpanded);
  const allVisibleRolesConfigured = visibleRoles.every((role) => role.isConfigured);
  const nextRole = roles[visibleRoleCount];
  const canAddBranch = Boolean(studioName) && isInteractive && (isExpanded ? Boolean(nextRole) : visibleRoleCount === 0 && Boolean(firstRole));
  const importableRoles = useMemo(
    () => sortWhiteboardRoles(roles.filter((role) => role.isConfigured && !role.assignedAgentId), isExpanded),
    [isExpanded, roles]
  );
  const canIntegrateGuild = isInteractive && Boolean(onAssignCandidateToRole) && importableRoles.length > 0;
  const currentImportTargetRole = isImportSelecting ? importableRoles[0] : null;
  const currentImportTargetRoleId = currentImportTargetRole?.id ?? null;
  const activeRole = roles.find((role) => role.id === activeRoleId) ?? null;
  const activeRoleIndex = activeRole ? roles.findIndex((role) => role.id === activeRole.id) : -1;
  const activeRoleBlueprint = activeRoleIndex >= 0 ? WHITEBOARD_ROLE_BLUEPRINTS[activeRoleIndex] ?? WHITEBOARD_ROLE_BLUEPRINTS[WHITEBOARD_ROLE_BLUEPRINTS.length - 1] : null;
  const guildCandidates = activeRole ? getRaidGuildCandidatesForRole(agents, activeRole.id, 2) : [];
  const candidateOptions = guildCandidates.flatMap((candidate) => {
    const agent = candidate.agentId ? agents.find((item) => item.id === candidate.agentId) : undefined;
    return agent && candidate.agentId
      ? [{
          ...candidate,
          agentId: candidate.agentId,
          roleAffinity: candidate.affinityLabel ?? agent.roleAffinity,
          reliability: agent.reliability,
          speed: agent.speed
        }]
      : [];
  });
  const boardLinks = buildWhiteboardLinks(visibleRoles, isExpanded);
  const addBranchPosition = getWhiteboardBranchTriggerPosition(isExpanded ? nextRole?.id : firstRole?.id, isExpanded);
  const boardOffsetClampX = isExpanded ? 320 : 220;
  const shouldAutoAdvanceExpanded = isInteractive && isExpanded && autoAdvanceOnReady && configuredRoleCount >= 3 && Boolean(onComplete);

  useEffect(() => { if (shouldAutoAdvanceExpanded) onComplete?.(); }, [onComplete, shouldAutoAdvanceExpanded]);
  useEffect(() => {
    if (!isInteractive) {
      if (isImportSelecting) {
        setIsImportSelecting(false);
      }
      return;
    }

    if (sheetMode) {
      return;
    }

    if (canIntegrateGuild && !isImportSelecting) {
      setIsImportSelecting(true);
      return;
    }

    if (!canIntegrateGuild && isImportSelecting) {
      setIsImportSelecting(false);
    }
  }, [canIntegrateGuild, isImportSelecting, isInteractive, sheetMode]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const target =
      sheetMode || !isInteractive
        ? null
        : currentImportTargetRoleId
          ? nodeRefs.current[currentImportTargetRoleId]
          : canAddBranch && allVisibleRolesConfigured && (!isExpanded || nextRole?.id !== 'hat-02')
            ? branchTriggerRef.current
            : null;
    if (!viewport || !target) {
      setCueState(null);
      return;
    }
    const viewportRect = viewport.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const padding = 12;
    const fullyVisible =
      targetRect.left >= viewportRect.left + padding &&
      targetRect.right <= viewportRect.right - padding &&
      targetRect.top >= viewportRect.top + padding &&
      targetRect.bottom <= viewportRect.bottom - padding;
    if (fullyVisible) {
      setCueState(null);
      return;
    }
    const side =
      targetRect.left < viewportRect.left + padding
        ? 'left'
        : targetRect.right > viewportRect.right - padding
          ? 'right'
          : null;
    if (!side) {
      setCueState(null);
      return;
    }
    const cueCenterX = side === 'left' ? CUE_MARGIN + CUE_SIZE / 2 : viewportRect.width - CUE_MARGIN - CUE_SIZE / 2;
    const targetCenterX = targetRect.left - viewportRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top - viewportRect.top + targetRect.height / 2;
    const cueCenterY = clamp(targetCenterY, CUE_SIZE / 2 + 12, viewportRect.height - CUE_SIZE / 2 - 12);
    setCueState({
      side,
      top: cueCenterY - CUE_SIZE / 2,
      angle: Math.atan2(targetCenterY - cueCenterY, targetCenterX - cueCenterX) * (180 / Math.PI)
    });
  }, [
    allVisibleRolesConfigured,
    canAddBranch,
    currentImportTargetRoleId,
    isExpanded,
    isInteractive,
    nextRole?.id,
    offset.x,
    offset.y,
    sheetMode,
    stagedRoleCount
  ]);

  const commitStudioName = () => {
    if (!canOpenStudio || !studioReady) return;
    onSetStudioName?.(studioDraft.trim());
    setSheetMode(null);
  };

  const commitRole = () => {
    if (!activeRole || activeRole.isConfigured || !onConfigureRole) return;
    onConfigureRole(activeRole.id, activeRoleBlueprint?.label ?? activeRole.name ?? DEFAULT_ROLE_NAME);
    setSheetMode(null);
    setActiveRoleId(null);
    if (!isExpanded) onComplete?.();
  };

  const commitCandidate = (agentId: string) => {
    if (!activeRole || !onAssignCandidateToRole) return;
    const remainingCount = importableRoles.filter((role) => role.id !== activeRole.id).length;
    onAssignCandidateToRole(activeRole.id, agentId);
    setSheetMode(null);
    setActiveRoleId(null);
    if (remainingCount === 0) {
      setIsImportSelecting(false);
      onComplete?.();
    }
  };

  const handleBoardPointerDown = (event: PointerEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, label')) return;
    dragRef.current = {
      pointerId: event.pointerId,
      originX: offset.x,
      originY: offset.y,
      startX: event.clientX,
      startY: event.clientY,
      hasMoved: false
    };
  };

  const handleBoardPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - dragRef.current.startX;
    const deltaY = event.clientY - dragRef.current.startY;
    if (!dragRef.current.hasMoved) {
      if (Math.hypot(deltaX, deltaY) < DRAG_START_THRESHOLD) {
        return;
      }
      dragRef.current.hasMoved = true;
      setIsDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    setOffset({
      x: clamp(dragRef.current.originX + deltaX, -boardOffsetClampX, boardOffsetClampX),
      y: clamp(dragRef.current.originY + deltaY, -150, 150)
    });
  };

  const handleBoardPointerEnd = (event: PointerEvent<HTMLElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    if (dragRef.current.hasMoved) {
      suppressClickUntilRef.current = window.performance.now() + 160;
    }
    dragRef.current = null;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleBoardClickCapture = (event: MouseEvent<HTMLElement>) => {
    if (window.performance.now() < suppressClickUntilRef.current) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return (
    <section className="scene-body whiteboard-scene">
      <section
        className={`whiteboard-shell ${isDragging ? 'is-dragging' : ''}`}
        onPointerDown={handleBoardPointerDown}
        onPointerMove={handleBoardPointerMove}
        onPointerUp={handleBoardPointerEnd}
        onPointerCancel={handleBoardPointerEnd}
        onClickCapture={handleBoardClickCapture}
      >
        <div className="whiteboard-viewport" ref={viewportRef}>
          <WhiteboardEdgeCue cueState={cueState} />
          <div className="whiteboard-canvas" style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }} aria-label="Org chart board">
            {visibleRoles.length > 0 ? <svg className="whiteboard-links" viewBox="0 0 920 520" aria-hidden="true">{boardLinks.map((path) => <path key={path} d={path} />)}</svg> : null}
            <button
              className={`tree-node tree-root ${studioName ? 'is-filled' : 'is-empty'} ${canOpenStudio ? 'is-actionable' : ''}`}
              type="button"
              data-drag-block={canOpenStudio || undefined}
              style={{ left: '274px', top: '44px' }}
              disabled={!canOpenStudio}
              onClick={() => setSheetMode('studio')}
            >
              <span className="tree-node-kicker">Studio Root</span>
              <span className="tree-node-title">{studioName || 'Name your studio'}</span>
              <span className="tree-node-meta">{studioName ? 'Studio active' : 'Tap to name studio'}</span>
            </button>
            {canAddBranch ? (
              <button
                ref={branchTriggerRef}
                className="tree-branch-trigger"
                type="button"
                data-drag-block="true"
                style={{ left: `${addBranchPosition.x}px`, top: `${addBranchPosition.y}px` }}
                onClick={() => setStagedRoleCount((current) => Math.min(current + 1, roles.length))}
              >
                Add node
              </button>
            ) : null}
            {visibleRoles.map((role, index) => {
              const position = getWhiteboardRolePosition(role.id, isExpanded);
              const assignedMember = findRaidGuildMember(agents, role.assignedAgentId);
              const isConfigured = Boolean(role.isConfigured);
              const isImportTarget = currentImportTargetRole?.id === role.id;
              const canOpenRole = isInteractive && !isConfigured && Boolean(onConfigureRole);
              const canOpenImportRole = isInteractive && isImportTarget && Boolean(onAssignCandidateToRole);
              const isNodeActionable = canOpenRole || canOpenImportRole;
              const nodeMeta = role.assignedAgentId
                ? `Linked: ${assignedMember?.name ?? role.assignedAgentId}`
                : isConfigured
                  ? isImportTarget ? 'Tap to import contractor' : 'Configured'
                  : 'Open role form';
              return (
                <button
                  key={role.id}
                  ref={(element) => { nodeRefs.current[role.id] = element; }}
                  className={`tree-node tree-role ${isConfigured ? 'is-filled' : 'is-active'} ${!isConfigured && index === visibleRoles.length - 1 ? 'is-entering' : ''} ${isNodeActionable ? 'is-actionable' : ''} ${isImportTarget ? 'is-import-target' : ''}`}
                  type="button"
                  data-drag-block={isNodeActionable || undefined}
                  style={{ left: `${position.x}px`, top: `${position.y}px` }}
                  disabled={!isNodeActionable}
                  onClick={() => {
                    if (canOpenRole) {
                      setActiveRoleId(role.id);
                      setSheetMode('role');
                    } else if (canOpenImportRole) {
                      setActiveRoleId(role.id);
                      setSheetMode('integrate');
                    }
                  }}
                >
                  <span className="tree-node-kicker">{index === 0 ? 'Primary Branch' : `Branch ${index + 1}`}</span>
                  <span className="tree-node-title">{isConfigured ? role.name : 'Create a role'}</span>
                  <span className="tree-node-meta">{nodeMeta}</span>
                  {assignedMember ? (
                    <span className="tree-node-assignee">
                      <span className="tree-node-assignee-mark" aria-hidden="true" style={{ '--guild-avatar-accent': assignedMember.accent, '--guild-avatar-shadow': assignedMember.shadow } as CSSProperties}>
                        {assignedMember.name.charAt(0)}
                      </span>
                      {assignedMember.name}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
        <WhiteboardHud studioName={studioName} />
      </section>

      {canIntegrateGuild && !sheetMode ? <WhiteboardIntegrateCard roleName={currentImportTargetRole?.name} /> : null}

      {sheetMode ? (
        <WhiteboardSheet
          mode={sheetMode}
          studioDraft={studioDraft}
          studioName={studioName}
          studioReady={studioReady}
          studioNameLimit={STUDIO_NAME_LIMIT}
          activeRoleName={activeRole?.name}
          roleLabel={activeRoleBlueprint?.label ?? DEFAULT_ROLE_NAME}
          roleScope={activeRoleBlueprint?.scope ?? 'Build the site'}
          candidates={candidateOptions}
          onStudioDraftChange={setStudioDraft}
          onCommitStudioName={commitStudioName}
          onCommitRole={commitRole}
          onCommitCandidate={commitCandidate}
          onClose={() => setSheetMode(null)}
        />
      ) : null}
    </section>
  );
}
