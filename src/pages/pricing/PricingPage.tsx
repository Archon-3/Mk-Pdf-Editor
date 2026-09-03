import { PricingFaqs, PricingHero, PricingPlans } from '../../features/pricing'
import { AdUnit } from '../../shared/components/ads'

export function PricingPage() {
  return (
    <section className="content-page pricing-page">
      <PricingHero />
      <PricingPlans />
      <AdUnit slot={import.meta.env.VITE_ADSENSE_SLOT_PRICING} className="content-ad-slot" label="Advertisement" />
      <PricingFaqs />
    </section>
  )
}
