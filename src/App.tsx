import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, RequireAuth } from './features/auth'
import { AppLayout } from './shared/components/AppLayout.tsx'
import { HomePage } from './pages/home/index.ts'
import { SignupPage } from './pages/signup/index.ts'
import { LoginPage } from './pages/login/index.ts'
import { ToolsListPage, ToolPage, WorkspacePage } from './pages/tools/index.ts'
import { PricingPage } from './pages/pricing/index.ts'
import { SupportPage } from './pages/support/index.ts'
import { CheckoutCancelPage, CheckoutSuccessPage } from './pages/checkout/index.ts'
import { AboutPage } from './pages/about/index.ts'
import { CareersPage } from './pages/careers/index.ts'
import { PrivacyPage } from './pages/privacy/index.ts'
import { TermsPage } from './pages/terms/index.ts'
import { AdminPage } from './pages/admin/index.ts'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="signup" element={<SignupPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route element={<RequireAuth />}>
              <Route path="tools" element={<ToolsListPage />} />
              <Route path="tools/:toolId" element={<ToolPage />} />
              <Route path="workspace" element={<WorkspacePage />} />
            </Route>
            <Route path="pricing" element={<PricingPage />} />
            <Route path="support" element={<SupportPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="careers" element={<CareersPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="terms" element={<TermsPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="checkout/success" element={<CheckoutSuccessPage />} />
            <Route path="checkout/cancel" element={<CheckoutCancelPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
