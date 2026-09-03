import { supportFaqs } from '../data/content'

export function FaqList() {
  return (
    <section className="content-faq-block" aria-labelledby="support-faq-heading">
      <h2 id="support-faq-heading">Frequently asked questions</h2>
      <div className="content-faq-list">
        {supportFaqs.map((item) => (
          <details key={item.question} className="content-faq-item">
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
