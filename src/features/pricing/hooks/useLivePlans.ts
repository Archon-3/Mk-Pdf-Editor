import { useEffect, useState } from 'react'
import { fetchPublicSettings, pricingToPlans, type PublicSettings } from '../../../shared/api/admin'
import { applyRemoteLimits } from '../../../shared/plan'
import type { Plan } from '../../../shared/types'
import { pricingPagePlans } from '../data/plans'

let cachedSettings: PublicSettings | null = null

function applySettings(
  settings: PublicSettings,
  setPlans: (plans: Plan[]) => void,
  setSite: (site: PublicSettings['site']) => void,
) {
  cachedSettings = settings
  applyRemoteLimits(settings.limits)
  setPlans(pricingToPlans(settings.pricing))
  setSite(settings.site)
}

/** Live pricing/limits from admin — refreshes on focus and every 45s. */
export function useLivePlans() {
  const [plans, setPlans] = useState<Plan[]>(() => (
    cachedSettings ? pricingToPlans(cachedSettings.pricing) : pricingPagePlans
  ))
  const [site, setSite] = useState<PublicSettings['site'] | null>(cachedSettings?.site ?? null)
  const [loading, setLoading] = useState(!cachedSettings)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const settings = await fetchPublicSettings()
        if (cancelled) return
        applySettings(settings, setPlans, setSite)
        setError(null)
      } catch (err: unknown) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Could not load live pricing.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    const onFocus = () => { void load() }
    window.addEventListener('focus', onFocus)
    const timer = window.setInterval(() => { void load() }, 45000)

    return () => {
      cancelled = true
      window.removeEventListener('focus', onFocus)
      window.clearInterval(timer)
    }
  }, [])

  return { plans, site, loading, error }
}
