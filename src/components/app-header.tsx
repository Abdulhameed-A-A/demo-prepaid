import { Bell, ChevronRight, Menu, Search } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { Button } from './ui/button'

export function AppHeader({ title, section, onMenuClick }: { title: string; section: string; onMenuClick: () => void }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const matches = useMemo(() => {
    const pages = [{ label: 'Dashboard', path: '/' }, { label: 'Components', path: '/components' }, { label: 'Meter Configurations', path: '/configurations' }, { label: 'Costing Workspace', path: '/costing' }, { label: 'Quotations', path: '/quotations' }, { label: 'Price History', path: '/price-history' }]
    return pages.filter((page) => page.label.toLowerCase().includes(query.toLowerCase()))
  }, [query])
  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-5 backdrop-blur sm:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <Button variant="ghost" size="icon" className="-ml-2 shrink-0 lg:hidden" aria-label="Open navigation" onClick={onMenuClick}><Menu size={19} /></Button>
        <div className="min-w-0"><div className="mb-1 hidden items-center gap-1.5 text-[11px] text-slate-400 sm:flex"><Link to="/" className="hover:text-slate-600">Workspace</Link><ChevronRight size={12} /><span>{section}</span></div><h1 className="truncate text-[17px] font-semibold tracking-[-0.02em] text-slate-900">{title}</h1></div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="relative hidden md:block"><label className="flex h-9 w-[245px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-400"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && matches[0]) { navigate(matches[0].path); setQuery('') } if (event.key === 'Escape') setQuery('') }} aria-label="Search pages" placeholder="Search workspace..." className="min-w-0 flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400" /><kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">⌘ K</kbd></label>{query && <div className="absolute right-0 top-11 z-30 w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-lg">{matches.length ? matches.map((match) => <button key={match.path} onClick={() => { navigate(match.path); setQuery('') }} className="block w-full rounded-md px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50">{match.label}</button>) : <p className="px-3 py-2 text-xs text-slate-400">No pages found</p>}</div>}</div>
        <span className="hidden items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10px] font-semibold tracking-wide text-amber-700 sm:inline-flex"><span className="size-1.5 rounded-full bg-amber-500" /> DEMO ENVIRONMENT</span>
        <Button variant="ghost" size="icon" aria-label="View pending quotation approvals" className="relative" asChild><Link to="/quotations"><Bell size={17} /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-blue-600 ring-2 ring-white" /></Link></Button>
      </div>
    </header>
  )
}
