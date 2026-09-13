import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isDeveloperUnlimited } from '../../../shared/plan'
import { useAuth } from '../hooks/useAuth.tsx'

/** Protect tools for real users. Developers skip login unless VITE_FORCE_AUTH=true. */
export function RequireAuth() {
  const { isAuthenticated, isLoading, firebaseReady } = useAuth()
  const location = useLocation()
  const forceAuth = import.meta.env.VITE_FORCE_AUTH === 'true'
  const bypass = isDeveloperUnlimited() && !forceAuth

  if (bypass) {
    return <Outlet />
  }

  if (isLoading) {
    return (
      <section className="content-page">
        <header className="content-page-hero">
          <p className="content-eyebrow">Account</p>
          <h1>Checking sign-in…</h1>
        </header>
      </section>
    )
  }

  if (!firebaseReady) {
    return (
      <section className="content-page">
        <header className="content-page-hero">
          <p className="content-eyebrow">Setup needed</p>
          <h1>Firebase Auth is not connected</h1>
          <p>Add your Firebase web app keys to <code>.env</code>, enable Email/Password + Google in Firebase Console, then restart Vite.</p>
        </header>
      </section>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
