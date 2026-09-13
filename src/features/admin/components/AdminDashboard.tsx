import { startTransition, useEffect, useState, type FormEvent } from 'react'
import {
  adminLogin,
  adminLogout,
  adminMe,
  clearAdminToken,
  clearAdminUsage,
  deleteAdminUser,
  fetchAdminSettings,
  fetchAdminSystem,
  fetchAdminUsage,
  fetchAdminUsers,
  getAdminToken,
  resetAdminSettings,
  saveAdminSettings,
  saveAdminUser,
  type AdminSettings,
  type ManagedUser,
  type PayPalShowcase,
  type SystemStatus,
  type UsageSnapshot,
} from '../../../shared/api/admin'
import { PAGE_SEO, SeoHead } from '../../../shared/seo'

type TabId = 'overview' | 'users' | 'limits' | 'pricing' | 'paypal' | 'usage' | 'site' | 'setup'

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'limits', label: 'User limits' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'paypal', label: 'PayPal sandbox' },
  { id: 'usage', label: 'Usage' },
  { id: 'site', label: 'Site' },
  { id: 'setup', label: 'Setup' },
]

const EMPTY_USER_FORM = {
  email: '',
  uid: '',
  plan: 'free',
  blocked: false,
  maxFileMb: '',
  maxJobsPerDay: '',
  maxMergeFiles: '',
  note: '',
}

const DEMO_PAYPAL: PayPalShowcase = {
  mode: 'sandbox',
  configured: false,
  clientIdMasked: 'AXxx…demo (not set)',
  secretConfigured: false,
  apiBase: 'https://api-m.sandbox.paypal.com',
  dashboardUrl: 'https://developer.paypal.com/dashboard/',
  sandboxAccountsUrl: 'https://developer.paypal.com/dashboard/accounts',
  checkoutReturn: 'http://localhost:5173/checkout/success',
  checkoutCancel: 'http://localhost:5173/checkout/cancel',
  demoNote: 'PayPal Sandbox showcase — for display/testing only. No real charges.',
  plans: [
    { id: 'pro_monthly', name: 'Pro Monthly', amount: '9.99', currency: 'USD', interval: 'monthly', priceLabel: '$9.99' },
    { id: 'pro_annual', name: 'Pro Annual', amount: '59.99', currency: 'USD', interval: 'annual', priceLabel: '$59.99' },
  ],
}

function featuresText(features: string[]) {
  return features.join('\n')
}

function parseFeatures(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function PayPalSandboxPanel({ paypal }: { paypal: PayPalShowcase }) {
  return (
    <div className="admin-stack">
      <div className="admin-card paypal-sandbox-card">
        <div className="paypal-sandbox-header">
          <div>
            <p className="content-eyebrow">Payments</p>
            <h2>PayPal Sandbox</h2>
            <p className="admin-lead">{paypal.demoNote}</p>
          </div>
          <span className={`paypal-mode-badge ${paypal.mode === 'live' ? 'live' : 'sandbox'}`}>
            {paypal.mode === 'live' ? 'LIVE' : 'SANDBOX'}
          </span>
        </div>

        <div className="paypal-status-grid">
          <div>
            <span className="paypal-label">Status</span>
            <strong>
              {paypal.configured
                ? (paypal.mode === 'live' ? 'Live connected' : 'Sandbox connected')
                : paypal.practice
                  ? 'Practice placeholders (demo checkout)'
                  : 'Demo only (keys not set)'}
            </strong>
          </div>
          <div>
            <span className="paypal-label">Client ID</span>
            <code>{paypal.clientIdMasked}</code>
          </div>
          <div>
            <span className="paypal-label">Secret</span>
            <strong>{paypal.secretConfigured ? 'Configured' : 'Missing'}</strong>
          </div>
          <div>
            <span className="paypal-label">API</span>
            <code>{paypal.apiBase}</code>
          </div>
        </div>

        <div className="paypal-links">
          <a href={paypal.dashboardUrl} target="_blank" rel="noreferrer">Developer dashboard</a>
          <a href={paypal.sandboxAccountsUrl} target="_blank" rel="noreferrer">Sandbox test accounts</a>
        </div>

        <div className="paypal-urls">
          <p><span>Return URL</span> <code>{paypal.checkoutReturn}</code></p>
          <p><span>Cancel URL</span> <code>{paypal.checkoutCancel}</code></p>
        </div>
      </div>

      <div className="admin-card">
        <h2>Sandbox plan amounts (display)</h2>
        <p className="admin-lead">These are the Pro amounts shown for checkout testing. Edit them under Pricing.</p>
        <div className="paypal-plan-grid">
          {paypal.plans.map((plan) => (
            <article key={plan.id} className="paypal-plan-card">
              <h3>{plan.name || plan.id}</h3>
              <p className="paypal-plan-price">{plan.priceLabel || `$${plan.amount}`}</p>
              <p>{plan.amount} {plan.currency} · {plan.interval}</p>
              <span className="paypal-sandbox-chip">Sandbox checkout</span>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

export function AdminDashboard() {
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(Boolean(getAdminToken()))
  const [password, setPassword] = useState('')
  const [tab, setTab] = useState<TabId>('overview')
  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [usage, setUsage] = useState<UsageSnapshot | null>(null)
  const [system, setSystem] = useState<SystemStatus | null>(null)
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [userForm, setUserForm] = useState(EMPTY_USER_FORM)
  const [loadingExtras, setLoadingExtras] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [savingUser, setSavingUser] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [signingIn, setSigningIn] = useState(false)

  const patchSettings = (updater: (current: AdminSettings) => AdminSettings) => {
    startTransition(() => {
      setSettings((current) => (current ? updater(current) : current))
    })
  }

  const loadSettingsFast = async () => {
    const next = await fetchAdminSettings()
    setSettings(next)
    return next
  }

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      setUsers(await fetchAdminUsers())
    } finally {
      setLoadingUsers(false)
    }
  }

  const loadExtras = async () => {
    setLoadingExtras(true)
    try {
      const [nextUsage, nextSystem] = await Promise.all([
        fetchAdminUsage(),
        fetchAdminSystem(),
      ])
      setUsage(nextUsage)
      setSystem(nextSystem)
    } finally {
      setLoadingExtras(false)
    }
  }

  const refreshAll = async () => {
    await loadSettingsFast()
    await Promise.all([loadExtras(), loadUsers()])
  }

  useEffect(() => {
    let cancelled = false
    async function boot() {
      const token = getAdminToken()
      if (!token) {
        setChecking(false)
        return
      }
      try {
        await adminMe()
        if (cancelled) return
        setAuthed(true)
        setChecking(false)
        await loadSettingsFast()
        if (!cancelled) {
          void loadExtras()
          void loadUsers()
        }
      } catch {
        clearAdminToken()
        if (!cancelled) {
          setAuthed(false)
          setChecking(false)
        }
      }
    }
    // Don't block the login form behind a hanging /me call for more than a moment.
    const safety = window.setTimeout(() => {
      if (!cancelled) setChecking(false)
    }, 2500)
    boot()
    return () => {
      cancelled = true
      window.clearTimeout(safety)
    }
  }, [])

  const handleLogin = async (event?: FormEvent) => {
    event?.preventDefault()
    if (signingIn) return
    setSigningIn(true)
    setError(null)
    setMessage(null)
    try {
      await adminLogin(password)
      setPassword('')
      setAuthed(true)
      setMessage('Signed in to admin.')
      await loadSettingsFast()
      void loadExtras()
      void loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setSigningIn(false)
    }
  }

  const handleLogout = async () => {
    await adminLogout()
    setAuthed(false)
    setSettings(null)
    setUsage(null)
    setSystem(null)
    setUsers([])
    setUserForm(EMPTY_USER_FORM)
    setMessage('Signed out.')
  }

  const handleSaveUser = async () => {
    if (!userForm.email.trim() && !userForm.uid.trim()) {
      setError('Enter a user email or Firebase uid.')
      return
    }
    setSavingUser(true)
    setError(null)
    setMessage(null)
    try {
      const saved = await saveAdminUser({
        email: userForm.email.trim(),
        uid: userForm.uid.trim(),
        plan: userForm.plan,
        blocked: userForm.blocked,
        maxFileMb: userForm.maxFileMb === '' ? null : Number(userForm.maxFileMb),
        maxJobsPerDay: userForm.maxJobsPerDay === '' ? null : Number(userForm.maxJobsPerDay),
        maxMergeFiles: userForm.maxMergeFiles === '' ? null : Number(userForm.maxMergeFiles),
        note: userForm.note,
      })
      setUsers((current) => {
        const without = current.filter((row) => row.id !== saved.id && row.email !== saved.email)
        return [...without, saved].sort((a, b) => (a.email || a.id).localeCompare(b.email || b.id))
      })
      setUserForm(EMPTY_USER_FORM)
      setMessage(`Saved limits for ${saved.email || saved.uid || saved.id}. Changes apply on their next tool run.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save user.')
    } finally {
      setSavingUser(false)
    }
  }

  const handleEditUser = (row: ManagedUser) => {
    setUserForm({
      email: row.email || '',
      uid: row.uid || '',
      plan: row.plan || 'free',
      blocked: Boolean(row.blocked),
      maxFileMb: row.maxFileMb == null ? '' : String(row.maxFileMb),
      maxJobsPerDay: row.maxJobsPerDay == null ? '' : String(row.maxJobsPerDay),
      maxMergeFiles: row.maxMergeFiles == null ? '' : String(row.maxMergeFiles),
      note: row.note || '',
    })
    setTab('users')
  }

  const handleDeleteUser = async (row: ManagedUser) => {
    if (!window.confirm(`Remove managed limits for ${row.email || row.uid || row.id}?`)) return
    setError(null)
    try {
      await deleteAdminUser(row.id)
      setUsers((current) => current.filter((item) => item.id !== row.id))
      setMessage('Managed user removed.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete user.')
    }
  }

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const saved = await saveAdminSettings(settings)
      setSettings(saved)
      setMessage('Settings saved. Pricing and limits are live for the site.')
      void fetchAdminSystem().then(setSystem).catch(() => undefined)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleResetSettings = async () => {
    if (!window.confirm('Reset all admin limits, pricing, and site settings to defaults?')) return
    setSaving(true)
    setError(null)
    try {
      const saved = await resetAdminSettings()
      setSettings(saved)
      setMessage('Settings reset to defaults.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleClearUsage = async () => {
    if (!window.confirm('Clear today’s usage counters?')) return
    setError(null)
    try {
      const next = await clearAdminUsage()
      setUsage(next)
      setMessage('Usage counters cleared for today.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not clear usage.')
    }
  }

  if (checking) {
    return (
      <section className="content-page admin-page">
        <SeoHead {...PAGE_SEO.admin} />
        <header className="content-page-hero">
          <p className="content-eyebrow">Admin</p>
          <h1>Checking session…</h1>
        </header>
      </section>
    )
  }

  if (!authed) {
    return (
      <section className="content-page admin-page">
        <SeoHead {...PAGE_SEO.admin} />
        <header className="content-page-hero">
          <p className="content-eyebrow">Admin</p>
          <h1>Admin sign in</h1>
          <p>Manage Free/Pro limits, pricing, usage, and site controls.</p>
        </header>
        <form className="admin-card admin-login" onSubmit={handleLogin}>
          <label htmlFor="admin-password">
            Admin password
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button
            type="submit"
            className="plan-cta admin-signin-btn"
            disabled={signingIn}
          >
            {signingIn ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="admin-hint">Use the admin password from your server environment. Do not share it publicly.</p>
          {error ? <p className="admin-error" role="alert">{error}</p> : null}
        </form>
      </section>
    )
  }

  const paypal = system?.paypal || DEMO_PAYPAL

  return (
    <section className="content-page admin-page">
      <SeoHead {...PAGE_SEO.admin} />
      <header className="content-page-hero admin-hero">
        <div>
          <p className="content-eyebrow">Admin</p>
          <h1>Control center</h1>
          <p>Limit users, edit pricing, PayPal sandbox, and site controls.</p>
        </div>
        <div className="admin-hero-actions">
          <button
            type="button"
            className="admin-secondary-btn"
            onClick={() => refreshAll().catch((err) => setError(String(err)))}
            disabled={loadingExtras}
          >
            {loadingExtras ? 'Refreshing…' : 'Refresh'}
          </button>
          <button type="button" className="admin-secondary-btn" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>

      <nav className="admin-tabs" aria-label="Admin sections">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? 'active' : ''}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {message ? <p className="admin-success" role="status">{message}</p> : null}
      {error ? <p className="admin-error" role="alert">{error}</p> : null}

      {!settings ? (
        <div className="admin-card">
          <h2>Loading settings…</h2>
          <p className="admin-lead">Fetching limits and pricing. Overview extras load in the background.</p>
        </div>
      ) : null}

      {settings && tab === 'overview' ? (
        <div className="admin-stack">
          <div className="admin-grid">
            <article className="admin-card">
              <h2>Today</h2>
              <p className="admin-metric">{usage?.totalJobs ?? (loadingExtras ? '…' : 0)}</p>
              <p>Tool runs</p>
            </article>
            <article className="admin-card">
              <h2>Active clients</h2>
              <p className="admin-metric">{usage?.activeClients ?? (loadingExtras ? '…' : 0)}</p>
              <p>Unique browsers hitting limits tracking</p>
            </article>
            <article className="admin-card">
              <h2>Managed users</h2>
              <p className="admin-metric">{loadingUsers && !users.length ? '…' : users.length}</p>
              <p>Custom plans / tool caps</p>
            </article>
            <article className="admin-card">
              <h2>PayPal</h2>
              <p className="admin-metric small">
                {system ? (system.paypalConfigured ? 'Ready' : 'Sandbox demo') : (loadingExtras ? '…' : 'Sandbox demo')}
              </p>
              <p>Mode: {system?.paypalMode || 'sandbox'}</p>
            </article>
            <article className="admin-card">
              <h2>LibreOffice</h2>
              <p className="admin-metric small">
                {system ? (system.libreOfficeAvailable ? 'Found' : 'Missing') : (loadingExtras ? '…' : '—')}
              </p>
              <p>Needed for high-fidelity Office conversion</p>
            </article>
          </div>
          <PayPalSandboxPanel paypal={paypal} />
        </div>
      ) : null}

      {tab === 'users' ? (
        <div className="admin-stack">
          <div className="admin-card admin-form">
            <h2>Manage a user</h2>
            <p className="admin-lead">
              Set plan, block access, or override file / daily / merge limits for a signed-in account.
              Leave override fields blank to use the Free/Pro tier defaults from User limits.
            </p>
            <div className="admin-two-col">
              <label>
                Email
                <input
                  value={userForm.email}
                  onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="user@example.com"
                  autoComplete="off"
                />
              </label>
              <label>
                Firebase uid (optional)
                <input
                  value={userForm.uid}
                  onChange={(event) => setUserForm((current) => ({ ...current, uid: event.target.value }))}
                  placeholder="Firebase user id"
                  autoComplete="off"
                />
              </label>
              <label>
                Plan
                <select
                  value={userForm.plan}
                  onChange={(event) => setUserForm((current) => ({ ...current, plan: event.target.value }))}
                >
                  <option value="free">Free</option>
                  <option value="pro_monthly">Pro Monthly</option>
                  <option value="pro_annual">Pro Annual</option>
                  <option value="developer">Developer</option>
                </select>
              </label>
              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={userForm.blocked}
                  onChange={(event) => setUserForm((current) => ({ ...current, blocked: event.target.checked }))}
                />
                Block this account from tools
              </label>
              <label>
                Max file MB (override)
                <input
                  type="number"
                  min={1}
                  value={userForm.maxFileMb}
                  onChange={(event) => setUserForm((current) => ({ ...current, maxFileMb: event.target.value }))}
                  placeholder="tier default"
                />
              </label>
              <label>
                Max jobs / day (override)
                <input
                  type="number"
                  min={1}
                  value={userForm.maxJobsPerDay}
                  onChange={(event) => setUserForm((current) => ({ ...current, maxJobsPerDay: event.target.value }))}
                  placeholder="tier default"
                />
              </label>
              <label>
                Max merge files (override)
                <input
                  type="number"
                  min={1}
                  value={userForm.maxMergeFiles}
                  onChange={(event) => setUserForm((current) => ({ ...current, maxMergeFiles: event.target.value }))}
                  placeholder="tier default"
                />
              </label>
              <label>
                Note
                <input
                  value={userForm.note}
                  onChange={(event) => setUserForm((current) => ({ ...current, note: event.target.value }))}
                  placeholder="Internal note"
                />
              </label>
            </div>
            <div className="admin-hero-actions">
              <button type="button" className="plan-cta" onClick={() => void handleSaveUser()} disabled={savingUser}>
                {savingUser ? 'Saving…' : 'Save user'}
              </button>
              <button type="button" className="admin-secondary-btn" onClick={() => setUserForm(EMPTY_USER_FORM)}>
                Clear form
              </button>
              <button type="button" className="admin-secondary-btn" onClick={() => void loadUsers()} disabled={loadingUsers}>
                {loadingUsers ? 'Loading…' : 'Refresh list'}
              </button>
            </div>
          </div>

          <div className="admin-card">
            <h2>Managed users</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email / uid</th>
                    <th>Plan</th>
                    <th>Overrides</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5}>{loadingUsers ? 'Loading…' : 'No managed users yet.'}</td>
                    </tr>
                  ) : (
                    users.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <strong>{row.email || '—'}</strong>
                          {row.uid ? <div><code>{row.uid}</code></div> : null}
                          {row.note ? <div className="admin-lead">{row.note}</div> : null}
                        </td>
                        <td>{row.plan}</td>
                        <td>
                          {[
                            row.maxFileMb != null ? `${row.maxFileMb}MB` : null,
                            row.maxJobsPerDay != null ? `${row.maxJobsPerDay}/day` : null,
                            row.maxMergeFiles != null ? `merge ${row.maxMergeFiles}` : null,
                          ].filter(Boolean).join(' · ') || 'tier defaults'}
                        </td>
                        <td>{row.blocked ? 'Blocked' : 'Active'}</td>
                        <td>
                          <div className="admin-hero-actions">
                            <button type="button" className="admin-secondary-btn" onClick={() => handleEditUser(row)}>
                              Edit
                            </button>
                            <button type="button" className="admin-secondary-btn" onClick={() => void handleDeleteUser(row)}>
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {settings && tab === 'limits' ? (
        <div className="admin-card admin-form">
          <h2>Free vs Pro limits</h2>
          <p className="admin-lead">These caps apply on upload for real users. Dev mode stays unlimited locally.</p>
          <div className="admin-two-col">
            {(['free', 'pro'] as const).map((tier) => (
              <fieldset key={tier}>
                <legend>{tier === 'free' ? 'Free' : 'Pro'}</legend>
                <label>
                  Max file size (MB)
                  <input
                    type="number"
                    min={1}
                    value={settings.limits[tier].maxFileMb}
                    onChange={(event) => {
                      const value = Number(event.target.value)
                      patchSettings((current) => ({
                        ...current,
                        limits: {
                          ...current.limits,
                          [tier]: { ...current.limits[tier], maxFileMb: value },
                        },
                      }))
                    }}
                  />
                </label>
                <label>
                  Max jobs / day
                  <input
                    type="number"
                    min={1}
                    value={settings.limits[tier].maxJobsPerDay}
                    onChange={(event) => {
                      const value = Number(event.target.value)
                      patchSettings((current) => ({
                        ...current,
                        limits: {
                          ...current.limits,
                          [tier]: { ...current.limits[tier], maxJobsPerDay: value },
                        },
                      }))
                    }}
                  />
                </label>
                <label>
                  Max merge files
                  <input
                    type="number"
                    min={1}
                    value={settings.limits[tier].maxMergeFiles}
                    onChange={(event) => {
                      const value = Number(event.target.value)
                      patchSettings((current) => ({
                        ...current,
                        limits: {
                          ...current.limits,
                          [tier]: { ...current.limits[tier], maxMergeFiles: value },
                        },
                      }))
                    }}
                  />
                </label>
              </fieldset>
            ))}
          </div>
          <button type="button" className="plan-cta" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save limits'}
          </button>
        </div>
      ) : null}

      {settings && tab === 'pricing' ? (
        <div className="admin-stack">
          {(['free', 'pro_monthly', 'pro_annual'] as const).map((planId) => {
            const plan = settings.pricing[planId]
            return (
              <div className="admin-card admin-form" key={planId}>
                <h2>{plan.name || planId}</h2>
                <div className="admin-two-col">
                  <label>
                    Display name
                    <input
                      value={plan.name}
                      onChange={(event) => {
                        const value = event.target.value
                        patchSettings((current) => ({
                          ...current,
                          pricing: {
                            ...current.pricing,
                            [planId]: { ...current.pricing[planId], name: value },
                          },
                        }))
                      }}
                    />
                  </label>
                  <label>
                    Price label
                    <input
                      value={plan.price}
                      onChange={(event) => {
                        const value = event.target.value
                        patchSettings((current) => ({
                          ...current,
                          pricing: {
                            ...current.pricing,
                            [planId]: { ...current.pricing[planId], price: value },
                          },
                        }))
                      }}
                    />
                  </label>
                  {planId !== 'free' ? (
                    <label>
                      PayPal amount
                      <input
                        value={plan.amount || ''}
                        onChange={(event) => {
                          const value = event.target.value
                          patchSettings((current) => ({
                            ...current,
                            pricing: {
                              ...current.pricing,
                              [planId]: { ...current.pricing[planId], amount: value },
                            },
                          }))
                        }}
                      />
                    </label>
                  ) : null}
                  <label>
                    Period
                    <input
                      value={plan.period}
                      onChange={(event) => {
                        const value = event.target.value
                        patchSettings((current) => ({
                          ...current,
                          pricing: {
                            ...current.pricing,
                            [planId]: { ...current.pricing[planId], period: value },
                          },
                        }))
                      }}
                    />
                  </label>
                  <label>
                    Badge
                    <input
                      value={plan.badge || ''}
                      onChange={(event) => {
                        const value = event.target.value
                        patchSettings((current) => ({
                          ...current,
                          pricing: {
                            ...current.pricing,
                            [planId]: { ...current.pricing[planId], badge: value },
                          },
                        }))
                      }}
                    />
                  </label>
                  <label>
                    CTA
                    <input
                      value={plan.cta}
                      onChange={(event) => {
                        const value = event.target.value
                        patchSettings((current) => ({
                          ...current,
                          pricing: {
                            ...current.pricing,
                            [planId]: { ...current.pricing[planId], cta: value },
                          },
                        }))
                      }}
                    />
                  </label>
                </div>
                <label>
                  Details
                  <input
                    value={plan.details}
                    onChange={(event) => {
                      const value = event.target.value
                      patchSettings((current) => ({
                        ...current,
                        pricing: {
                          ...current.pricing,
                          [planId]: { ...current.pricing[planId], details: value },
                        },
                      }))
                    }}
                  />
                </label>
                <label>
                  Features (one per line)
                  <textarea
                    rows={5}
                    value={featuresText(plan.features || [])}
                    onChange={(event) => {
                      const value = event.target.value
                      patchSettings((current) => ({
                        ...current,
                        pricing: {
                          ...current.pricing,
                          [planId]: { ...current.pricing[planId], features: parseFeatures(value) },
                        },
                      }))
                    }}
                  />
                </label>
                <label className="admin-check">
                  <input
                    type="checkbox"
                    checked={Boolean(plan.featured)}
                    onChange={(event) => {
                      const checked = event.target.checked
                      patchSettings((current) => ({
                        ...current,
                        pricing: {
                          ...current.pricing,
                          [planId]: { ...current.pricing[planId], featured: checked },
                        },
                      }))
                    }}
                  />
                  Featured plan card
                </label>
              </div>
            )
          })}
          <button type="button" className="plan-cta" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save pricing'}
          </button>
        </div>
      ) : null}

      {tab === 'paypal' ? <PayPalSandboxPanel paypal={paypal} /> : null}

      {settings && tab === 'usage' ? (
        <div className="admin-card">
          <div className="admin-hero-actions" style={{ marginBottom: 12 }}>
            <h2 style={{ margin: 0, flex: 1 }}>Usage · {usage?.day || 'today'}</h2>
            <button type="button" className="admin-secondary-btn" onClick={() => void handleClearUsage()}>
              Clear today
            </button>
          </div>
          <p className="admin-lead">Daily tool runs by anonymous client id (browser). Useful to spot heavy Free usage.</p>
          {loadingExtras && !usage ? <p className="admin-lead">Loading usage…</p> : null}
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Jobs</th>
                </tr>
              </thead>
              <tbody>
                {(usage?.clients || []).length === 0 ? (
                  <tr>
                    <td colSpan={2}>{loadingExtras ? 'Loading…' : 'No runs recorded yet today.'}</td>
                  </tr>
                ) : (
                  usage?.clients.map((row) => (
                    <tr key={row.client}>
                      <td><code>{row.client}</code></td>
                      <td>{row.jobs}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === 'setup' ? (
        <div className="admin-stack">
          <div className="admin-card">
            <h2>What you must configure</h2>
            <p className="admin-lead">
              Admin already controls limits, pricing, site mode, and PayPal demo amounts. Complete this checklist so auth and payments work for real users.
            </p>
            <ul className="admin-checklist">
              {(system?.checklist || [
                { id: 'admin_password', label: 'Set ADMIN_PASSWORD in .env', done: false },
                { id: 'firebase', label: 'Add Firebase web keys (VITE_FIREBASE_*)', done: false },
                { id: 'paypal', label: 'PayPal sandbox keys (or PAYPAL_DEMO=1)', done: true },
                { id: 'libreoffice', label: 'LibreOffice installed for Office fidelity', done: false },
              ]).map((item) => (
                <li key={item.id} className={item.done ? 'done' : ''}>
                  <span>{item.done ? '✓' : '○'}</span>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="admin-card admin-form">
            <h2>Firebase Auth</h2>
            <p className="admin-lead">
              Status: <strong>{system?.firebaseConfigured ? 'Keys detected on server env' : 'Not configured'}</strong>
              {system?.firebaseProjectId ? <> · project <code>{system.firebaseProjectId}</code></> : null}
            </p>
            <ol className="admin-steps">
              <li>Open Firebase Console → your project → Project settings → Your apps → Web app.</li>
              <li>Copy apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId into <code>.env</code> as <code>VITE_FIREBASE_*</code>.</li>
              <li>Authentication → Sign-in method → enable <strong>Email/Password</strong> and <strong>Google</strong>.</li>
              <li>Authentication → Settings → Authorized domains → add <code>localhost</code>.</li>
              <li>Restart <code>npm run dev</code> after saving <code>.env</code>.</li>
            </ol>
          </div>

          <div className="admin-card admin-form">
            <h2>Admin actions</h2>
            <p className="admin-lead">Danger zone — resets product settings stored in <code>backend/output/admin_settings.json</code>.</p>
            <div className="admin-hero-actions">
              <button type="button" className="admin-secondary-btn" onClick={() => void handleResetSettings()} disabled={saving}>
                Reset settings to defaults
              </button>
              <button type="button" className="admin-secondary-btn" onClick={() => void handleClearUsage()}>
                Clear usage today
              </button>
            </div>
          </div>

          <div className="admin-card">
            <h2>Developer note</h2>
            <p className="admin-lead">
              In <code>npm run dev</code> you stay unlimited (Dev badge) and tools do <strong>not</strong> force login.
              To test login gating like a real user, set <code>VITE_FORCE_AUTH=true</code> and <code>VITE_FORCE_PLAN_LIMITS=true</code>, then restart Vite.
            </p>
          </div>
        </div>
      ) : null}

      {settings && tab === 'site' ? (
        <div className="admin-card admin-form">
          <h2>Site controls</h2>
          <label className="admin-check">
            <input
              type="checkbox"
              checked={settings.site.maintenanceMode}
              onChange={(event) => {
                const checked = event.target.checked
                patchSettings((current) => ({
                  ...current,
                  site: { ...current.site, maintenanceMode: checked },
                }))
              }}
            />
            Maintenance mode (blocks tool uploads)
          </label>
          <label className="admin-check">
            <input
              type="checkbox"
              checked={settings.site.adsenseEnabled}
              onChange={(event) => {
                const checked = event.target.checked
                patchSettings((current) => ({
                  ...current,
                  site: { ...current.site, adsenseEnabled: checked },
                }))
              }}
            />
            AdSense enabled flag (for ops visibility)
          </label>
          <label>
            Support email
            <input
              value={settings.site.supportEmail}
              onChange={(event) => {
                const value = event.target.value
                patchSettings((current) => ({
                  ...current,
                  site: { ...current.site, supportEmail: value },
                }))
              }}
            />
          </label>
          <label>
            Site announcement
            <textarea
              rows={3}
              value={settings.site.announcement}
              onChange={(event) => {
                const value = event.target.value
                patchSettings((current) => ({
                  ...current,
                  site: { ...current.site, announcement: value },
                }))
              }}
              placeholder="Optional banner text shown on Home / Pricing"
            />
          </label>
          <button type="button" className="plan-cta" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save site settings'}
          </button>
        </div>
      ) : null}
    </section>
  )
}
