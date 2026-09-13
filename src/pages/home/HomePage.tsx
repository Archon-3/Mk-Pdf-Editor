import { FinalCta, Hero, ToolsShowcase, ValuePricing } from '../../features/landing'
import { AdUnit } from '../../shared/components/ads'
import { absoluteUrl, PAGE_SEO, SeoHead, SITE_NAME } from '../../shared/seo'

export function HomePage() {
  const seo = PAGE_SEO.home
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_NAME,
    url: absoluteUrl('/'),
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript. Works in Chrome, Edge, Firefox, Safari.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: seo.description,
  }

  return (
    <>
      <SeoHead {...seo} keywords={seo.keywords} jsonLd={jsonLd} />
      <Hero />
      <ToolsShowcase />
      <AdUnit slot={import.meta.env.VITE_ADSENSE_SLOT_HOME} className="content-ad-slot home-ad-slot" label="Advertisement" />
      <ValuePricing />
      <FinalCta />
    </>
  )
}
