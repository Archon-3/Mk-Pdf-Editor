export type PlanTier = 'free' | 'pro_monthly' | 'pro_annual' | 'developer'

export const PLAN_STORAGE_KEY = 'mkpdf.plan'
export const PLAN_USAGE_KEY = 'mkpdf.usage'

export const FREE_MAX_FILE_BYTES = 50 * 1024 * 1024
export const PRO_MAX_FILE_BYTES = 200 * 1024 * 1024
export const DEV_MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024
export const FREE_MAX_JOBS_PER_DAY = 15
export const PRO_MAX_JOBS_PER_DAY = 500
export const DEV_MAX_JOBS_PER_DAY = 100_000
export const FREE_MAX_MERGE_FILES = 3
export const PRO_MAX_MERGE_FILES = 30
export const DEV_MAX_MERGE_FILES = 500

const PRO_PLANS = new Set(['pro_monthly', 'pro_annual', 'pro'])
const DEV_PLANS = new Set(['developer', 'dev', 'unlimited'])

/** Local Vite / explicit env: you (the developer) are not gated like Free users. */
export function isDeveloperUnlimited() {
  if (import.meta.env.VITE_FORCE_PLAN_LIMITS === 'true') return false
  return import.meta.env.DEV || import.meta.env.VITE_DEV_UNLIMITED === 'true'
}

export function normalizePlan(planId?: string | null): PlanTier {
  const value = (planId || 'free').trim().toLowerCase()
  if (DEV_PLANS.has(value) || isDeveloperUnlimited()) return 'developer'
  if (value === 'pro') return 'pro_monthly'
  if (value === 'pro_monthly' || value === 'pro_annual') return value
  return 'free'
}

export function isProPlan(planId?: string | null) {
  const plan = normalizePlan(planId)
  return plan === 'developer' || PRO_PLANS.has(plan)
}

export function getStoredPlan(): PlanTier {
  if (isDeveloperUnlimited()) return 'developer'
  if (typeof window === 'undefined') return 'free'
  return normalizePlan(window.localStorage.getItem(PLAN_STORAGE_KEY))
}

export function setStoredPlan(planId: string) {
  if (typeof window === 'undefined') return
  // Keep local unlimited mode even if checkout writes a Pro plan id.
  if (isDeveloperUnlimited()) {
    window.localStorage.setItem(PLAN_STORAGE_KEY, 'developer')
    return
  }
  window.localStorage.setItem(PLAN_STORAGE_KEY, normalizePlan(planId))
}

export function clearStoredPlan() {
  if (typeof window === 'undefined') return
  if (isDeveloperUnlimited()) {
    window.localStorage.setItem(PLAN_STORAGE_KEY, 'developer')
    return
  }
  window.localStorage.setItem(PLAN_STORAGE_KEY, 'free')
}

export function getPlanLimits(planId?: string | null) {
  const plan = normalizePlan(planId ?? getStoredPlan())

  if (plan === 'developer') {
    return {
      plan,
      isPro: true,
      isDeveloper: true,
      maxFileBytes: DEV_MAX_FILE_BYTES,
      maxFileLabel: '2GB',
      maxJobsPerDay: DEV_MAX_JOBS_PER_DAY,
      maxMergeFiles: DEV_MAX_MERGE_FILES,
      label: 'Dev',
    }
  }

  const pro = isProPlan(plan)
  return {
    plan,
    isPro: pro,
    isDeveloper: false,
    maxFileBytes: pro ? PRO_MAX_FILE_BYTES : FREE_MAX_FILE_BYTES,
    maxFileLabel: pro ? '200MB' : '50MB',
    maxJobsPerDay: pro ? PRO_MAX_JOBS_PER_DAY : FREE_MAX_JOBS_PER_DAY,
    maxMergeFiles: pro ? PRO_MAX_MERGE_FILES : FREE_MAX_MERGE_FILES,
    label: pro ? (plan === 'pro_annual' ? 'Pro Annual' : 'Pro') : 'Free',
  }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function getLocalUsageCount() {
  if (typeof window === 'undefined') return 0
  if (isDeveloperUnlimited()) return 0
  try {
    const raw = window.localStorage.getItem(PLAN_USAGE_KEY)
    if (!raw) return 0
    const parsed = JSON.parse(raw) as { day?: string; count?: number }
    if (parsed.day !== todayKey()) return 0
    return Number(parsed.count || 0)
  } catch {
    return 0
  }
}

export function incrementLocalUsage() {
  if (typeof window === 'undefined') return 0
  if (isDeveloperUnlimited()) return 0
  const count = getLocalUsageCount() + 1
  window.localStorage.setItem(PLAN_USAGE_KEY, JSON.stringify({ day: todayKey(), count }))
  return count
}

export function assertFilesAllowed(files: File[], toolId: string, planId?: string | null) {
  const limits = getPlanLimits(planId ?? getStoredPlan())
  if (limits.isDeveloper) return { ok: true as const, limits }

  for (const file of files) {
    if (file.size > limits.maxFileBytes) {
      return {
        ok: false as const,
        message: limits.isPro
          ? `This file exceeds the Pro upload limit of ${limits.maxFileLabel}.`
          : `Free plan allows files up to ${limits.maxFileLabel}. Upgrade to Pro for larger files.`,
        limits,
      }
    }
  }

  if (toolId === 'merge' && files.length > limits.maxMergeFiles) {
    return {
      ok: false as const,
      message: limits.isPro
        ? `Pro can merge up to ${limits.maxMergeFiles} PDFs per run.`
        : `Free plan can merge up to ${limits.maxMergeFiles} PDFs at once. Upgrade to Pro to merge more.`,
      limits,
    }
  }

  const used = getLocalUsageCount()
  if (used >= limits.maxJobsPerDay) {
    return {
      ok: false as const,
      message: limits.isPro
        ? `Daily Pro limit of ${limits.maxJobsPerDay} runs reached.`
        : `Free plan allows ${limits.maxJobsPerDay} tool runs per day. Upgrade to Pro for a higher limit.`,
      limits,
    }
  }

  return { ok: true as const, limits }
}
