import { getPipelineStageDefinition } from '../../../pipeline';
import type { ArtifactWorkerTrace } from '../../../types';

type FactoryWorkerSheetProps = {
  trace: ArtifactWorkerTrace;
  onClose: () => void;
};

export function FactoryWorkerSheet({ trace, onClose }: FactoryWorkerSheetProps) {
  const stage = getPipelineStageDefinition(trace.stageId);
  const primaryHighlights = trace.highlights.slice(0, 4);
  const reportTo = trace.reportTo || 'Studio Root';
  const reportBody = trace.reportBody || trace.summary;

  return (
    <div className="factory-worker-scrim">
      <section className="factory-worker-sheet" aria-label={`${trace.workerName} ${stage.label} output`}>
        <button className="factory-worker-close" type="button" onClick={onClose}>
          Done
        </button>

        <p className="factory-worker-kicker">
          {trace.roleName ?? stage.label} • {trace.workerSpecialty}
        </p>
        <h3 className="factory-worker-title">{trace.workerName}</h3>
        <div className="factory-worker-report">
          <p className="factory-worker-report-kicker">Report to {reportTo}</p>
          <p className="factory-worker-report-body">{reportBody}</p>
        </div>

        <p className="factory-worker-summary">{trace.summary}</p>

        {trace.stageId === 'design' ? (
          <div className="factory-worker-design-card">
            {primaryHighlights.map((item) => (
              <div key={`${item.label}-${item.value}`} className="factory-worker-design-pill">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        ) : null}

        <div className="factory-worker-output">
          <p className="factory-worker-output-kicker">Worker output</p>
          <div className="factory-worker-output-list">
            {trace.highlights.map((item) => (
              <div key={`${item.label}-${item.value}`} className="factory-worker-output-row">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
