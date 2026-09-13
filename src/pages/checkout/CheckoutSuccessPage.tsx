import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { capturePayPalOrder } from '../../shared/api/payments'
import { setStoredPlan } from '../../shared/plan'
import { SeoHead } from '../../shared/seo'

function planLabel(planId: string) {
  if (planId === 'pro_annual') return 'Pro Annual'
  if (planId === 'pro_monthly' || planId === 'pro') return 'Pro Monthly'
  return planId || 'Pro'
}

export function CheckoutSuccessPage() {
  const [params] = useSearchParams()
  const orderId = params.get('token') || params.get('orderId') || ''
  const planFromQuery = params.get('planId') || ''
  const isDemo = params.get('demo') === '1' || orderId.startsWith('DEMO-')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Confirming your PayPal payment…')
  const [receipt, setReceipt] = useState<{
    planId: string
    amount: string | null
    payer: string | null
    orderId: string
    mode: string
  } | null>(null)

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
        const planId = result.planId || planFromQuery || 'pro_monthly'
        const amount = result.amount?.value
          ? `${result.amount.value} ${result.amount.currency_code || 'USD'}`
          : null
        setStatus('success')
        setMessage(
          result.demo || isDemo
            ? 'Demo checkout complete. Pro unlocked for this browser.'
            : 'Payment received. Your Pro plan is active on this device.',
        )
        setReceipt({
          planId,
          amount,
          payer: result.payer || null,
          orderId: result.orderId || orderId,
          mode: result.demo || isDemo ? 'demo' : 'paypal',
        })
        setStoredPlan(planId)
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
  }, [orderId, planFromQuery, isDemo])

  return (
    <section className="content-page checkout-page">
      <SeoHead
        title="Payment confirmation | MK PDF Editor"
        description="PayPal checkout confirmation"
        path="/checkout/success"
        noIndex
      />
      <div className="checkout-shell">
        <p className="content-eyebrow">Secure checkout</p>
        <h1>
          {status === 'success' ? 'Payment successful' : status === 'error' ? 'Payment issue' : 'Confirming payment'}
        </h1>
        <p className="checkout-lead">{message}</p>

        {status === 'loading' ? (
          <div className="checkout-receipt loading">
            <span className="checkout-spinner" aria-hidden="true" />
            <p>Talking to PayPal…</p>
          </div>
        ) : null}

        {status === 'success' && receipt ? (
          <div className="checkout-receipt" role="status">
            <div className="checkout-receipt-row">
              <span>Plan</span>
              <strong>{planLabel(receipt.planId)}</strong>
            </div>
            {receipt.amount ? (
              <div className="checkout-receipt-row">
                <span>Amount</span>
                <strong>{receipt.amount}</strong>
              </div>
            ) : null}
            {receipt.payer ? (
              <div className="checkout-receipt-row">
                <span>Paid by</span>
                <strong>{receipt.payer}</strong>
              </div>
            ) : null}
            <div className="checkout-receipt-row">
              <span>Order</span>
              <code>{receipt.orderId}</code>
            </div>
            <div className="checkout-receipt-row">
              <span>Processor</span>
              <strong>{receipt.mode === 'demo' ? 'Demo sandbox' : 'PayPal'}</strong>
            </div>
          </div>
        ) : null}

        <div className="checkout-actions">
          {status === 'success' ? <Link to="/tools" className="plan-cta checkout-link">Open tools</Link> : null}
          {status === 'error' ? (
            <>
              <Link to="/pricing" className="plan-cta checkout-link">Back to pricing</Link>
              <Link to="/support">Contact support</Link>
            </>
          ) : null}
        </div>
        <p className="checkout-secure-note">Payments are processed by PayPal. MK PDF Editor never stores your card number.</p>
      </div>
    </section>
  )
}
