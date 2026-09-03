import { Link } from 'react-router-dom'

export function FinalCta() {
  return (
    <section className="final-cta">
      <h2>Ready to simplify your PDF workflow?</h2>
      <p>Start editing your PDFs in seconds.</p>
      <Link to="/tools">Open tools</Link>
    </section>
  )
}
