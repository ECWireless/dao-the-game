type IntroDialogProps = {
  onPrimaryAction: () => void;
  primaryActionLabel?: string;
  primaryActionDisabled?: boolean;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
};

export function IntroDialog({
  onPrimaryAction,
  primaryActionLabel = 'Start Demo',
  primaryActionDisabled = false,
  secondaryActionLabel,
  onSecondaryAction
}: IntroDialogProps) {
  return (
    <div className="intro-dialog-scrim" role="dialog" aria-modal="true" aria-labelledby="intro-dialog-title">
      <section className="intro-dialog">
        <p className="intro-dialog-kicker">Demo Brief</p>
        <h2 id="intro-dialog-title">DAO the Game</h2>
        <p>
          <strong>DAO the Game</strong> is a tycoon, management simulation game that begins with a contract request email
          being accidentally sent to the player. The player is tasked with building a site and faking a full studio to
          complete the contract.
        </p>
        <p>
          In the full game, the player would be allowed 3 types of focuses: building workers, building organizational
          units, or taking on other DAOs in the multi-player arena.
        </p>
        <p>
          This version is only a demo, but the full game would let players build increasingly complex organizations to
          produce more elaborate work for customers. They could also license workers to other organizations, sell off
          organizational units, or buy out entire other DAOs.
        </p>
        <div className="intro-dialog-actions">
          {secondaryActionLabel && onSecondaryAction ? (
            <button className="secondary-action intro-dialog-action" type="button" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </button>
          ) : null}
          <button
            className="primary-action intro-dialog-action"
            type="button"
            onClick={onPrimaryAction}
            disabled={primaryActionDisabled}
          >
            {primaryActionLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
