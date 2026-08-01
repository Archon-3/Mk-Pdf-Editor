import { Link } from 'react-router-dom'
import { APP_NAME } from '../../../shared/constants/branding'

export function Hero() {
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">All-in-One PDF Editor</p>
        <h1>
          Edit PDFs
          <span>Effortlessly</span>
        </h1>
        <p className="lead">
          Powerful PDF tools to merge, convert, compress, edit, and secure your documents all in one place.
        </p>

        <div className="cta-row">
          <Link className="primary-cta" to="/tools">
            Get Started
          </Link>
        </div>

        <div className="hero-micro">
          <span>Free to use</span>
          <span>No signup required</span>
          <span>Fast & secure</span>
        </div>
      </div>

      <div className="hero-preview" aria-hidden="true">
        <div className="preview-toolbar">
          <span>AI Tools</span>
          <span>100%</span>
          <span>Download</span>
        </div>
        <div className="preview-body">
          <aside>
            <p>Merge PDF</p>
            <p>Split PDF</p>
            <p>Compress PDF</p>
            <p>Rotate PDF</p>
            <p>Delete Pages</p>
          </aside>
          <article>
            <h3>Work Smarter with {APP_NAME}</h3>
            <p>Your all-in-one solution for editing, converting, and managing PDFs with ease.</p>
            <div className="preview-art" />
          </article>
        </div>
      </div>
    </section>
  )
}
