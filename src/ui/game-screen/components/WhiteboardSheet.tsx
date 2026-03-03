import type { CSSProperties } from 'react';

type WhiteboardSheetMode = 'studio' | 'role' | 'integrate';

type WhiteboardCandidateOption = {
  id: string;
  agentId: string;
  name: string;
  accent: string;
  shadow: string;
  roleAffinity: string;
  reliability: number;
  speed: number;
};

type WhiteboardSheetProps = {
  mode: WhiteboardSheetMode;
  studioDraft: string;
  studioName: string;
  studioReady: boolean;
  studioNameLimit: number;
  activeRoleName?: string;
  roleLabel: string;
  roleScope: string;
  candidates: WhiteboardCandidateOption[];
  onStudioDraftChange: (value: string) => void;
  onCommitStudioName: () => void;
  onCommitRole: () => void;
  onCommitCandidate: (agentId: string) => void;
  onClose: () => void;
};

export function WhiteboardSheet({
  mode,
  studioDraft,
  studioName,
  studioReady,
  studioNameLimit,
  activeRoleName,
  roleLabel,
  roleScope,
  candidates,
  onStudioDraftChange,
  onCommitStudioName,
  onCommitRole,
  onCommitCandidate,
  onClose
}: WhiteboardSheetProps) {
  return (
    <div className="whiteboard-sheet-scrim">
      <section className="whiteboard-sheet" aria-label={mode === 'studio' ? 'Name your studio' : mode === 'integrate' ? 'Import a contractor' : 'Add role'}>
        <p className="whiteboard-sheet-kicker">{mode === 'studio' ? 'Studio' : mode === 'integrate' ? 'RaidGuild' : 'Role'}</p>
        <h2>{mode === 'studio' ? 'Name your studio' : mode === 'integrate' ? 'Import a contractor' : 'Create role'}</h2>
        <p className="whiteboard-sheet-copy">
          {mode === 'studio'
            ? 'This name will appear anywhere the studio is referenced.'
            : mode === 'integrate'
              ? `Pick one applicant who offered for ${activeRoleName ?? 'this role'}.`
              : 'Review the prefilled role details, then create it.'}
        </p>

        {mode === 'studio' ? (
          <label className="whiteboard-field">
            <span>Studio name</span>
            <input autoFocus maxLength={studioNameLimit} value={studioDraft} onChange={(event) => onStudioDraftChange(event.target.value)} />
          </label>
        ) : mode === 'role' ? (
          <div className="whiteboard-summary">
            <div className="whiteboard-summary-row"><span>Role name</span><strong>{roleLabel}</strong></div>
            <div className="whiteboard-summary-row"><span>Reports to</span><strong>{studioName}</strong></div>
            <div className="whiteboard-summary-row"><span>Scope</span><strong>{roleScope}</strong></div>
          </div>
        ) : (
          <div className="whiteboard-candidate-list">
            {candidates.map((candidate) => (
              <button key={candidate.id} className="whiteboard-candidate-row" type="button" onClick={() => onCommitCandidate(candidate.agentId)}>
                <span className="whiteboard-candidate-avatar" aria-hidden="true" style={{ '--guild-avatar-accent': candidate.accent, '--guild-avatar-shadow': candidate.shadow } as CSSProperties}>
                  {candidate.name.charAt(0)}
                </span>
                <span className="whiteboard-candidate-copy">
                  <span className="whiteboard-candidate-name">{candidate.name}</span>
                  <span className="whiteboard-candidate-meta">{candidate.roleAffinity} | rel {candidate.reliability} | spd {candidate.speed}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="whiteboard-sheet-actions">
          {mode === 'studio' ? (
            <>
              <button className="secondary-action" type="button" onClick={onClose}>Cancel</button>
              <button className="primary-action" type="button" disabled={!studioReady} onClick={onCommitStudioName}>Save Studio</button>
            </>
          ) : mode === 'role' ? (
            <button className="primary-action whiteboard-create-role" type="button" onClick={onCommitRole}>Create Role</button>
          ) : (
            <button className="secondary-action whiteboard-create-role" type="button" onClick={onClose}>Close</button>
          )}
        </div>
      </section>
    </div>
  );
}
