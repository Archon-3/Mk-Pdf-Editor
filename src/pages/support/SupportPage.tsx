import { ContactForm, FaqList, SupportHero } from '../../features/support'
import { AdUnit } from '../../shared/components/ads'
import { PAGE_SEO, SeoHead } from '../../shared/seo'

export function SupportPage() {
  const seo = PAGE_SEO.support
  return (
    <section className="content-page support-page">
      <SeoHead {...seo} />
      <SupportHero />
      <div className="support-page-grid">
        <FaqList />
        <ContactForm />
      </div>
      <AdUnit slot={import.meta.env.VITE_ADSENSE_SLOT_SUPPORT} className="content-ad-slot" label="Advertisement" />
    </section>
  )
}
