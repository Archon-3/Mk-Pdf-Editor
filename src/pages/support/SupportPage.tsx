import { ContactForm, FaqList, SupportHero } from '../../features/support'
import { AdUnit } from '../../shared/components/ads'

export function SupportPage() {
  return (
    <section className="content-page support-page">
      <SupportHero />
      <div className="support-page-grid">
        <FaqList />
        <ContactForm />
      </div>
      <AdUnit slot={import.meta.env.VITE_ADSENSE_SLOT_SUPPORT} className="content-ad-slot" label="Advertisement" />
    </section>
  )
}
