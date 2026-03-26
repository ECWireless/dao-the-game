import { GuildMemberAvatar } from './GuildMemberAvatar';
import type { GuildMemberProfile } from '../guildData';

type WhiteboardSheetMode = 'studio' | 'role' | 'integrate';

type WhiteboardSheetProps = {
  mode: WhiteboardSheetMode;
  studioDraft: string;
  studioName: string;
  studioReady: boolean;
  studioNameLimit: number;
  isSubmitting: boolean;
  submitError?: string | null;
  activeRoleName?: string;
  roleLabel: string;
  roleScope: string;
  candidates: GuildMemberProfile[];
  onStudioDraftChange: (value: string) => void;
  onCommitStudioName: () => void;
  onCommitRole: () => void;
  onCommitCandidate: (agentId: string) => void;
  onOpenCandidateProfile: (memberId: string) => void;
  onClose: () => void;
};

export function WhiteboardSheet({
  mode,
  studioDraft,
  studioName,
  studioReady,
  studioNameLimit,
  isSubmitting,
  submitError,
  activeRoleName,
  roleLabel,
  roleScope,
  candidates,
  onStudioDraftChange,
  onCommitStudioName,
  onCommitRole,
  onCommitCandidate,
  onOpenCandidateProfile,
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
              ? `Pick one applicant who offered for ${activeRoleName ?? 'this role'}. Tap an avatar to see the full profile, or import directly.`
              : 'Review the prefilled role details, then create it.'}
        </p>

        {mode === 'studio' ? (
          <label className="whiteboard-field">
            <span>Studio name</span>
            <input
              autoFocus
              disabled={isSubmitting}
              maxLength={studioNameLimit}
              value={studioDraft}
              onChange={(event) => onStudioDraftChange(event.target.value)}
            />
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
              <div key={candidate.id} className="whiteboard-candidate-row">
                <button
                  className="whiteboard-candidate-avatar-button"
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => onOpenCandidateProfile(candidate.id)}
                  aria-label={`Open ${candidate.name} profile`}
                >
                  <GuildMemberAvatar member={candidate} />
                </button>
                <div className="whiteboard-candidate-copy">
                  <span className="whiteboard-candidate-name">
                    {candidate.name}
                    <span>@{candidate.handle}</span>
                  </span>
                  <span className="whiteboard-candidate-meta">{candidate.shortPitch}</span>
                </div>
                <button
                  className="primary-action whiteboard-candidate-import"
                  type="button"
                  disabled={isSubmitting || !candidate.agentId}
                  onClick={() => candidate.agentId && onCommitCandidate(candidate.agentId)}
                >
                  Import
                </button>
              </div>
            ))}
          </div>
        )}

        {submitError ? (
          <p className="whiteboard-sheet-error" role="alert">
            {submitError}
          </p>
        ) : null}

        <div className="whiteboard-sheet-actions">
          {mode === 'studio' ? (
            <>
              <button className="secondary-action" type="button" disabled={isSubmitting} onClick={onClose}>Cancel</button>
              <button className="primary-action" type="button" disabled={!studioReady || isSubmitting} onClick={onCommitStudioName}>
                {isSubmitting ? 'Saving...' : 'Save Studio'}
              </button>
            </>
          ) : mode === 'role' ? (
            <button className="primary-action whiteboard-create-role" type="button" disabled={isSubmitting} onClick={onCommitRole}>
              {isSubmitting ? 'Creating...' : 'Create Role'}
            </button>
          ) : (
            <button className="secondary-action whiteboard-create-role" type="button" disabled={isSubmitting} onClick={onClose}>Close</button>
          )}
        </div>
      </section>
    </div>
  );
}
