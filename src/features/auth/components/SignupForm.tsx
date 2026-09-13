import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { APP_NAME } from '../../../shared/constants/branding'
import { useAuth } from '../hooks/useAuth.tsx'
import { GoogleContinueButton } from './GoogleContinueButton.tsx'

export function SignupForm() {
  const { signup, continueWithGoogle, firebaseReady } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (!name.trim() || !email.trim() || password.length < 6) {
      setError('Please fill in all fields with valid information.')
      return
    }

    setSubmitting(true)
    try {
      await signup({ name, email, password })
      navigate('/tools')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-form-copy">
        <p className="eyebrow">Get started free</p>
        <h1>Create your {APP_NAME} account</h1>
        <p className="auth-lead">Sign up with Firebase — then open the tools workspace.</p>
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
          navigate('/tools')
        }}
      />

      <div className="auth-divider" role="separator" aria-label="or">
        <span>or</span>
      </div>

      <label className="auth-field">
        <span>Name</span>
        <input
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          required
        />
      </label>

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
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Create a password"
          minLength={6}
          required
        />
      </label>

      {error ? <p className="auth-error">{error}</p> : null}

      <button className="auth-submit" type="submit" disabled={submitting || !firebaseReady}>
        {submitting ? 'Creating account…' : 'Sign up'}
      </button>

      <p className="auth-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </form>
  )
}
