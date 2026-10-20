import { NavLink } from 'react-router-dom'
import { Activity, BadgeDollarSign, Boxes, Calculator, ChevronDown, CircleHelp, FileClock, LayoutDashboard, Settings2, Zap } from 'lucide-react'
import { cn } from '../lib/utils'

const mainNavigation = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Components', path: '/components', icon: Boxes },
  { label: 'Meter Configurations', path: '/configurations', icon: Settings2 },
  { label: 'Costing Workspace', path: '/costing', icon: Calculator },
  { label: 'Quotations', path: '/quotations', icon: BadgeDollarSign },
  { label: 'Price History', path: '/price-history', icon: FileClock },
]

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="flex h-full w-[252px] shrink-0 flex-col bg-navy-950 text-slate-300">
      <div className="flex h-[72px] items-center gap-3 border-b border-white/[0.08] px-6">
        <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500 text-white shadow-lg shadow-blue-950/30"><Zap size={20} fill="currentColor" strokeWidth={1.7} /></div>
        <div className="min-w-0"><p className="text-[15px] font-semibold tracking-wide text-white">Prepaid</p><p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">Costing &amp; Quotations</p></div>
      </div>
      <div className="px-4 pt-7">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Workspace</p>
        <nav className="space-y-1" aria-label="Main navigation">
          {mainNavigation.map(({ label, path, icon: Icon }) => (
            <NavLink key={path} to={path} end={path === '/'} onClick={onNavigate} className={({ isActive }) => cn('group flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors', isActive ? 'bg-blue-500/15 text-blue-300 ring-1 ring-inset ring-blue-400/15' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white')}>
              {({ isActive }) => <><Icon size={17} strokeWidth={1.8} className={isActive ? 'text-blue-300' : 'text-slate-500 group-hover:text-slate-300'} /><span>{label}</span></>}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="mt-8 px-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">System</p>
        <a href="mailto:support@prepaid.example" className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-[13px] font-medium text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"><CircleHelp size={17} className="text-slate-500" />Help &amp; support</a>
      </div>
      <div className="mt-auto p-4">
        <div className="mb-3 flex items-center gap-2 px-2 text-[11px] text-slate-500"><Activity size={14} className="text-emerald-400" /> All systems operational</div>
        <div className="flex w-full items-center gap-3 rounded-xl border border-white/[0.09] bg-white/[0.04] p-3 text-left">
          <div className="flex size-8 items-center justify-center rounded-full bg-slate-700 text-[11px] font-semibold text-white">AO</div>
          <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-white">Ola</p><p className="mt-0.5 truncate text-[10px] text-slate-500">Costing manager</p></div><ChevronDown size={14} className="text-slate-500" />
        </div>
      </div>
    </aside>
  )
}
