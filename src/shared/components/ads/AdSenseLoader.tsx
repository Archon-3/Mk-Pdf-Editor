import { useEffect } from 'react'
import { ADSENSE_CLIENT_ID } from '../../constants/branding'
import { ensureAdSenseScript } from './ensureAdSenseScript'

/** Preloads AdSense on app shell when a client ID is present. */
export function AdSenseLoader() {
  useEffect(() => {
    if (ADSENSE_CLIENT_ID) ensureAdSenseScript()
  }, [])

  return null
}
