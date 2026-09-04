import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { APP_NAME, APP_TAGLINE } from '../constants/branding'
import { SUPPORT_EMAIL } from '../../features/support'

export function Footer() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const handleSubscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = email.trim()
    if (!value) {
      setStatus('Enter an email address to subscribe.')
      return
    }
    const subject = encodeURIComponent('MK PDF Editor newsletter subscription')
    const body = encodeURIComponent(`Please subscribe this address to product updates:\n\n${value}`)
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`
    setStatus('Opening your email app to confirm subscription…')
    setEmail('')
  }

  return (
    <footer className="site-footer" id="blog">
      <div className="footer-top">
        <div>
          <h3>{APP_NAME}</h3>
          <p>{APP_TAGLINE}</p>
        </div>
        <div>
          <h4>Product</h4>
          <a href="/#features">Features</a>
          <Link to="/tools">Tools</Link>
          <Link to="/pricing">Pricing</Link>
        </div>
        <div>
          <h4>Company</h4>
          <Link to="/about">About</Link>
          <Link to="/careers">Careers</Link>
          <Link to="/support">Contact</Link>
        </div>
        <div>
          <h4>Support</h4>
          <Link to="/support">Help Center</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms</Link>
        </div>
        <div className="newsletter">
          <h4>Subscribe</h4>
          <p>Get latest updates and tips.</p>
          <form onSubmit={handleSubscribe}>
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <button type="submit">Send</button>
          </form>
          {status ? <p className="newsletter-status">{status}</p> : null}
        </div>
      </div>
      <p className="copyright">© 2026 {APP_NAME}. All rights reserved.</p>
    </footer>
  )
}
