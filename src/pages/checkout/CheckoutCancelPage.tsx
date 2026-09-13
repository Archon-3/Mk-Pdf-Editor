import { Link } from 'react-router-dom'
import { SeoHead } from '../../shared/seo'

export function CheckoutCancelPage() {
  return (
    <section className="content-page checkout-page">
      <SeoHead
        title="Checkout cancelled | MK PDF Editor"
        description="PayPal checkout was cancelled"
        path="/checkout/cancel"
        noIndex
      />
      <div className="checkout-shell">
        <p className="content-eyebrow">Secure checkout</p>
        <h1>Payment cancelled</h1>
        <p className="checkout-lead">
          No charge was made. You can return to pricing and complete PayPal checkout whenever you are ready.
        </p>
        <div className="checkout-receipt">
          <div className="checkout-receipt-row">
            <span>Status</span>
            <strong>Cancelled</strong>
          </div>
          <div className="checkout-receipt-row">
            <span>Charge</span>
            <strong>$0.00</strong>
          </div>
        </div>
        <div className="checkout-actions">
          <Link to="/pricing" className="plan-cta checkout-link">Back to pricing</Link>
          <Link to="/tools">Continue with Free tools</Link>
        </div>
      </div>
    </section>
  )
}
