import { Link } from 'react-router-dom'
import { PlanGrid, homePlans } from '../../pricing'
import { whyItems } from '../data/content'

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

        <PlanGrid plans={homePlans} />

        <div className="paypal-note">
          <strong>Payment method: PayPal</strong>
          <span>Secure checkout with PayPal, cards, and instant invoice.</span>
        </div>

        <p className="pricing-page-link">
          <Link to="/pricing">Compare full plans</Link>
        </p>
      </article>
    </section>
  )
}
