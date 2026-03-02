import { useEffect, useRef, useState, type PointerEvent } from 'react';
import type { HatRole } from '../../../types';

type WhiteboardSceneProps = {
  roles: HatRole[];
  studioName: string;
  isExpanded: boolean;
  isReadOnly?: boolean;
  onSetStudioName?: (name: string) => void;
  onConfigureRole?: (roleId: string, name: string) => void;
  onComplete?: () => void;
  completeLabel?: string;
};

type SheetMode = 'studio' | 'role' | null;

const STUDIO_NAME_LIMIT = 20;
const DEFAULT_ROLE_NAME = 'Web Developer';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

export function WhiteboardScene({
  roles,
  studioName,
  isExpanded,
  isReadOnly = false,
  onSetStudioName,
  onConfigureRole,
  onComplete,
  completeLabel
}: WhiteboardSceneProps) {
  const firstRole = roles[0];
  const firstRoleReady = Boolean(firstRole?.isConfigured);
  const isInteractive = !isReadOnly;
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);
  const [hasDraftBranch, setHasDraftBranch] = useState(firstRoleReady);
  const [studioDraft, setStudioDraft] = useState(studioName);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ pointerId: number; originX: number; originY: number; startX: number; startY: number } | null>(null);

  useEffect(() => {
    setStudioDraft(studioName);
  }, [studioName]);

  useEffect(() => {
    if (firstRoleReady) {
      setHasDraftBranch(true);
    } else if (!studioName) {
      setHasDraftBranch(false);
    }
  }, [firstRoleReady, studioName]);

  const studioReady = studioDraft.trim().length >= 2;
  const canOpenStudio = !studioName && isInteractive && Boolean(onSetStudioName);
  const showPrimaryBranch = firstRoleReady || hasDraftBranch;
  const canAddBranch = Boolean(studioName) && !showPrimaryBranch && isInteractive && Boolean(firstRole);
  const canOpenRole = Boolean(studioName) && showPrimaryBranch && !firstRoleReady && isInteractive && Boolean(onConfigureRole);
  const primaryRoleTitle = firstRoleReady ? firstRole?.name ?? DEFAULT_ROLE_NAME : 'Create a role';
  const primaryRoleMeta = firstRoleReady ? 'Configured' : 'Open role form';
  const showCompleteButton = isInteractive && isExpanded && Boolean(onComplete) && Boolean(completeLabel);

  const commitStudioName = () => {
    if (!canOpenStudio || !studioReady) {
      return;
    }

    onSetStudioName?.(studioDraft.trim());
    setSheetMode(null);
  };

  const commitRole = () => {
    if (!canOpenRole || !firstRole) {
      return;
    }

    onConfigureRole?.(firstRole.id, DEFAULT_ROLE_NAME);
    setSheetMode(null);

    if (!isExpanded) {
      onComplete?.();
    }
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
      x: clamp(nextX, -220, 220),
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
            {showPrimaryBranch ? (
              <svg className="whiteboard-links" viewBox="0 0 760 520" aria-hidden="true">
                <path d="M388 132 C388 182 284 192 246 248" />
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
                style={{ left: '338px', top: '180px' }}
                onClick={() => setHasDraftBranch(true)}
              >
                Add node
              </button>
            ) : null}

            {showPrimaryBranch ? (
              <button
                className={`tree-node tree-role ${firstRoleReady ? 'is-filled' : 'is-active is-entering'} ${canOpenRole ? 'is-actionable' : ''}`}
                type="button"
                data-drag-block={canOpenRole || undefined}
                style={{ left: '148px', top: '238px' }}
                disabled={!canOpenRole}
                onClick={() => canOpenRole && setSheetMode('role')}
              >
                <span className="tree-node-kicker">Primary Branch</span>
                <span className="tree-node-title">{primaryRoleTitle}</span>
                <span className="tree-node-meta">{primaryRoleMeta}</span>
              </button>
            ) : null}
          </div>
        </div>

        <div className="whiteboard-hud" aria-hidden="true">
          <span>Planning board</span>
          <span>{studioName ? studioName : 'Unnamed studio'}</span>
        </div>
      </section>

      {showCompleteButton ? (
        <button className="primary-action" type="button" onClick={onComplete}>
          {completeLabel}
        </button>
      ) : null}

      {sheetMode ? (
        <div className="whiteboard-sheet-scrim">
          <section className="whiteboard-sheet" aria-label={sheetMode === 'studio' ? 'Name your studio' : 'Add role'}>
            <p className="whiteboard-sheet-kicker">{sheetMode === 'studio' ? 'Studio' : 'Role'}</p>
            <h2>{sheetMode === 'studio' ? 'Name your studio' : 'Create role'}</h2>
            <p className="whiteboard-sheet-copy">
              {sheetMode === 'studio'
                ? 'This name will appear anywhere the studio is referenced.'
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
            ) : (
              <div className="whiteboard-summary">
                <div className="whiteboard-summary-row">
                  <span>Role name</span>
                  <strong>{DEFAULT_ROLE_NAME}</strong>
                </div>
                <div className="whiteboard-summary-row">
                  <span>Reports to</span>
                  <strong>{studioName}</strong>
                </div>
                <div className="whiteboard-summary-row">
                  <span>Scope</span>
                  <strong>Build the site</strong>
                </div>
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
              ) : (
                <button className="primary-action whiteboard-create-role" type="button" onClick={commitRole}>
                  Create Role
                </button>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
