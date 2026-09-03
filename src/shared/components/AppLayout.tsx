import { Outlet } from 'react-router-dom'
import { AdSenseLoader } from './ads'
import { Footer } from './Footer'
import { Header } from './Header'

export function AppLayout() {
  return (
    <div className="page-shell">
      <AdSenseLoader />
      <div className="ambient-bg" aria-hidden="true" />
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
