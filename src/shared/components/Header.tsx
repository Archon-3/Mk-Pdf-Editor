import { NavLink } from 'react-router-dom'
import { Logo } from './Logo'

export function Header() {
  return (
    <header className="top-nav">
      <div className="nav-content">
        <Logo href="/" />

        <nav className="main-links">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/tools">Tools</NavLink>
          <NavLink to="/pricing">Pricing</NavLink>
          <NavLink to="/support">Support</NavLink>
        </nav>
      </div>
    </header>
  )
}
