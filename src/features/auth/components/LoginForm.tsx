import { type FormEvent, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { APP_NAME } from '../../../shared/constants/branding'
import { useAuth } from '../hooks/useAuth.tsx'
import { GoogleContinueButton } from './GoogleContinueButton.tsx'

export function LoginForm() {
  const { login, continueWithGoogle, firebaseReady } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = (location.state as { from?: string } | null)?.from || '/tools'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (!email.trim() || password.length < 6) {
      setError('Enter a valid email and password.')
      return
    }

    setSubmitting(true)
    try {
      await login({ email, password })
      navigate(redirectTo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-form-copy">
        <p className="eyebrow">Welcome back</p>
        <h1>Log in to {APP_NAME}</h1>
        <p className="auth-lead">Sign in with Firebase to use PDF tools.</p>
      </div>

      {!firebaseReady ? (
        <p className="auth-error">
          Add Firebase web config to <code>.env</code> (see <code>.env.example</code>), then restart Vite.
        </p>
      ) : null}

      <GoogleContinueButton
        disabled={submitting || !firebaseReady}
        onContinue={async () => {
          setError('')
          await continueWithGoogle()
          navigate(redirectTo)
        }}
      />

      <div className="auth-divider" role="separator" aria-label="or">
        <span>or</span>
      </div>

      <label className="auth-field">
        <span>Email</span>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
        />
      </label>

      <label className="auth-field">
        <span>Password</span>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Your password"
          minLength={6}
          required
        />
      </label>

      {error ? <p className="auth-error">{error}</p> : null}

      <button className="auth-submit" type="submit" disabled={submitting || !firebaseReady}>
        {submitting ? 'Logging in…' : 'Log in'}
      </button>

      <p className="auth-switch">
        New here? <Link to="/signup">Sign up</Link>
      </p>
    </form>
  )
}
