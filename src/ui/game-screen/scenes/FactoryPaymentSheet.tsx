import { formatUsdc } from '../utils';
import type { WorkerPaymentPlan, WorkerPaymentStagePlan } from '../../../workers/paymentPlan';

type FactoryPaymentSheetProps = {
  plan: WorkerPaymentPlan;
  payerWalletAddress?: string | null;
  onApprove: () => void;
  onUseFreeFallback: () => void;
  onClose: () => void;
};

function formatWalletLabel(walletAddress: string): string {
  return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
}

function getStageBillingCopy(stage: WorkerPaymentStagePlan): { label: string; value: string } {
  switch (stage.kind) {
    case 'paid-external':
      return {
        label: 'Paid external worker',
        value: formatUsdc(stage.amount)
      };
    case 'free-external':
      return {
        label: 'External worker',
        value: 'Free'
      };
    case 'free-demo':
    default:
      return {
        label: 'Demo worker',
        value: 'Free'
      };
  }
}

export function FactoryPaymentSheet({
  plan,
  payerWalletAddress = null,
  onApprove,
  onUseFreeFallback,
  onClose
}: FactoryPaymentSheetProps) {
  return (
    <div className="factory-worker-scrim">
      <section className="factory-worker-sheet" aria-label="Worker payment approval">
        <button className="factory-worker-close" type="button" onClick={onClose}>
          Back
        </button>

        <p className="factory-worker-kicker">Worker payment approval</p>
        <h3 className="factory-worker-title">Approve the paid line before Factory starts</h3>
        <p className="factory-worker-summary">
          This run routes through {plan.stages.length} assigned stage{plan.stages.length === 1 ? '' : 's'}.
          {' '}
          {plan.payableStageCount > 0
            ? `${plan.payableStageCount} stage${plan.payableStageCount === 1 ? '' : 's'} will request payment upfront.`
            : 'No paid external stages are assigned to this line.'}
        </p>

        <div className="factory-worker-design-card">
          <div className="factory-worker-design-pill">
            <span>Payment rail</span>
            <strong>Base • USDC</strong>
          </div>
          <div className="factory-worker-design-pill">
            <span>Payer wallet</span>
            <strong>
              {payerWalletAddress ? formatWalletLabel(payerWalletAddress) : 'Wallet unavailable'}
            </strong>
          </div>
        </div>

        <div className="factory-worker-design-card">
          <div className="factory-worker-design-pill">
            <span>Total payable</span>
            <strong>{formatUsdc(plan.total)}</strong>
          </div>
          <div className="factory-worker-design-pill">
            <span>Paid stages</span>
            <strong>{plan.payableStageCount}</strong>
          </div>
          <div className="factory-worker-design-pill">
            <span>Free stages</span>
            <strong>{plan.freeStageCount}</strong>
          </div>
        </div>

        <div className="factory-worker-output">
          <p className="factory-worker-output-kicker">Stage breakdown</p>
          <div className="factory-worker-output-list">
            {plan.stages.map((stage) => {
              const billing = getStageBillingCopy(stage);

              return (
                <div key={`${stage.stageId}-${stage.workerId}`} className="factory-worker-output-row">
                  <span>{stage.stageLabel}</span>
                  <strong>
                    {stage.workerName} • {billing.label} • {billing.value}
                  </strong>
                </div>
              );
            })}
          </div>
        </div>

        <p className="factory-worker-summary">
          If your Base wallet cannot clear the paid line, Factory can reroute only those paid stages
          to the free demo workers instead.
        </p>

        <button
          className="primary-action factory-submit-button"
          type="button"
          onClick={onApprove}
          disabled={!payerWalletAddress}
        >
          Approve All And Run
        </button>
        <button
          className="secondary-action factory-submit-button"
          type="button"
          onClick={onUseFreeFallback}
        >
          Use Free Demo Workers Instead
        </button>
      </section>
    </div>
  );
}
