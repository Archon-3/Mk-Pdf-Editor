import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Plan } from '../../../shared/types'
import { startPayPalCheckout } from '../../../shared/api/payments'

type PlanCardProps = {
  plan: Plan
}

export function PlanCard({ plan }: PlanCardProps) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async () => {
    setError(null)

    if (plan.checkout === 'free' || plan.id === 'free') {
      navigate('/tools')
      return
    }

    setBusy(true)
    try {
      const order = await startPayPalCheckout(plan.id)
      window.location.assign(order.approveUrl!)
    } catch (checkoutError) {
      const message = checkoutError instanceof Error
        ? checkoutError.message
        : 'PayPal checkout is unavailable right now.'
      setError(message)
      setBusy(false)
    }
  }

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
      <button type="button" className="plan-cta" onClick={handleCheckout} disabled={busy}>
        {busy ? 'Redirecting to PayPal…' : plan.cta}
      </button>
      {error ? (
        <p className="plan-checkout-error" role="alert">
          {error}{' '}
          <Link to="/support">Contact support</Link>
        </p>
      ) : null}
    </section>
  )
}
