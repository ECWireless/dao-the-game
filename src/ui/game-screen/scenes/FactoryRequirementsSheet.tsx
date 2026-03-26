import type { Brief } from '../../../types';

type FactoryRequirementsSheetProps = {
  brief: Brief;
  onClose: () => void;
};

export function FactoryRequirementsSheet({ brief, onClose }: FactoryRequirementsSheetProps) {
  const spec = brief.conferenceSiteSpec;

  return (
    <div className="factory-worker-scrim">
      <section className="factory-worker-sheet" aria-label="Client requirements">
        <button className="factory-worker-close" type="button" onClick={onClose}>
          Done
        </button>

        <p className="factory-worker-kicker">Client requirements</p>
        <h3 className="factory-worker-title">{brief.clientName}</h3>
        <p className="factory-worker-summary">{brief.mission}</p>

        {spec ? (
          <div className="factory-worker-design-card factory-requirements-card">
            <div className="factory-worker-design-pill">
              <span>Edition</span>
              <strong>{spec.editionLabel}</strong>
            </div>
            <div className="factory-worker-design-pill">
              <span>Location</span>
              <strong>{spec.location}</strong>
            </div>
            <div className="factory-worker-design-pill">
              <span>Audience</span>
              <strong>{spec.audience.join(' • ')}</strong>
            </div>
          </div>
        ) : null}

        <div className="factory-worker-output">
          <p className="factory-worker-output-kicker">Requirements</p>
          <div className="factory-worker-output-list">
            {brief.requirements.map((requirement) => (
              <div key={requirement} className="factory-worker-output-row">
                <span>Need</span>
                <strong>{requirement}</strong>
              </div>
            ))}

            {spec?.visualDirection?.length ? (
              <div className="factory-worker-output-row">
                <span>Direction</span>
                <strong>{spec.visualDirection.join(' • ')}</strong>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
