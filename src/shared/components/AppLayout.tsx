import { useEffect } from 'react'
import { useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth'
import { fetchPublicSettings } from '../api/admin'
import { API_BASE_URL } from '../constants/branding'
import {
  applyManagedOverrides,
  applyRemoteLimits,
  clearManagedOverrides,
  getStoredPlan,
} from '../plan'
import { AdSenseLoader } from './ads'
import { Footer } from './Footer'
import { Header } from './Header'

async function syncUserLimits(email?: string | null, uid?: string | null) {
  if (!email && !uid) {
    clearManagedOverrides()
    return
  }
  const params = new URLSearchParams()
  params.set('planId', getStoredPlan())
  if (email) params.set('email', email)
  if (uid) params.set('uid', uid)
  const response = await fetch(`${API_BASE_URL}/api/plan/limits?${params.toString()}`, {
    headers: {
      ...(email ? { 'X-MK-User-Email': email } : {}),
      ...(uid ? { 'X-MK-User-Id': uid } : {}),
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.success === false) return
  applyManagedOverrides({
    plan: data.plan,
    blocked: Boolean(data.blocked),
    maxFileBytes: typeof data.maxFileBytes === 'number' ? data.maxFileBytes : undefined,
    maxJobsPerDay: typeof data.maxJobsPerDay === 'number' ? data.maxJobsPerDay : undefined,
    maxMergeFiles: typeof data.maxMergeFiles === 'number' ? data.maxMergeFiles : undefined,
  })
}

export function AppLayout() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    let cancelled = false

    async function refreshLimits() {
      try {
        const settings = await fetchPublicSettings()
        if (cancelled) return
        applyRemoteLimits(settings.limits)
      } catch {
        /* keep built-in Free/Pro defaults when admin API is offline */
      }
      if (cancelled) return
      if (isAuthenticated && user) {
        try {
          await syncUserLimits(user.email, user.id)
        } catch {
          /* ignore — backend still enforces */
        }
      } else {
        clearManagedOverrides()
      }
    }

    void refreshLimits()
    const onFocus = () => { void refreshLimits() }
    window.addEventListener('focus', onFocus)
    const timer = window.setInterval(() => { void refreshLimits() }, 45000)

    return () => {
      cancelled = true
      window.removeEventListener('focus', onFocus)
      window.clearInterval(timer)
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const modifier = event.ctrlKey || event.metaKey
      if (modifier && event.shiftKey && event.key.toLowerCase() === 'a') {
        event.preventDefault()
        navigate('/admin')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigate])

  return (
    <div className="page-shell">
      <AdSenseLoader />
      <div className="ambient-bg" aria-hidden="true" />
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
