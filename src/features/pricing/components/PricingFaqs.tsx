import { pricingFaqs } from '../data/plans'

export function PricingFaqs() {
  return (
    <section className="content-faq-block" aria-labelledby="pricing-faq-heading">
      <h2 id="pricing-faq-heading">Pricing questions</h2>
      <div className="content-faq-list">
        {pricingFaqs.map((item) => (
          <details key={item.question} className="content-faq-item">
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
