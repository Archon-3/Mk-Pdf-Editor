import { PricingFaqs, PricingHero, PricingPlans } from '../../features/pricing'
import { AdUnit } from '../../shared/components/ads'
import { PAGE_SEO, SeoHead } from '../../shared/seo'

export function PricingPage() {
  const seo = PAGE_SEO.pricing
  return (
    <section className="content-page pricing-page">
      <SeoHead {...seo} />
      <PricingHero />
      <PricingPlans />
      <AdUnit slot={import.meta.env.VITE_ADSENSE_SLOT_PRICING} className="content-ad-slot" label="Advertisement" />
      <PricingFaqs />
    </section>
  )
}
