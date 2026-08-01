import { Link } from 'react-router-dom'
import { plans, whyItems } from '../data/content'

export function ValuePricing() {
  return (
    <section className="value-pricing" id="pricing">
      <article className="value-block">
        <h2>Everything You Need in a PDF Editor</h2>
        <div className="value-list">
          {whyItems.map((item) => (
            <div key={item.title} className="value-item">
              <div className="value-dot" />
              <div>
                <h4>{item.title}</h4>
                <p>{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="pricing-block">
        <h2>Simple, Transparent Pricing</h2>
        <div className="period-switch" aria-hidden="true">
          <span>Monthly</span>
          <span className="active">Annual</span>
          <span className="save">Save up to 40%</span>
        </div>

        <div className="plan-grid">
          {plans.map((plan) => (
            <section key={plan.name} className={`plan-card ${plan.featured ? 'featured' : ''}`}>
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
          ))}
        </div>

        <div className="paypal-note">
          <strong>Payment method: PayPal</strong>
          <span>Secure checkout with PayPal, cards, and instant invoice.</span>
        </div>
      </article>
    </section>
  )
}
