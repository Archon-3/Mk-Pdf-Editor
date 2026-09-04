import { API_BASE_URL } from '../constants/branding'
import type { PlanId } from '../types'

type CreateOrderResponse = {
  success: boolean
  orderId?: string
  approveUrl?: string
  error?: { code?: string; message?: string }
}

type CaptureOrderResponse = {
  success: boolean
  orderId?: string
  status?: string
  planId?: string
  payer?: string
  amount?: { value?: string; currency_code?: string }
  error?: { code?: string; message?: string }
}

type PayPalConfigResponse = {
  success: boolean
  configured: boolean
  mode: string
}

export async function fetchPayPalConfig() {
  const response = await fetch(`${API_BASE_URL}/api/payments/paypal/config`)
  const data = (await response.json().catch(() => ({}))) as PayPalConfigResponse
  if (!response.ok) {
    throw new Error('Could not load PayPal configuration.')
  }
  return data
}

export async function startPayPalCheckout(planId: Exclude<PlanId, 'free'>) {
  const response = await fetch(`${API_BASE_URL}/api/payments/paypal/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId }),
  })
  const data = (await response.json().catch(() => ({}))) as CreateOrderResponse
  if (!response.ok || !data.success || !data.approveUrl) {
    throw new Error(data.error?.message || 'Could not start PayPal checkout.')
  }
  return data
}

export async function capturePayPalOrder(orderId: string) {
  const response = await fetch(`${API_BASE_URL}/api/payments/paypal/capture-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  })
  const data = (await response.json().catch(() => ({}))) as CaptureOrderResponse
  if (!response.ok || !data.success) {
    throw new Error(data.error?.message || 'Could not confirm PayPal payment.')
  }
  return data
}
