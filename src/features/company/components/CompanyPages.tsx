import { aboutContent, careersContent, privacyContent, termsContent } from '../data/content'

type ContentSection = { heading: string; body: string }

function LegalLayout({
  eyebrow,
  title,
  intro,
  updated,
  sections,
}: {
  eyebrow: string
  title: string
  intro?: string
  updated?: string
  sections: ContentSection[]
}) {
  return (
    <section className="content-page">
      <header className="content-page-hero">
        <p className="content-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {intro ? <p>{intro}</p> : null}
        {updated ? <p className="legal-updated">Last updated: {updated}</p> : null}
      </header>
      <div className="legal-sections">
        {sections.map((section) => (
          <article key={section.heading} className="legal-card">
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export function AboutPageContent() {
  return (
    <LegalLayout
      eyebrow="Company"
      title={aboutContent.title}
      intro={aboutContent.intro}
      sections={aboutContent.sections}
    />
  )
}

export function CareersPageContent() {
  return (
    <section className="content-page">
      <header className="content-page-hero">
        <p className="content-eyebrow">Company</p>
        <h1>{careersContent.title}</h1>
        <p>{careersContent.intro}</p>
      </header>
      <div className="legal-sections">
        {careersContent.roles.map((role) => (
          <article key={role.title} className="legal-card">
            <h2>{role.title}</h2>
            <p className="role-type">{role.type}</p>
            <p>{role.summary}</p>
            <a className="text-link" href={`mailto:${careersContent.applyEmail}?subject=${encodeURIComponent(`Application: ${role.title}`)}`}>
              Apply by email
            </a>
          </article>
        ))}
      </div>
    </section>
  )
}

export function PrivacyPageContent() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title={privacyContent.title}
      updated={privacyContent.updated}
      sections={privacyContent.sections}
    />
  )
}

export function TermsPageContent() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title={termsContent.title}
      updated={termsContent.updated}
      sections={termsContent.sections}
    />
  )
}
