import { useState } from 'react'
import { getPlansForPeriod, type BillingPeriod } from '../data/plans'
import { BillingToggle } from './BillingToggle'
import { PlanGrid } from './PlanGrid'

export function PricingPlans() {
  const [period, setPeriod] = useState<BillingPeriod>('annual')
  const plans = getPlansForPeriod(period)

  return (
    <section className="pricing-page-plans">
      <BillingToggle period={period} onChange={setPeriod} />
      <PlanGrid plans={plans} className="plan-grid plan-grid-page" />
      <div className="paypal-note">
        <strong>Payment method: PayPal</strong>
        <span>Secure checkout with PayPal, cards, and instant invoice.</span>
      </div>
    </section>
  )
}
