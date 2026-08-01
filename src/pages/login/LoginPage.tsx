import { LoginForm } from '../../features/auth/index.ts'

export function LoginPage() {
  return (
    <section className="auth-page">
      <div className="auth-card">
        <LoginForm />
      </div>
      <aside className="auth-aside" aria-hidden="true">
        <h2>Your PDF workspace is waiting</h2>
        <p>Pick up your documents and tools in one place — fast, private, and ready when you are.</p>
      </aside>
    </section>
  )
}
