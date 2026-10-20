import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/app-layout'
import { Button } from './components/ui/button'
import { Card } from './components/ui/card'
import { PriceHistoryPage } from './pages/data-pages'
import { QuotationsPage } from './pages/quotation-page'
import { ConfigurationsPage } from './pages/configurations-page'
import { CostingPage } from './pages/costing-page'
import { ComponentsPage } from './pages/components-page'
import { DashboardPage } from './pages/dashboard'

function NotFoundPage() {
  return <Card className="mx-auto max-w-lg p-10 text-center"><h2 className="text-lg font-semibold text-slate-900">Page not found</h2><p className="mt-2 text-sm text-slate-500">The page you’re looking for isn’t available.</p><Button asChild className="mt-5"><Link to="/">Return to dashboard</Link></Button></Card>
}

function App() {
  return <Routes><Route element={<AppLayout />}><Route index element={<DashboardPage />} /><Route path="components" element={<ComponentsPage />} /><Route path="configurations" element={<ConfigurationsPage />} /><Route path="costing" element={<CostingPage />} /><Route path="quotations" element={<QuotationsPage />} /><Route path="price-history" element={<PriceHistoryPage />} /><Route path="not-found" element={<NotFoundPage />} /><Route path="*" element={<Navigate to="/not-found" replace />} /></Route></Routes>
}

export default App
