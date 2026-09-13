import { PlanGrid } from './PlanGrid'
import { useLivePlans } from '../hooks/useLivePlans'

export function PricingPlans() {
  const { plans, site, loading } = useLivePlans()
  const monthly = plans.find((plan) => plan.id === 'pro_monthly')
  const annual = plans.find((plan) => plan.id === 'pro_annual')

  return (
    <section className="pricing-page-plans">
      {site?.announcement ? <p className="site-announcement">{site.announcement}</p> : null}
      {site?.maintenanceMode ? (
        <p className="site-announcement warn">Maintenance mode is on — tool uploads are temporarily blocked.</p>
      ) : null}
      <div className="period-switch" aria-hidden="true">
        <span className="active">Monthly</span>
        <span>&amp;</span>
        <span className="active">Annual</span>
        <span className="save">Save up to 50% yearly</span>
      </div>
      <PlanGrid plans={plans} className="plan-grid plan-grid-page plan-grid-three" />
      <div className="paypal-note">
        <strong>Payment method: PayPal</strong>
        <span>
          {loading
            ? 'Loading live pricing…'
            : `Choose ${monthly?.name || 'Pro Monthly'} (${monthly?.price || '$9.99'}) or ${annual?.name || 'Pro Annual'} (${annual?.price || '$59.99'}). Secure checkout with PayPal.`}
        </span>
      </div>
    </section>
  )
}
