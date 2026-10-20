import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AppHeader } from './app-header'
import { AppSidebar } from './app-sidebar'

const titles: Record<string, { title: string; section: string }> = {
  '/': { title: 'Dashboard', section: 'Overview' },
  '/components': { title: 'Components', section: 'Product setup' },
  '/configurations': { title: 'Meter Configurations', section: 'Product setup' },
  '/costing': { title: 'Costing Workspace', section: 'Commercial' },
  '/quotations': { title: 'Quotations', section: 'Commercial' },
  '/price-history': { title: 'Price History', section: 'Insights' },
}

export function AppLayout() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const page = titles[location.pathname] ?? { title: 'Dashboard', section: 'Overview' }
  return (
    <div className="min-h-screen bg-surface">
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block"><AppSidebar /></div>
      {menuOpen && <div className="fixed inset-0 z-40 lg:hidden"><button className="absolute inset-0 bg-slate-950/40" aria-label="Close navigation" onClick={() => setMenuOpen(false)} /><div className="relative h-full w-[260px] shadow-xl"><AppSidebar onNavigate={() => setMenuOpen(false)} /></div></div>}
      <div className="min-h-screen lg:pl-[252px]"><AppHeader {...page} onMenuClick={() => setMenuOpen(true)} /><main className="mx-auto max-w-[1440px] p-5 sm:p-7 lg:p-9"><div className="mb-5 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2 text-[11px] text-blue-800"><span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold tracking-wide">DEMO DATA</span><span>Fictional sample components, customers and NGN values · not company prices.</span></div><Outlet /></main></div>
    </div>
  )
}
