import type { BillingPeriod } from '../data/plans'

type BillingToggleProps = {
  period: BillingPeriod
  onChange: (period: BillingPeriod) => void
}

export function BillingToggle({ period, onChange }: BillingToggleProps) {
  return (
    <div className="period-switch period-switch-interactive" role="group" aria-label="Billing period">
      <button
        type="button"
        className={period === 'monthly' ? 'active' : undefined}
        aria-pressed={period === 'monthly'}
        onClick={() => onChange('monthly')}
      >
        Monthly
      </button>
      <button
        type="button"
        className={period === 'annual' ? 'active' : undefined}
        aria-pressed={period === 'annual'}
        onClick={() => onChange('annual')}
      >
        Annual
      </button>
      <span className="save">Save up to 50%</span>
    </div>
  )
}
