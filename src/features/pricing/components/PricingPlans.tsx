import { pricingPagePlans } from '../data/plans'
import { PlanGrid } from './PlanGrid'

export function PricingPlans() {
  return (
    <section className="pricing-page-plans">
      <div className="period-switch" aria-hidden="true">
        <span className="active">Monthly</span>
        <span>&amp;</span>
        <span className="active">Annual</span>
        <span className="save">Save up to 50% yearly</span>
      </div>
      <PlanGrid plans={pricingPagePlans} className="plan-grid plan-grid-page plan-grid-three" />
      <div className="paypal-note">
        <strong>Payment method: PayPal</strong>
        <span>Choose Pro Monthly ($9.99) or Pro Annual ($59.99). Secure checkout with PayPal, cards, and instant invoice.</span>
      </div>
    </section>
  )
}
