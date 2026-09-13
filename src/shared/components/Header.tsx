import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../../features/auth'
import { isDeveloperUnlimited } from '../plan'
import { Logo } from './Logo'

export function Header() {
  const { user, isAuthenticated, logout, isLoading, firebaseReady } = useAuth()
  const isDev = isDeveloperUnlimited()

  return (
    <header className="top-nav">
      <div className="nav-content">
        <Logo href="/" />

        <nav className="main-links">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/tools">Tools</NavLink>
          <NavLink to="/pricing">Pricing</NavLink>
          <NavLink to="/support">Support</NavLink>
        </nav>

        <div className="nav-auth">
          {isDev ? <span className="nav-dev-chip" title="Developer unlimited — login optional">Dev</span> : null}
          {isLoading ? (
            <span className="nav-auth-muted">…</span>
          ) : isAuthenticated && user ? (
            <>
              <span className="nav-user" title={user.email}>{user.name}</span>
              <button type="button" className="nav-auth-btn ghost" onClick={() => void logout()}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link className="nav-auth-btn ghost" to="/login">Log in</Link>
              <Link className="nav-auth-btn solid" to="/signup">Sign up</Link>
              {!firebaseReady && !isDev ? (
                <span className="nav-auth-muted" title="Add Firebase keys to .env">Auth offline</span>
              ) : null}
            </>
          )}
        </div>
      </div>
    </header>
  )
}
