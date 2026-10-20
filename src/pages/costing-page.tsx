import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertCircle, ArrowRight, Boxes, ChevronDown, Clock3, Plus, Save, Trash2 } from 'lucide-react'
import { AssetImage } from '../components/asset-image'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle } from '../components/ui/card'
import { StatusBadge } from '../components/ui/status-badge'
import { calculateCosting, captureCostingSnapshot, costingInputErrors, type AdditionalCostInput, type CostingInput } from '../data/costing-service'
import { readCostingSnapshots, storeCostingDraft, storeCostingSnapshot } from '../data/costing-sessions'
import { useComponentCatalogue } from '../hooks/use-component-catalogue'
import { useConfigurationCatalogue } from '../hooks/use-configuration-catalogue'
import type { MeterConfiguration } from '../types/catalog'

type EditableLine = { componentId: string; quantity: string; unitCostNgn: string }
type EditableAdditional = { id: string; name: string; amountNgn: string; basis: AdditionalCostInput['basis'] }
const money = (amount: number) => Number.isFinite(amount) ? `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 2 })}` : '—'
const initialAdditional: EditableAdditional[] = [
  { id: 'cost-labour', name: 'Labour', amountNgn: '950', basis: 'per-unit' },
  { id: 'cost-assembly', name: 'Assembly', amountNgn: '450', basis: 'per-unit' },
  { id: 'cost-packaging', name: 'Packaging', amountNgn: '320', basis: 'per-unit' },
  { id: 'cost-overhead', name: 'Overhead', amountNgn: '500', basis: 'per-unit' },
  { id: 'cost-batch-inspection', name: 'Batch quality inspection', amountNgn: '25000', basis: 'batch' },
]
const inputClass = 'h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] tabular-nums text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100'

function initialLines(configuration?: MeterConfiguration): EditableLine[] {
  return configuration?.components.map((line) => ({ componentId: line.componentId, quantity: String(line.quantity), unitCostNgn: String(line.costSnapshotNgn) })) ?? []
}

export function CostingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { components, loading: componentsLoading } = useComponentCatalogue()
  const { configurations, loading: configurationsLoading } = useConfigurationCatalogue(components)
  const firstConfiguration = configurations[0]
  const [configurationId, setConfigurationId] = useState(searchParams.get('configuration') ?? firstConfiguration?.id ?? '')
  const configuration = configurations.find((item) => item.id === configurationId) ?? firstConfiguration
  const [quantity, setQuantity] = useState('250')
  const [lines, setLines] = useState<EditableLine[]>(() => initialLines(configuration))
  const [additional, setAdditional] = useState<EditableAdditional[]>(initialAdditional)
  const [savedMessage, setSavedMessage] = useState('')
  const [saveError, setSaveError] = useState('')
  const [recentSnapshots, setRecentSnapshots] = useState(() => readCostingSnapshots().slice(0, 3))

  useEffect(() => {
    if (!configuration) return
    setLines(initialLines(configuration))
    setSavedMessage('')
  }, [configuration])
  useEffect(() => {
    if (configuration && searchParams.get('configuration') !== configuration.id) {
      const next = new URLSearchParams(searchParams)
      next.set('configuration', configuration.id)
      setSearchParams(next, { replace: true })
    }
  }, [configuration, searchParams, setSearchParams])

  const componentById = useMemo(() => new Map(components.map((component) => [component.id, component])), [components])
  const input: CostingInput = useMemo(() => ({
    productionQuantity: quantity.trim() ? Number(quantity) : Number.NaN,
    lines: (configuration?.components ?? []).map((line) => {
      const component = componentById.get(line.componentId)
      const editable = lines.find((item) => item.componentId === line.componentId)
      return { componentId: line.componentId, componentCode: component?.code ?? line.componentId, componentName: component?.name ?? `Missing component ${line.componentId}`, specification: component?.specification ?? 'Catalogue variant unavailable', quantity: editable?.quantity.trim() ? Number(editable.quantity) : Number.NaN, unitOfMeasure: line.unitOfMeasure, quanGroup: line.quanGroup, unitCostNgn: editable?.unitCostNgn.trim() ? Number(editable.unitCostNgn) : Number.NaN, catalogueUnitCostNgn: component?.currentUnitCostNgn ?? Number.NaN }
    }),
    additionalCosts: additional.map((item) => ({ ...item, amountNgn: item.amountNgn.trim() ? Number(item.amountNgn) : Number.NaN })),
  }), [additional, componentById, configuration, lines, quantity])
  let errors = configuration ? costingInputErrors(input) : ['Create a meter configuration before starting a costing session.']
  let result = null as ReturnType<typeof calculateCosting> | null
  if (!errors.length) {
    try { result = calculateCosting(input) }
    catch (error) { errors = [error instanceof Error ? error.message : 'The calculation is outside the supported range.'] }
  }
  useEffect(() => {
    if (configuration && result) storeCostingDraft(configuration.id, input)
  }, [configuration, input, result])
  const displayGroups = configuration ? [...new Set(['Quan 1', 'Quan 2', 'Quan 3', 'Quan 4', ...configuration.components.map((line) => line.quanGroup)])].map((group) => ({ group, lines: configuration.components.filter((line) => line.quanGroup === group) })).filter((group) => group.lines.length > 0) : []
  const formatBasis = (basis: EditableAdditional['basis']) => basis === 'per-unit' ? 'per meter' : 'one time per batch'
  function updateLine(componentId: string, key: 'quantity' | 'unitCostNgn', value: string) { setLines((current) => current.map((line) => line.componentId === componentId ? { ...line, [key]: value } : line)) }
  function updateAdditional(id: string, key: keyof EditableAdditional, value: string) { setAdditional((current) => current.map((item) => item.id === id ? { ...item, [key]: value } : item)) }
  function addAdditional() { setAdditional((current) => [...current, { id: `cost-${Date.now()}`, name: '', amountNgn: '0', basis: 'per-unit' }]) }
  function saveSnapshot() {
    if (!configuration || !result || errors.length) return
    const snapshot = captureCostingSnapshot(`COST-DEMO-${Date.now()}`, configuration, input, result)
    if (!storeCostingSnapshot(snapshot)) { setSaveError('Could not save this costing snapshot in browser storage.'); return }
    setRecentSnapshots(readCostingSnapshots().slice(0, 3))
    setSavedMessage(`Saved ${snapshot.id}. Its line specifications and unit costs are captured as of ${new Date(snapshot.createdAt).toLocaleString('en-NG')}.`)
    setSaveError('')
  }
  const loading = componentsLoading || configurationsLoading

  return <div className="space-y-5"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-600">Commercial · Demo costing</p><h2 className="mt-1.5 text-[21px] font-semibold tracking-tight text-slate-900">Costing workspace</h2><p className="mt-1 text-[12px] text-slate-500">Edit per-meter quantities and costs, then calculate the total for a production batch.</p></div><div className="flex gap-2"><Button variant="outline" asChild><Link to="/configurations">Manage configurations</Link></Button><Button onClick={saveSnapshot} disabled={!result || loading}><Save size={14} /> Save costing snapshot</Button></div></div>
    {savedMessage && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[11px] text-emerald-800">{savedMessage}</div>}{saveError && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-[11px] text-rose-700">{saveError}</div>}
    {loading ? <Card className="p-10 text-center text-[12px] text-slate-500">Loading saved demo components and configurations…</Card> : !configuration ? <Card className="p-10 text-center"><p className="text-sm font-semibold text-slate-800">No meter configuration found</p><Button asChild className="mt-4"><Link to="/configurations">Create a configuration</Link></Button></Card> : <>
    <Card className="overflow-hidden"><CardHeader className="items-center border-b border-slate-100"><div className="flex min-w-0 items-center gap-3"><AssetImage src={configuration.image} alt={`${configuration.name} demo meter`} className="size-14 shrink-0 rounded-lg bg-slate-50 object-contain p-1" /><div className="min-w-0"><CardTitle>{configuration.name}</CardTitle><p className="mt-1 truncate text-[11px] text-slate-500">{configuration.code} · {configuration.meterType} · {configuration.description}</p></div></div><StatusBadge tone="blue">Demo cost session</StatusBadge></CardHeader><div className="grid gap-3 p-4 sm:grid-cols-3"><label className="text-[10px] font-semibold text-slate-500">SELECTED CONFIGURATION<select aria-label="Selected meter configuration" value={configuration.id} onChange={(event) => { setConfigurationId(event.target.value); const next = new URLSearchParams(searchParams); next.set('configuration', event.target.value); setSearchParams(next) }} className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-medium text-slate-700">{configurations.map((item) => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}</select></label><label className="text-[10px] font-semibold text-slate-500">PRODUCTION QUANTITY<input aria-label="Production quantity" type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} className={`${inputClass} mt-1.5 h-9`} /><span className="mt-1 block font-normal text-slate-400">Whole meters in this batch.</span></label><div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2"><div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Boxes size={15} /></div><div><p className="text-[10px] text-slate-400">Component count</p><p className="text-[15px] font-semibold text-slate-800">{configuration.components.length} <span className="text-[10px] font-normal text-slate-400">variants / meter</span></p></div></div></div></Card>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(310px,0.75fr)]"><div className="space-y-4"><Card className="overflow-hidden"><CardHeader className="border-b border-slate-100"><div><CardTitle>Component costing</CardTitle><p className="mt-1 text-[10px] text-slate-500">Unit costs start from each configuration line’s saved snapshot. A catalogue difference is highlighted.</p></div></CardHeader><div className="divide-y divide-slate-100">{displayGroups.map((displayGroup) => { const group = result?.groups.find((item) => item.group === displayGroup.group); return <details key={displayGroup.group} open className="group"><summary className="flex cursor-pointer list-none items-center justify-between bg-slate-50/50 px-4 py-3 hover:bg-slate-50"><div className="flex items-center gap-2"><ChevronDown size={14} className="text-slate-400 transition group-open:rotate-180" /><span className="text-[11px] font-semibold text-slate-700">{displayGroup.group}</span><span className="text-[10px] text-slate-400">{displayGroup.lines.length} component lines</span></div><span className="text-[11px] font-semibold tabular-nums text-slate-800">{group ? money(group.subtotalNgn) : '—'}</span></summary><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead className="text-[9px] uppercase tracking-wide text-slate-400"><tr><th className="px-4 py-2">Component / specification</th><th className="w-24 px-3 py-2">Qty / meter</th><th className="w-32 px-3 py-2">Unit cost</th><th className="w-32 px-4 py-2 text-right">Line total</th></tr></thead><tbody className="divide-y divide-slate-100">{displayGroup.lines.map((configLine) => { const component = componentById.get(configLine.componentId); const editable = lines.find((item) => item.componentId === configLine.componentId); const calculatedLine = result?.groups.flatMap((item) => item.lines).find((line) => line.componentId === configLine.componentId); const costChanged = Number(editable?.unitCostNgn) !== (component?.currentUnitCostNgn ?? Number.NaN); return <tr key={configLine.componentId}><td className="px-4 py-3"><p className="text-[10px] font-semibold text-slate-700">{component?.name ?? 'Missing catalogue component'}</p><p className="mt-0.5 text-[9px] text-slate-400">{component?.specification ?? configLine.componentId} · {configLine.unitOfMeasure}</p></td><td className="px-3 py-3"><input aria-label={`Quantity per meter for ${component?.name ?? configLine.componentId}`} type="number" min="0" step="any" value={editable?.quantity ?? ''} onChange={(event) => updateLine(configLine.componentId, 'quantity', event.target.value)} className={inputClass} /></td><td className="px-3 py-3"><input aria-label={`Unit cost for ${component?.name ?? configLine.componentId}`} type="number" min="0" step="any" value={editable?.unitCostNgn ?? ''} onChange={(event) => updateLine(configLine.componentId, 'unitCostNgn', event.target.value)} className={inputClass} />{costChanged && <span className="mt-1 block text-[9px] font-medium text-amber-700">Catalogue: {money(component?.currentUnitCostNgn ?? Number.NaN)}</span>}</td><td className="px-4 py-3 text-right text-[10px] font-semibold tabular-nums text-slate-700">{calculatedLine ? money(calculatedLine.lineTotalNgn) : '—'}</td></tr> })}</tbody></table></div></details> })}</div><div className="flex justify-between border-t border-slate-100 px-4 py-3 text-[11px] font-semibold text-slate-800"><span>Component cost per meter</span><span>{result ? money(result.componentCostPerMeterNgn) : '—'}</span></div></Card>
    <Card className="overflow-hidden"><CardHeader className="border-b border-slate-100"><div><CardTitle>Additional production costs</CardTitle><p className="mt-1 text-[10px] text-slate-500">Per-meter costs multiply by quantity; batch costs are added once.</p></div><Button variant="outline" size="sm" onClick={addAdditional}><Plus size={13} /> Add cost</Button></CardHeader><div className="divide-y divide-slate-100">{additional.map((item) => <div key={item.id} className="grid gap-2 p-3 sm:grid-cols-[minmax(130px,1fr)_minmax(110px,0.7fr)_150px_120px_34px] sm:items-center"><label className="text-[9px] font-medium text-slate-500">Cost name<input aria-label={`Additional cost name ${item.id}`} value={item.name} onChange={(event) => updateAdditional(item.id, 'name', event.target.value)} className={`${inputClass} mt-1`} /></label><label className="text-[9px] font-medium text-slate-500">Amount (₦)<input aria-label={`Additional cost amount ${item.name || item.id}`} type="number" min="0" step="any" value={item.amountNgn} onChange={(event) => updateAdditional(item.id, 'amountNgn', event.target.value)} className={`${inputClass} mt-1`} /></label><label className="text-[9px] font-medium text-slate-500">Cost basis<select aria-label={`Additional cost basis ${item.name || item.id}`} value={item.basis} onChange={(event) => updateAdditional(item.id, 'basis', event.target.value as EditableAdditional['basis'])} className={`${inputClass} mt-1`}><option value="per-unit">Per meter</option><option value="batch">One time per batch</option></select></label><span className="text-[10px] text-slate-500">{formatBasis(item.basis)}</span><button aria-label={`Remove ${item.name || 'additional cost'}`} onClick={() => setAdditional((current) => current.filter((cost) => cost.id !== item.id))} className="flex size-8 items-center justify-center rounded text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={13} /></button></div>)}</div></Card></div>
    <aside className="space-y-4"><Card className="h-fit overflow-hidden"><CardHeader className="border-b border-slate-100"><div><CardTitle>Production cost summary</CardTitle><p className="mt-1 text-[10px] text-slate-500">Fictional demo estimate · NGN</p></div></CardHeader>{result ? <div className="space-y-3 p-4"><div className="rounded-lg bg-slate-50 p-3"><p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Component cost / meter</p><p className="mt-1 text-[17px] font-semibold tabular-nums text-slate-900">{money(result.componentCostPerMeterNgn)}</p>{result.groups.map((group) => <div key={group.group} className="mt-1 flex justify-between text-[9px] text-slate-500"><span>{group.group}</span><span>{money(group.subtotalNgn)}</span></div>)}</div><div className="space-y-2 border-b border-slate-100 pb-3"><p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Additional production costs</p>{result.additionalCosts.map((cost) => <div key={cost.id} className="flex justify-between gap-3 text-[10px] text-slate-600"><span>{cost.name} <span className="text-slate-400">({formatBasis(cost.basis)})</span></span><span className="shrink-0 tabular-nums">{money(cost.amountNgn)}</span></div>)}<div className="flex justify-between border-t border-slate-100 pt-2 text-[10px] font-medium text-slate-700"><span>Per-meter additional</span><span>{money(result.perUnitAdditionalCostsNgn)}</span></div><div className="flex justify-between text-[10px] font-medium text-slate-700"><span>Batch-only additional</span><span>{money(result.batchAdditionalCostsNgn)}</span></div></div><div className="flex justify-between text-[11px] font-semibold text-slate-800"><span>Production cost / meter</span><span>{money(result.productionCostPerMeterNgn)}</span></div><div className="rounded-lg bg-blue-700 p-3 text-white"><p className="text-[9px] font-medium text-blue-100">TOTAL COST FOR {result.productionQuantity.toLocaleString('en-NG')} METERS</p><p className="mt-1 text-[21px] font-semibold tabular-nums">{money(result.batchProductionCostNgn)}</p><p className="mt-1 text-[9px] text-blue-100">Per-meter production × quantity, plus batch-only costs once.</p></div></div> : <div role="alert" className="p-4 text-[10px] text-rose-700"><p className="flex items-center gap-2 font-semibold"><AlertCircle size={14} />Correct input values to calculate.</p><ul className="mt-2 list-inside list-disc space-y-1">{errors.map((error, index) => <li key={`${error}-${index}`}>{error}</li>)}</ul><p className="mt-2 text-slate-500">Zero component quantity is valid and contributes ₦0 to its Quan subtotal.</p></div>}</Card>
    {recentSnapshots.length > 0 && <Card className="p-4"><div className="flex items-center gap-2"><Clock3 size={14} className="text-slate-400" /><h3 className="text-[11px] font-semibold text-slate-700">Saved costing snapshots</h3></div><p className="mt-1 text-[9px] text-slate-400">Historical records show captured values, not live catalogue prices.</p><div className="mt-3 space-y-2">{recentSnapshots.map((snapshot) => <details key={snapshot.id} className="rounded-lg border border-slate-100 p-2"><summary className="flex cursor-pointer list-none justify-between gap-2 text-[9px] font-medium text-slate-600"><span>{snapshot.configurationCode} · {snapshot.productionQuantity} meters</span><span>{money(snapshot.batchProductionCostNgn)}</span></summary><div className="mt-2 space-y-1 border-t border-slate-100 pt-2">{snapshot.lines.map((line) => <p key={`${line.componentId}-${line.specification}`} className="text-[9px] text-slate-500">{line.componentName} · {line.specification} · {line.quantity} {line.unitOfMeasure} × {money(line.unitCostNgn)}</p>)}</div></details>)}</div><Link className="mt-3 inline-flex items-center gap-1 text-[10px] font-medium text-blue-700" to="/quotations">Review quotations <ArrowRight size={12} /></Link></Card>}</aside></div>
    {errors.length > 0 && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-[10px] text-amber-800">Quantity zero is allowed and contributes no component cost. Negative quantities and costs are rejected; production quantity must be a positive whole number.</div>}
    </>}
  </div>
}
