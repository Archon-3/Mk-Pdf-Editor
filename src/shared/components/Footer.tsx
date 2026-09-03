import { Link } from 'react-router-dom'
import { APP_NAME, APP_TAGLINE } from '../constants/branding'

export function Footer() {
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
          <a href="#">About</a>
          <a href="#">Careers</a>
          <Link to="/support">Contact</Link>
        </div>
        <div>
          <h4>Support</h4>
          <Link to="/support">Help Center</Link>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms</a>
        </div>
        <div className="newsletter">
          <h4>Subscribe</h4>
          <p>Get latest updates and tips.</p>
          <div>
            <input type="email" placeholder="Enter your email" />
            <button type="button">Send</button>
          </div>
        </div>
      </div>
      <p className="copyright">© 2026 {APP_NAME}. All rights reserved.</p>
    </footer>
  )
}
