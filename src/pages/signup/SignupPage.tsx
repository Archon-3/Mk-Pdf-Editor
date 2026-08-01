import { SignupForm } from '../../features/auth/index.ts'

export function SignupPage() {
  return (
    <section className="auth-page">
      <div className="auth-card">
        <SignupForm />
      </div>
      <aside className="auth-aside" aria-hidden="true">
        <h2>Your PDF workspace is waiting</h2>
        <p>Pick up your documents and tools in one place — fast, private, and ready when you are.</p>
      </aside>
    </section>
  )
}
