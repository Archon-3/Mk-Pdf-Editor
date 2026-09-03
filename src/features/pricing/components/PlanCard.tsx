import { Link } from 'react-router-dom'
import type { Plan } from '../../../shared/types'

type PlanCardProps = {
  plan: Plan
}

export function PlanCard({ plan }: PlanCardProps) {
  return (
    <section className={`plan-card ${plan.featured ? 'featured' : ''}`}>
      {plan.badge ? <span className="plan-badge">{plan.badge}</span> : null}
      <h3>{plan.name}</h3>
      <p className="plan-price">
        <strong>{plan.price}</strong>
        <span>{plan.period}</span>
      </p>
      <p className="plan-detail">{plan.details}</p>
      <ul>
        {plan.features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      <Link to="/tools" className="plan-cta">
        {plan.cta}
      </Link>
    </section>
  )
}
