import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import type { Agent, HatRole } from '../../../types';
import { findRaidGuildMember, getRaidGuildCandidates } from '../guildData';
import { buildWhiteboardLinks, getWhiteboardBranchTriggerPosition, getWhiteboardRolePosition, sortWhiteboardRoles, WHITEBOARD_ROLE_BLUEPRINTS } from '../whiteboardBlueprints';

type WhiteboardSceneProps = {
  roles: HatRole[];
  agents?: Agent[];
  studioName: string;
  isExpanded: boolean;
  isReadOnly?: boolean;
  onSetStudioName?: (name: string) => void;
  onConfigureRole?: (roleId: string, name: string) => void;
  onAssignCandidate?: (agentId: string) => void;
  onComplete?: () => void;
  onImportAllCandidates?: () => void;
  autoAdvanceOnReady?: boolean;
};

type SheetMode = 'studio' | 'role' | 'integrate' | null;

const STUDIO_NAME_LIMIT = 20;
const DEFAULT_ROLE_NAME = WHITEBOARD_ROLE_BLUEPRINTS[0].label;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

export function WhiteboardScene({
  roles,
  agents = [],
  studioName,
  isExpanded,
  isReadOnly = false,
  onSetStudioName,
  onConfigureRole,
  onAssignCandidate,
  onComplete,
  onImportAllCandidates,
  autoAdvanceOnReady = false
}: WhiteboardSceneProps) {
  const firstRole = roles[0];
  const firstRoleReady = Boolean(firstRole?.isConfigured);
  const firstRoleAssigned = Boolean(firstRole?.assignedAgentId);
  const configuredRoleCount = roles.filter((role) => role.isConfigured).length;
  const isInteractive = !isReadOnly;
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);
  const [activeRoleId, setActiveRoleId] = useState<string | null>(null);
  const [stagedRoleCount, setStagedRoleCount] = useState(Math.max(configuredRoleCount, firstRoleReady ? 1 : 0));
  const [studioDraft, setStudioDraft] = useState(studioName);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ pointerId: number; originX: number; originY: number; startX: number; startY: number } | null>(null);

  useEffect(() => {
    setStudioDraft(studioName);
  }, [studioName]);

  useEffect(() => {
    const minimumVisibleRoles = Math.max(configuredRoleCount, firstRoleReady ? 1 : 0);
    if (minimumVisibleRoles > stagedRoleCount) {
      setStagedRoleCount(minimumVisibleRoles);
      return;
    }
    if (!studioName && configuredRoleCount === 0 && stagedRoleCount !== 0) {
      setStagedRoleCount(0);
    }
  }, [configuredRoleCount, firstRoleReady, stagedRoleCount, studioName]);

  const studioReady = studioDraft.trim().length >= 2;
  const canOpenStudio = !studioName && isInteractive && Boolean(onSetStudioName);
  const visibleRoleCount = isExpanded ? Math.min(stagedRoleCount, roles.length) : firstRoleReady || stagedRoleCount > 0 ? 1 : 0;
  const visibleRoles = sortWhiteboardRoles(roles.slice(0, visibleRoleCount), isExpanded);
  const nextRole = roles[visibleRoleCount];
  const canAddBranch = Boolean(studioName) && isInteractive && (isExpanded ? Boolean(nextRole) : visibleRoleCount === 0 && Boolean(firstRole));
  const canIntegrateGuild = isInteractive && !isExpanded && Boolean(onAssignCandidate) && firstRoleReady && !firstRoleAssigned;
  const guildCandidates = getRaidGuildCandidates(agents, 2);
  const activeRole = roles.find((role) => role.id === activeRoleId) ?? null;
  const activeRoleIndex = activeRole ? roles.findIndex((role) => role.id === activeRole.id) : -1;
  const activeRoleBlueprint = activeRoleIndex >= 0 ? WHITEBOARD_ROLE_BLUEPRINTS[activeRoleIndex] ?? WHITEBOARD_ROLE_BLUEPRINTS[WHITEBOARD_ROLE_BLUEPRINTS.length - 1] : null;
  const boardLinks = buildWhiteboardLinks(visibleRoles, isExpanded);
  const addBranchPosition = getWhiteboardBranchTriggerPosition(isExpanded ? nextRole?.id : firstRole?.id, isExpanded);
  const boardOffsetClampX = isExpanded ? 320 : 220;
  const shouldAutoAdvanceExpanded = isInteractive && isExpanded && autoAdvanceOnReady && configuredRoleCount >= 3 && Boolean(onComplete);
  const showExpandedImport = isInteractive && isExpanded && Boolean(onImportAllCandidates);

  useEffect(() => {
    if (!shouldAutoAdvanceExpanded) {
      return;
    }

    onComplete?.();
  }, [onComplete, shouldAutoAdvanceExpanded]);

  const commitStudioName = () => {
    if (!canOpenStudio || !studioReady) {
      return;
    }
    onSetStudioName?.(studioDraft.trim());
    setSheetMode(null);
  };

  const commitRole = () => {
    if (!activeRole || activeRole.isConfigured || !onConfigureRole) {
      return;
    }
    const roleName = activeRoleBlueprint?.label ?? activeRole.name ?? DEFAULT_ROLE_NAME;
    onConfigureRole(activeRole.id, roleName);
    setSheetMode(null);
    setActiveRoleId(null);
    if (!isExpanded) {
      onComplete?.();
    }
  };

  const commitCandidate = (agentId: string) => {
    if (!canIntegrateGuild) {
      return;
    }
    onAssignCandidate?.(agentId);
    setSheetMode(null);
  };

  const handleBoardPointerDown = (event: PointerEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-drag-block="true"], input, textarea, label')) {
      return;
    }
    dragRef.current = {
      pointerId: event.pointerId,
      originX: offset.x,
      originY: offset.y,
      startX: event.clientX,
      startY: event.clientY
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleBoardPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) {
      return;
    }
    const nextX = dragRef.current.originX + (event.clientX - dragRef.current.startX);
    const nextY = dragRef.current.originY + (event.clientY - dragRef.current.startY);
    setOffset({
      x: clamp(nextX, -boardOffsetClampX, boardOffsetClampX),
      y: clamp(nextY, -150, 150)
    });
  };

  const handleBoardPointerEnd = (event: PointerEvent<HTMLElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) {
      return;
    }
    dragRef.current = null;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
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
      >
        <div className="whiteboard-viewport">
          <div
            className="whiteboard-canvas"
            style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
            aria-label="Org chart board"
          >
            {visibleRoles.length > 0 ? (
              <svg className="whiteboard-links" viewBox="0 0 920 520" aria-hidden="true">
                {boardLinks.map((path) => (
                  <path key={path} d={path} />
                ))}
              </svg>
            ) : null}
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
              const canOpenRole = isInteractive && !isConfigured && Boolean(onConfigureRole);
              const nodeTitle = isConfigured ? role.name : 'Create a role';
              const nodeMeta = role.assignedAgentId
                ? `Linked: ${assignedMember?.name ?? role.assignedAgentId}`
                : isConfigured
                  ? 'Configured'
                  : 'Open role form';

              return (
                <button
                  key={role.id}
                  className={`tree-node tree-role ${isConfigured ? 'is-filled' : 'is-active'} ${!isConfigured && index === visibleRoles.length - 1 ? 'is-entering' : ''} ${canOpenRole ? 'is-actionable' : ''}`}
                    type="button"
                    data-drag-block={canOpenRole || undefined}
                    style={{ left: `${position.x}px`, top: `${position.y}px` }}
                    disabled={!canOpenRole}
                    onClick={() => canOpenRole && (setActiveRoleId(role.id), setSheetMode('role'))}
                  >
                  <span className="tree-node-kicker">{index === 0 ? 'Primary Branch' : `Branch ${index + 1}`}</span>
                  <span className="tree-node-title">{nodeTitle}</span>
                  <span className="tree-node-meta">{nodeMeta}</span>
                  {assignedMember ? (
                    <span className="tree-node-assignee">
                      <span
                        className="tree-node-assignee-mark"
                        aria-hidden="true"
                        style={
                          {
                            '--guild-avatar-accent': assignedMember.accent,
                            '--guild-avatar-shadow': assignedMember.shadow
                          } as CSSProperties
                        }
                      >
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

        <div className="whiteboard-hud" aria-hidden="true">
          <span>Planning board</span>
          <span>{studioName ? studioName : 'Unnamed studio'}</span>
        </div>
      </section>

      {canIntegrateGuild || showExpandedImport ? (
        <section className="whiteboard-integrate-card">
          <p>{canIntegrateGuild ? 'Integrate RaidGuild server?' : 'RaidGuild applicants are queued for the open branches.'}</p>
          {canIntegrateGuild ? (
            <button className="primary-action" type="button" onClick={() => setSheetMode('integrate')}>
              Yes, import applicants
            </button>
          ) : (
            <button className="primary-action" type="button" onClick={onImportAllCandidates}>
              Import from RaidGuild
            </button>
          )}
        </section>
      ) : null}

      {sheetMode ? (
        <div className="whiteboard-sheet-scrim">
          <section
            className="whiteboard-sheet"
            aria-label={
              sheetMode === 'studio'
                ? 'Name your studio'
                : sheetMode === 'integrate'
                  ? 'Import a contractor'
                  : 'Add role'
            }
          >
            <p className="whiteboard-sheet-kicker">
              {sheetMode === 'studio' ? 'Studio' : sheetMode === 'integrate' ? 'RaidGuild' : 'Role'}
            </p>
            <h2>
              {sheetMode === 'studio' ? 'Name your studio' : sheetMode === 'integrate' ? 'Import a contractor' : 'Create role'}
            </h2>
            <p className="whiteboard-sheet-copy">
              {sheetMode === 'studio'
                ? 'This name will appear anywhere the studio is referenced.'
                : sheetMode === 'integrate'
                  ? 'Pick one applicant to link directly into this branch.'
                  : 'Review the prefilled role details, then create it.'}
            </p>

            {sheetMode === 'studio' ? (
              <label className="whiteboard-field">
                <span>Studio name</span>
                <input
                  autoFocus
                  maxLength={STUDIO_NAME_LIMIT}
                  value={studioDraft}
                  onChange={(event) => setStudioDraft(event.target.value)}
                />
              </label>
            ) : sheetMode === 'role' ? (
              <div className="whiteboard-summary">
                <div className="whiteboard-summary-row">
                  <span>Role name</span>
                  <strong>{activeRoleBlueprint?.label ?? DEFAULT_ROLE_NAME}</strong>
                </div>
                <div className="whiteboard-summary-row">
                  <span>Reports to</span>
                  <strong>{studioName}</strong>
                </div>
                <div className="whiteboard-summary-row">
                  <span>Scope</span>
                  <strong>{activeRoleBlueprint?.scope ?? 'Build the site'}</strong>
                </div>
              </div>
            ) : (
              <div className="whiteboard-candidate-list">
                {guildCandidates.map((candidate) => {
                  const agent = candidate.agentId ? agents.find((item) => item.id === candidate.agentId) : undefined;

                  if (!agent || !candidate.agentId) {
                    return null;
                  }

                  return (
                    <button
                      key={candidate.id}
                      className="whiteboard-candidate-row"
                      type="button"
                      onClick={() => commitCandidate(candidate.agentId!)}
                    >
                      <span
                        className="whiteboard-candidate-avatar"
                        aria-hidden="true"
                        style={
                          {
                            '--guild-avatar-accent': candidate.accent,
                            '--guild-avatar-shadow': candidate.shadow
                          } as CSSProperties
                        }
                      >
                        {candidate.name.charAt(0)}
                      </span>
                      <span className="whiteboard-candidate-copy">
                        <span className="whiteboard-candidate-name">{candidate.name}</span>
                        <span className="whiteboard-candidate-meta">
                          {agent.roleAffinity} | rel {agent.reliability} | spd {agent.speed}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="whiteboard-sheet-actions">
              {sheetMode === 'studio' ? (
                <>
                  <button className="secondary-action" type="button" onClick={() => setSheetMode(null)}>
                    Cancel
                  </button>
                  <button
                    className="primary-action"
                    type="button"
                    disabled={!studioReady}
                    onClick={commitStudioName}
                  >
                    Save Studio
                  </button>
                </>
              ) : sheetMode === 'role' ? (
                <button className="primary-action whiteboard-create-role" type="button" onClick={commitRole}>
                  Create Role
                </button>
              ) : (
                <button className="secondary-action whiteboard-create-role" type="button" onClick={() => setSheetMode(null)}>
                  Close
                </button>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
