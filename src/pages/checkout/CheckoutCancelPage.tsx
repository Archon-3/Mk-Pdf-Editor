import { Link } from 'react-router-dom'

export function CheckoutCancelPage() {
  return (
    <section className="content-page checkout-page">
      <header className="content-page-hero">
        <p className="content-eyebrow">Checkout</p>
        <h1>Payment cancelled</h1>
        <p>No charge was made. You can return to pricing and try PayPal checkout again whenever you are ready.</p>
        <div className="checkout-actions">
          <Link to="/pricing" className="plan-cta checkout-link">Back to pricing</Link>
          <Link to="/tools">Continue with Free tools</Link>
        </div>
      </header>
    </section>
  )
}
