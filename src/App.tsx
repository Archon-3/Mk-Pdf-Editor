import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './shared/components/AppLayout.tsx'
import { HomePage } from './pages/home/index.ts'
import { SignupPage } from './pages/signup/index.ts'
import { LoginPage } from './pages/login/index.ts'
import { ToolsListPage, ToolPage } from './pages/tools/index.ts'
import { PricingPage } from './pages/pricing/index.ts'
import { SupportPage } from './pages/support/index.ts'
import { CheckoutCancelPage, CheckoutSuccessPage } from './pages/checkout/index.ts'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="signup" element={<SignupPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="tools" element={<ToolsListPage />} />
          <Route path="tools/:toolId" element={<ToolPage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="checkout/success" element={<CheckoutSuccessPage />} />
          <Route path="checkout/cancel" element={<CheckoutCancelPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
