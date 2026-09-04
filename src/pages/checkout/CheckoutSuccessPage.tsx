import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { capturePayPalOrder } from '../../shared/api/payments'
import { setStoredPlan } from '../../shared/plan'

export function CheckoutSuccessPage() {
  const [params] = useSearchParams()
  const orderId = params.get('token') || params.get('orderId') || ''
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Confirming your PayPal payment…')
  const [details, setDetails] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function confirm() {
      if (!orderId) {
        setStatus('error')
        setMessage('Missing PayPal order information.')
        return
      }

      try {
        const result = await capturePayPalOrder(orderId)
        if (cancelled) return
        setStatus('success')
        setMessage('Payment confirmed. Welcome to Pro!')
        const amount = result.amount?.value
          ? `${result.amount.value} ${result.amount.currency_code || 'USD'}`
          : null
        setDetails([result.planId, amount, result.payer].filter(Boolean).join(' · ') || null)
        setStoredPlan(result.planId || 'pro_monthly')
      } catch (error) {
        if (cancelled) return
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Could not confirm payment.')
      }
    }

    confirm()
    return () => {
      cancelled = true
    }
  }, [orderId])

  return (
    <section className="content-page checkout-page">
      <header className="content-page-hero">
        <p className="content-eyebrow">Checkout</p>
        <h1>{status === 'success' ? 'Payment successful' : status === 'error' ? 'Payment issue' : 'Confirming payment'}</h1>
        <p>{message}</p>
        {details ? <p className="checkout-details">{details}</p> : null}
        <div className="checkout-actions">
          {status === 'success' ? <Link to="/tools" className="plan-cta checkout-link">Open tools</Link> : null}
          {status === 'error' ? (
            <>
              <Link to="/pricing" className="plan-cta checkout-link">Back to pricing</Link>
              <Link to="/support">Contact support</Link>
            </>
          ) : null}
        </div>
      </header>
    </section>
  )
}
