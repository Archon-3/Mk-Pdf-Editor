import { ADSENSE_CLIENT_ID } from '../../constants/branding'

const SCRIPT_ID = 'mk-adsense-script'

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

/** Loads the AdSense script once when a publisher ID is configured. */
export function ensureAdSenseScript() {
  if (!ADSENSE_CLIENT_ID || typeof document === 'undefined') return
  if (document.getElementById(SCRIPT_ID)) return

  const script = document.createElement('script')
  script.id = SCRIPT_ID
  script.async = true
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`
  script.crossOrigin = 'anonymous'
  document.head.appendChild(script)
}
