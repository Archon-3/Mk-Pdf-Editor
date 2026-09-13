import { API_BASE_URL } from '../constants/branding'
import type { Plan, PlanId } from '../types'

export type AdminLimitTier = {
  maxFileMb: number
  maxJobsPerDay: number
  maxMergeFiles: number
}

export type AdminPricingPlan = {
  name: string
  price: string
  amount?: string
  currency?: string
  period: string
  details: string
  features: string[]
  cta: string
  badge?: string
  featured?: boolean
  checkout: 'free' | 'paypal'
}

export type AdminSettings = {
  limits: {
    free: AdminLimitTier
    pro: AdminLimitTier
  }
  pricing: Record<PlanId, AdminPricingPlan>
  site: {
    maintenanceMode: boolean
    adsenseEnabled: boolean
    supportEmail: string
    announcement: string
  }
}

export type PublicSettings = {
  limits: AdminSettings['limits']
  pricing: AdminSettings['pricing']
  site: AdminSettings['site']
  meta?: { updatedAt?: string; version?: number }
}

export type UsageSnapshot = {
  day: string
  totalJobs: number
  activeClients: number
  clients: Array<{ client: string; jobs: number }>
  freeLimits: Record<string, unknown>
  proLimits: Record<string, unknown>
}

export type PayPalShowcase = {
  mode: string
  configured: boolean
  practice?: boolean
  clientIdMasked: string
  secretConfigured: boolean
  apiBase: string
  dashboardUrl: string
  sandboxAccountsUrl: string
  checkoutReturn: string
  checkoutCancel: string
  demoNote: string
  plans: Array<{
    id: string
    name?: string
    amount?: string
    currency?: string
    interval?: string
    priceLabel?: string
  }>
}

export type ManagedUser = {
  id: string
  email: string
  uid: string
  plan: string
  blocked: boolean
  maxFileMb: number | null
  maxJobsPerDay: number | null
  maxMergeFiles: number | null
  note: string
  updatedAt?: string
}

export type SystemStatus = {
  paypalConfigured: boolean
  paypalMode: string
  libreOfficeAvailable: boolean
  adsenseConfigured: boolean
  firebaseConfigured?: boolean
  firebaseProjectId?: string | null
  adminPasswordSet?: boolean
  paypal?: PayPalShowcase
  checklist?: Array<{ id: string; label: string; done: boolean }>
}

const TOKEN_KEY = 'mkpdf.adminToken'

export function getAdminToken() {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(TOKEN_KEY) || ''
}

export function setAdminToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token)
}

export function clearAdminToken() {
  window.localStorage.removeItem(TOKEN_KEY)
}

async function adminFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }
  const token = getAdminToken()
  if (token) headers['X-MK-Admin-Token'] = token

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.success === false) {
    throw new Error(data?.error?.message || `Request failed (${response.status})`)
  }
  return data as T
}

export async function fetchPublicSettings(): Promise<PublicSettings> {
  const data = await adminFetch<{ success: boolean } & PublicSettings>('/api/admin/public-settings')
  return {
    limits: data.limits,
    pricing: data.pricing,
    site: data.site,
    meta: data.meta,
  }
}

export async function adminLogin(password: string) {
  const data = await adminFetch<{ token: string; expiresIn: number }>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  })
  setAdminToken(data.token)
  return data
}

export async function adminLogout() {
  try {
    await adminFetch('/api/admin/logout', { method: 'POST' })
  } finally {
    clearAdminToken()
  }
}

export async function adminMe() {
  return adminFetch<{ authenticated: boolean }>('/api/admin/me')
}

export async function fetchAdminSettings() {
  const data = await adminFetch<{ settings: AdminSettings }>('/api/admin/settings')
  return data.settings
}

export async function saveAdminSettings(settings: AdminSettings) {
  const data = await adminFetch<{ settings: AdminSettings }>('/api/admin/settings', {
    method: 'PUT',
    body: JSON.stringify({ settings }),
  })
  return data.settings
}

export async function resetAdminSettings() {
  const data = await adminFetch<{ settings: AdminSettings }>('/api/admin/settings/reset', {
    method: 'POST',
  })
  return data.settings
}

export async function clearAdminUsage() {
  return adminFetch<UsageSnapshot>('/api/admin/usage/clear', { method: 'POST' })
}

export async function fetchAdminUsers() {
  const data = await adminFetch<{ users: ManagedUser[] }>('/api/admin/users')
  return data.users
}

export async function saveAdminUser(user: Partial<ManagedUser> & { email?: string; uid?: string }) {
  const data = await adminFetch<{ user: ManagedUser }>('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(user),
  })
  return data.user
}

export async function deleteAdminUser(userId: string) {
  return adminFetch<{ success: boolean }>(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  })
}

export async function fetchAdminUsage() {
  return adminFetch<UsageSnapshot>('/api/admin/usage')
}

export async function fetchAdminSystem() {
  const data = await adminFetch<{ system: SystemStatus }>('/api/admin/system')
  return data.system
}

export function pricingToPlans(pricing: PublicSettings['pricing']): Plan[] {
  const order: PlanId[] = ['free', 'pro_monthly', 'pro_annual']
  return order.map((id) => {
    const item = pricing[id]
    return {
      id,
      name: item.name,
      price: item.price,
      period: item.period,
      badge: item.badge || undefined,
      details: item.details,
      features: item.features || [],
      cta: item.cta,
      featured: Boolean(item.featured),
      checkout: item.checkout,
    }
  })
}
