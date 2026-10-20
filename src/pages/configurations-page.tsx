import { useEffect, useMemo, useState, type FormEvent } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Copy, Pencil, Plus, X, Calculator } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AssetImage } from '../components/asset-image'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle } from '../components/ui/card'
import { StatusBadge } from '../components/ui/status-badge'
import { normalizeConfigurationLines } from '../data/configuration-catalog'
import { calculateCosting } from '../data/costing-service'
import { useComponentCatalogue } from '../hooks/use-component-catalogue'
import { useConfigurationCatalogue } from '../hooks/use-configuration-catalogue'
import type { MeterConfiguration, MeterComponent } from '../types/catalog'

type FormLine = { componentId: string; quantity: string }
type FormValues = { code: string; name: string; meterType: MeterConfiguration['meterType']; description: string; status: MeterConfiguration['status']; lines: FormLine[] }
const meterImage = (type: MeterConfiguration['meterType']) => type === 'Three phase' ? '/images/three-phase-meter.svg' : '/images/prepaid-meter.svg'
const formatNgn = (amount: number) => `₦${amount.toLocaleString('en-NG')}`
const defaultValues = (components: MeterComponent[]): FormValues => ({ code: '', name: '', meterType: 'Single phase', description: '', status: 'Draft', lines: [{ componentId: components[0]?.id ?? '', quantity: '1' }] })
const getSnapshotCost = (configuration: MeterConfiguration, components: MeterComponent[]) => {
  try { return calculateCosting({ productionQuantity: 1, lines: configuration.components.map((line) => { const component = components.find((item) => item.id === line.componentId); return { componentId: line.componentId, componentName: component?.name ?? line.componentId, specification: component?.specification ?? '', quantity: line.quantity, unitOfMeasure: line.unitOfMeasure, quanGroup: line.quanGroup, unitCostNgn: line.costSnapshotNgn, catalogueUnitCostNgn: line.costSnapshotNgn } }), additionalCosts: [] }).componentCostPerMeterNgn }
  catch { return null }
}

function ConfigurationForm({ open, onOpenChange, original, configurations, components, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; original?: MeterConfiguration; configurations: MeterConfiguration[]; components: MeterComponent[]; onSave: (values: FormValues, original?: MeterConfiguration) => void }) {
  const [values, setValues] = useState<FormValues>(() => defaultValues(components))
  const [errors, setErrors] = useState<string[]>([])
  useEffect(() => {
    if (!open) return
    setValues(original ? { code: original.code, name: original.name, meterType: original.meterType, description: original.description, status: original.status, lines: original.components.map((line) => ({ componentId: line.componentId, quantity: String(line.quantity) })) } : defaultValues(components))
    setErrors([])
  }, [open, original, components])
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: string[] = []
    if (!values.code.trim()) nextErrors.push('Enter a configuration code.')
    if (configurations.some((item) => item.code.toLowerCase() === values.code.trim().toLowerCase() && item.id !== original?.id)) nextErrors.push('Configuration code must be unique.')
    if (!values.name.trim()) nextErrors.push('Enter a configuration name.')
    if (!values.description.trim()) nextErrors.push('Enter a description.')
    if (!values.lines.length) nextErrors.push('Add at least one component variant.')
    if (values.lines.some((line) => !components.some((component) => component.id === line.componentId))) nextErrors.push('Choose a valid component variant for each line.')
    if (values.lines.some((line) => line.quantity.trim() === '' || !Number.isFinite(Number(line.quantity)) || Number(line.quantity) < 0 || Number(line.quantity) > Number.MAX_SAFE_INTEGER)) nextErrors.push('Component quantities must be zero or greater within the supported range. Zero keeps a line in the configuration but adds no cost.')
    if (new Set(values.lines.map((line) => line.componentId)).size !== values.lines.length) nextErrors.push('Each exact component variant can appear only once; adjust its quantity on the existing line.')
    setErrors(nextErrors)
    if (nextErrors.length) return
    onSave(values, original)
    onOpenChange(false)
  }
  const inputClass = 'mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[12px] text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
  const componentFor = (id: string) => components.find((item) => item.id === id)
  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/40" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[calc(100%-24px)] max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6"><div className="flex items-start justify-between"><div><Dialog.Title className="text-base font-semibold text-slate-900">{original ? 'Edit configuration' : 'Create configuration'}</Dialog.Title><Dialog.Description className="mt-1 text-[11px] text-slate-500">Select exact catalogue variants. Each line stores the catalogue unit price as a configuration snapshot.</Dialog.Description></div><Dialog.Close aria-label="Close dialog" className="rounded p-1 text-slate-400 hover:bg-slate-100"><X size={16} /></Dialog.Close></div>
    <form onSubmit={submit} noValidate className="mt-5 space-y-4"><div className="grid gap-3 sm:grid-cols-2"><label className="text-[11px] font-medium text-slate-600">Configuration code<input className={inputClass} value={values.code} onChange={(event) => setValues((value) => ({ ...value, code: event.target.value }))} placeholder="e.g. PRE-1P-SMART" /></label><label className="text-[11px] font-medium text-slate-600">Configuration name<input className={inputClass} value={values.name} onChange={(event) => setValues((value) => ({ ...value, name: event.target.value }))} placeholder="e.g. PRE-1P Smart" /></label><label className="text-[11px] font-medium text-slate-600">Meter type<select className={inputClass} value={values.meterType} onChange={(event) => setValues((value) => ({ ...value, meterType: event.target.value as FormValues['meterType'] }))}><option>Single phase</option><option>Three phase</option></select></label><label className="text-[11px] font-medium text-slate-600">Status<select className={inputClass} value={values.status} onChange={(event) => setValues((value) => ({ ...value, status: event.target.value as FormValues['status'] }))}><option>Draft</option><option>In review</option><option>Approved</option></select></label><label className="text-[11px] font-medium text-slate-600 sm:col-span-2">Description<input className={inputClass} value={values.description} onChange={(event) => setValues((value) => ({ ...value, description: event.target.value }))} placeholder="Meter rating, connection and intended use" /></label></div>
    <div className="overflow-hidden rounded-lg border border-slate-200"><div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3"><div><p className="text-[11px] font-semibold text-slate-800">Component lines</p><p className="mt-0.5 text-[10px] text-slate-500">Zero quantity retains the line but contributes ₦0.</p></div><Button type="button" size="sm" variant="outline" onClick={() => setValues((value) => ({ ...value, lines: [...value.lines, { componentId: components[0]?.id ?? '', quantity: '1' }] }))}><Plus size={13} /> Add line</Button></div><div className="divide-y divide-slate-100">{values.lines.map((line, index) => { const component = componentFor(line.componentId); return <div key={`${index}-${line.componentId}`} className="grid gap-2 p-3 sm:grid-cols-[minmax(240px,1.6fr)_100px_100px_90px_110px_34px] sm:items-end"><label className="text-[10px] font-medium text-slate-600">Exact component variant<select className={inputClass} value={line.componentId} onChange={(event) => setValues((value) => ({ ...value, lines: value.lines.map((item, i) => i === index ? { ...item, componentId: event.target.value } : item) }))}><option value="">Select a variant</option>{components.map((item) => <option key={item.id} value={item.id}>{item.code} — {item.name} · {item.specification}</option>)}</select></label><label className="text-[10px] font-medium text-slate-600">Qty / meter<input type="number" min="0" step="any" className={inputClass} value={line.quantity} onChange={(event) => setValues((value) => ({ ...value, lines: value.lines.map((item, i) => i === index ? { ...item, quantity: event.target.value } : item) }))} /></label><div className="pb-1"><p className="text-[9px] text-slate-400">Unit</p><p className="mt-1 text-[10px] text-slate-600">{component?.unitOfMeasure ?? '—'}</p></div><div className="pb-1"><p className="text-[9px] text-slate-400">Quan</p><p className="mt-1 text-[10px] text-slate-600">{component?.quanGroup ?? '—'}</p></div><div className="pb-1"><p className="text-[9px] text-slate-400">Cost snapshot</p><p className="mt-1 text-[10px] font-medium text-slate-700">{component ? formatNgn(component.currentUnitCostNgn) : '—'}</p></div><button type="button" aria-label={`Remove component line ${index + 1}`} disabled={values.lines.length === 1} onClick={() => setValues((value) => ({ ...value, lines: value.lines.filter((_, i) => i !== index) }))} className="mb-0.5 flex size-8 items-center justify-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"><X size={14} /></button></div> })}</div></div>
    {errors.length > 0 && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] text-rose-700"><ul className="list-inside list-disc">{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}<div className="flex justify-end gap-2 pt-1"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit">{original ? 'Save configuration' : 'Create configuration'}</Button></div></form></Dialog.Content></Dialog.Portal></Dialog.Root>
}

export function ConfigurationsPage() {
  const { components } = useComponentCatalogue()
  const { configurations, loading, storageWarning, commit } = useConfigurationCatalogue(components)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<MeterConfiguration>()
  const [notice, setNotice] = useState('')
  const activeCount = configurations.filter((item) => item.status === 'Approved').length
  const totalComponents = useMemo(() => components.length, [components])
  function save(values: FormValues, original?: MeterConfiguration) {
    const nextConfiguration: MeterConfiguration = { id: original?.id ?? `cfg-demo-${Date.now()}`, code: values.code.trim(), name: values.name.trim(), meterType: values.meterType, description: values.description.trim(), phase: values.meterType, rating: values.description.trim(), image: meterImage(values.meterType), status: values.status, components: normalizeConfigurationLines(values.lines.map((line) => ({ componentId: line.componentId, quantity: Number(line.quantity) })), components) }
    commit(original ? configurations.map((item) => item.id === original.id ? nextConfiguration : item) : [...configurations, nextConfiguration])
    setNotice(`${nextConfiguration.code} ${original ? 'updated' : 'created'} in this browser’s demo workspace.`)
    setEditing(undefined)
  }
  function duplicate(configuration: MeterConfiguration) {
    const rootCode = `${configuration.code}-COPY`
    let code = rootCode
    let suffix = 2
    while (configurations.some((item) => item.code.toLowerCase() === code.toLowerCase())) code = `${rootCode}-${suffix++}`
    const copy: MeterConfiguration = { ...configuration, id: `cfg-demo-${Date.now()}`, code, name: `${configuration.name} Copy`, status: 'Draft', components: configuration.components.map((line) => ({ ...line })) }
    commit([...configurations, copy])
    setNotice(`${copy.code} created as a draft copy.`)
  }
  const openNew = () => { setEditing(undefined); setOpen(true) }
  const openEdit = (configuration: MeterConfiguration) => { setEditing(configuration); setOpen(true) }
  return <div className="space-y-5"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-600">Product setup</p><h2 className="mt-1.5 text-[21px] font-semibold tracking-tight text-slate-900">Meter configurations</h2><p className="mt-1 text-[12px] text-slate-500">Manage meter models and the exact catalogue variants assembled into each one.</p></div><Button onClick={openNew}><Plus size={15} /> Create configuration</Button></div>
    <div className="grid gap-3 sm:grid-cols-3"><Card className="p-4"><p className="text-[10px] uppercase tracking-wide text-slate-400">Demo configurations</p><p className="mt-1 text-xl font-semibold text-slate-900">{configurations.length}</p></Card><Card className="p-4"><p className="text-[10px] uppercase tracking-wide text-slate-400">Approved configurations</p><p className="mt-1 text-xl font-semibold text-emerald-700">{activeCount}</p></Card><Card className="p-4"><p className="text-[10px] uppercase tracking-wide text-slate-400">Catalogue variants</p><p className="mt-1 text-xl font-semibold text-slate-900">{totalComponents}</p></Card></div>
    {notice && <div role="status" className="flex justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-[11px] text-emerald-800">{notice}<button className="underline" onClick={() => setNotice('')}>Dismiss</button></div>}{storageWarning && <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-[11px] text-amber-800">Browser storage is unavailable. Changes will not persist after you leave this page.</div>}
    <Card className="overflow-hidden"><CardHeader className="border-b border-slate-100"><div><CardTitle>Product configuration list</CardTitle><p className="mt-1 text-[11px] text-slate-500">Demo configurations use per-line cost snapshots from the selected component variant.</p></div></CardHeader>{loading ? <p role="status" className="p-10 text-center text-[12px] text-slate-500">Loading configurations…</p> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead className="bg-slate-50/80 text-[9px] font-semibold uppercase tracking-wider text-slate-400"><tr>{['Meter / description', 'Code', 'Component lines', 'Snapshot cost / meter', 'Status', 'Actions'].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{configurations.map((configuration) => { const cost = getSnapshotCost(configuration, components); const componentLines = configuration.components.map((line) => components.find((item) => item.id === line.componentId)).filter(Boolean); return <tr key={configuration.id} className="hover:bg-slate-50/60"><td className="px-4 py-3"><div className="flex items-center gap-3"><AssetImage src={configuration.image} alt={`${configuration.name} demo meter`} className="h-16 w-14 rounded-lg bg-slate-50 object-contain p-1" /><div><p className="text-[11px] font-semibold text-slate-800">{configuration.name}</p><p className="mt-1 text-[10px] text-slate-400">{configuration.meterType} · {configuration.description}</p></div></div></td><td className="px-4 py-3 text-[10px] font-medium text-slate-600">{configuration.code}</td><td className="px-4 py-3"><p className="text-[10px] font-medium text-slate-700">{configuration.components.length} exact variants</p><p className="mt-1 max-w-[230px] truncate text-[9px] text-slate-400">{componentLines.slice(0, 3).map((item) => item?.code).join(" · ")}{componentLines.length > 3 ? ` · +${componentLines.length - 3} more` : ""}</p></td><td className="px-4 py-3 text-[11px] font-semibold tabular-nums text-slate-800">{cost === null ? "—" : formatNgn(cost)}</td><td className="px-4 py-3"><StatusBadge tone={configuration.status === 'Approved' ? 'green' : configuration.status === 'In review' ? 'amber' : 'gray'}>{configuration.status}</StatusBadge></td><td className="px-4 py-3"><div className="flex items-center gap-1"><Button variant="ghost" size="icon" asChild><Link to={`/costing?configuration=${encodeURIComponent(configuration.id)}`} aria-label={`Cost ${configuration.name}`} title="Cost configuration"><Calculator size={14} /></Link></Button><Button variant="ghost" size="icon" onClick={() => openEdit(configuration)} aria-label={`Edit ${configuration.name}`} title="Edit configuration"><Pencil size={14} /></Button><Button variant="ghost" size="icon" onClick={() => duplicate(configuration)} aria-label={`Duplicate ${configuration.name}`} title="Duplicate configuration"><Copy size={14} /></Button></div></td></tr> })}</tbody></table></div>}</Card>
    <ConfigurationForm key={editing?.id ?? 'new-configuration'} open={open} onOpenChange={setOpen} original={editing} configurations={configurations} components={components} onSave={save} />
  </div>
}
