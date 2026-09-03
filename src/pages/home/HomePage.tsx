import { FinalCta, Hero, ToolsShowcase, ValuePricing } from '../../features/landing'
import { AdUnit } from '../../shared/components/ads'

export function HomePage() {
  return (
    <>
      <Hero />
      <ToolsShowcase />
      <AdUnit slot={import.meta.env.VITE_ADSENSE_SLOT_HOME} className="content-ad-slot home-ad-slot" label="Advertisement" />
      <ValuePricing />
      <FinalCta />
    </>
  )
}
