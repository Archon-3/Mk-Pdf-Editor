import { useEffect, useRef } from 'react'
import { ADSENSE_CLIENT_ID } from '../../constants/branding'
import { ensureAdSenseScript } from './ensureAdSenseScript'

type AdUnitProps = {
  slot?: string
  format?: string
  className?: string
  label?: string
}

export function AdUnit({
  slot,
  format = 'auto',
  className,
  label = 'Advertisement',
}: AdUnitProps) {
  const pushed = useRef(false)
  const enabled = Boolean(ADSENSE_CLIENT_ID && slot)

  useEffect(() => {
    if (!enabled) return
    ensureAdSenseScript()
    if (pushed.current) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      pushed.current = true
    } catch {
      // Ad blockers or missing approval can throw; ignore quietly.
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <aside className={className ?? 'ad-unit'} aria-label={label}>
      <span className="ad-unit-label">{label}</span>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </aside>
  )
}
