import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BadgeCheck, Download, FileSpreadsheet, FileText, Plus, Save, X } from 'lucide-react'
import { AssetImage } from '../components/asset-image'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { demoCustomers, demoQuotations, demoConfigurations } from '../data/demo-data'
import { calculateCosting, captureCostingSnapshot, costingInputErrors, type CostingInput } from '../data/costing-service'
import { readCostingDraft } from '../data/costing-sessions'
import { calculateQuotationPricing, nextQuotationNumber, readSavedQuotations, storeSavedQuotation, toCustomerFacingQuotation, type CustomerFacingQuotation, type QuotationCustomer, type SavedQuotation } from '../data/quotation-service'
import { useComponentCatalogue } from '../hooks/use-component-catalogue'
import { useConfigurationCatalogue } from '../hooks/use-configuration-catalogue'
import { downloadCsv } from '../lib/utils'
import type { MeterConfiguration } from '../types/catalog'

const money = (amount: number) => Number.isFinite(amount) ? `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'
const dateToday = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
const inputClass = 'mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-normal text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
const initialCustomer = (): QuotationCustomer => ({ companyName: demoCustomers[0]?.name ?? '', address: demoCustomers[0]?.location ?? '', contactPerson: demoCustomers[0]?.contactName ?? '', emailOrPhone: demoCustomers[0]?.email ?? '' })
const initialAdditional = [
  { id: 'cost-labour', name: 'Labour', amountNgn: 950, basis: 'per-unit' as const },
  { id: 'cost-assembly', name: 'Assembly', amountNgn: 450, basis: 'per-unit' as const },
  { id: 'cost-packaging', name: 'Packaging', amountNgn: 320, basis: 'per-unit' as const },
  { id: 'cost-overhead', name: 'Overhead', amountNgn: 500, basis: 'per-unit' as const },
  { id: 'cost-batch-inspection', name: 'Batch quality inspection', amountNgn: 25000, basis: 'batch' as const },
]

function createDefaultCostInput(configuration: MeterConfiguration, components: ReturnType<typeof useComponentCatalogue>['components']): CostingInput {
  return {
    productionQuantity: 250,
    lines: configuration.components.map((item) => {
      const component = components.find((candidate) => candidate.id === item.componentId)
      return { componentId: item.componentId, componentCode: component?.code ?? item.componentId, componentName: component?.name ?? item.componentId, specification: component?.specification ?? 'Specification unavailable', quantity: item.quantity, unitOfMeasure: item.unitOfMeasure, quanGroup: item.quanGroup, unitCostNgn: item.costSnapshotNgn, catalogueUnitCostNgn: component?.currentUnitCostNgn ?? item.costSnapshotNgn }
    }),
    additionalCosts: initialAdditional.map((item) => ({ ...item })),
  }
}

function SectionTitle({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><h3 className="text-[13px] font-semibold text-slate-900">{title}</h3>{description && <p className="mt-1 text-[10px] leading-4 text-slate-500">{description}</p>}</div>{action}</div>
}

function CustomerQuotationPreview({ quote }: { quote: CustomerFacingQuotation }) {
  return <Card className="overflow-hidden bg-white"><div className="bg-[#17335c] px-5 py-4 text-white"><div className="flex items-start justify-between gap-3"><div><p className="text-[13px] font-semibold">{quote.companyName}</p><p className="mt-1 text-[9px] text-blue-100">DEMO PLACEHOLDER COMPANY</p><p className="mt-2 text-[9px] text-blue-100">{quote.companyEmail} · {quote.companyPhone}</p></div><div className="rounded border border-white/25 px-2 py-1 text-[8px] font-semibold tracking-wide">SAMPLE QUOTATION</div></div></div><div className="space-y-4 p-5"><div className="flex justify-between gap-3"><div><p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Prepared for</p><p className="mt-1 text-[12px] font-semibold text-slate-800">{quote.customerName || 'Customer or company name'}</p><p className="mt-1 max-w-[240px] whitespace-pre-wrap text-[10px] leading-4 text-slate-500">{quote.customerAddress || 'Customer address'}</p>{quote.contactPerson && <p className="mt-1 text-[10px] text-slate-500">Attn: {quote.contactPerson}</p>}{quote.customerContact && <p className="mt-1 text-[10px] text-slate-500">{quote.customerContact}</p>}</div><div className="shrink-0 text-right text-[9px] text-slate-500"><p className="font-semibold text-slate-800">{quote.quotationNumber}</p><p className="mt-1">Date: {quote.quotationDate}</p><p>Valid until: {quote.validUntil}</p></div></div><div className="border-t border-slate-100 pt-3"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-semibold text-slate-800">{quote.meterName || 'Selected meter configuration'}</p><p className="text-[9px] text-slate-400">{quote.meterCode}</p><p className="mt-1 max-w-[340px] text-[9px] leading-4 text-slate-500">{quote.meterDescription}</p></div><p className="shrink-0 text-[9px] text-slate-500">Qty {quote.quantity}</p></div><div className="mt-3 border-t border-slate-100 pt-3"><div className="flex justify-between text-[10px] text-slate-600"><span>Unit selling price</span><span>{money(quote.unitSellingPriceNgn)}</span></div><div className="mt-1.5 flex justify-between text-[10px] text-slate-600"><span>Subtotal</span><span>{money(quote.subtotalNgn)}</span></div>{quote.discountPercent > 0 && <div className="mt-1.5 flex justify-between text-[10px] text-slate-600"><span>Discount ({quote.discountPercent}%)</span><span>− {money(quote.discountAmountNgn)}</span></div>}<div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-[12px] font-bold text-slate-900"><span>Quotation total</span><span>{money(quote.totalNgn)}</span></div><p className="mt-1 text-right text-[8px] text-slate-400">No tax applied</p></div></div><div className="grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2">{quote.paymentTerms && <div><p className="text-[9px] font-semibold text-slate-700">Payment terms</p><p className="mt-1 whitespace-pre-wrap text-[9px] leading-4 text-slate-500">{quote.paymentTerms}</p></div>}{quote.deliveryTerms && <div><p className="text-[9px] font-semibold text-slate-700">Delivery terms</p><p className="mt-1 whitespace-pre-wrap text-[9px] leading-4 text-slate-500">{quote.deliveryTerms}</p></div>}{quote.notes && <div className="sm:col-span-2"><p className="text-[9px] font-semibold text-slate-700">Additional notes</p><p className="mt-1 whitespace-pre-wrap text-[9px] leading-4 text-slate-500">{quote.notes}</p></div>}</div><p className="border-t border-slate-100 pt-3 text-[8px] text-slate-400">DEMO SAMPLE DOCUMENT · Fictional company and customer details</p></div></Card>
}

function HistoryPanel({ quotations, samples, onView, onExport }: { quotations: SavedQuotation[]; samples: Array<{ id: string; customer: string; meter: string; total: number; date: string; status: string }>; onView: (quotation: SavedQuotation) => void; onExport: () => void }) {
  return <Card className="overflow-hidden"><SectionTitle title="Quotation history" description="New saved snapshots stay in this browser's local demo storage. Legacy demo rows below are fictional and are not editable records." action={<Button variant="outline" size="sm" onClick={onExport}><Download size={13} /> Export</Button>} /><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead className="bg-slate-50 text-[9px] uppercase tracking-wide text-slate-400"><tr>{['Quotation / customer', 'Meter & quantity', 'Total', 'Date', 'Snapshot'].map((title) => <th className="px-4 py-3" key={title}>{title}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{quotations.map((quotation) => <tr key={quotation.id}><td className="px-4 py-3"><p className="text-[10px] font-semibold text-blue-700">{quotation.quotationNumber}</p><p className="mt-1 text-[10px] text-slate-600">{quotation.customer.companyName}</p></td><td className="px-4 py-3 text-[10px] text-slate-600">{quotation.configurationName} · {quotation.pricing.quantity.toLocaleString('en-NG')}</td><td className="px-4 py-3 text-[10px] font-semibold tabular-nums text-slate-800">{money(quotation.pricing.totalNgn)}</td><td className="px-4 py-3 text-[10px] text-slate-500">{quotation.quotationDate}</td><td className="px-4 py-3"><Button variant="outline" size="sm" onClick={() => onView(quotation)}>View saved</Button></td></tr>)}{samples.map((sample) => <tr key={sample.id} className="bg-slate-50/50"><td className="px-4 py-3"><p className="text-[10px] font-semibold text-slate-500">{sample.id}</p><p className="mt-1 text-[10px] text-slate-600">{sample.customer}</p></td><td className="px-4 py-3 text-[10px] text-slate-600">{sample.meter}</td><td className="px-4 py-3 text-[10px] font-semibold tabular-nums text-slate-700">{money(sample.total)}</td><td className="px-4 py-3 text-[10px] text-slate-500">{sample.date}</td><td className="px-4 py-3"><span className="rounded bg-slate-100 px-2 py-1 text-[9px] text-slate-500">{sample.status} · sample</span></td></tr>)}</tbody></table>{!quotations.length && !samples.length && <div className="p-8 text-center text-[11px] text-slate-500">No quotations are available yet.</div>}</div></Card>
}

export function QuotationsPage() {
  const { components, loading: componentsLoading } = useComponentCatalogue()
  const { configurations, loading: configurationsLoading } = useConfigurationCatalogue(components)
  const [searchParams, setSearchParams] = useSearchParams()
  const [quotationHistory, setQuotationHistory] = useState<SavedQuotation[]>(() => readSavedQuotations())
  const [configurationId, setConfigurationId] = useState(searchParams.get('configuration') ?? '')
  const configuration = configurations.find((item) => item.id === configurationId) ?? configurations[0]
  const [costInput, setCostInput] = useState<CostingInput | null>(null)
  const [customer, setCustomer] = useState<QuotationCustomer>(initialCustomer)
  const [date, setDate] = useState(dateToday)
  const [validityDays, setValidityDays] = useState('30')
  const [quantity, setQuantity] = useState('50')
  const [markup, setMarkup] = useState('20')
  const [discountEnabled, setDiscountEnabled] = useState(false)
  const [discount, setDiscount] = useState('5')
  const [paymentTerms, setPaymentTerms] = useState('50% advance, balance before dispatch')
  const [deliveryTerms, setDeliveryTerms] = useState('Delivery within 15 business days after order confirmation')
  const [notes, setNotes] = useState('')
  const [quotationNumber, setQuotationNumber] = useState(() => nextQuotationNumber(readSavedQuotations()))
  const [selectedSaved, setSelectedSaved] = useState<SavedQuotation | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!configuration) return
    const draft = readCostingDraft(configuration.id)
    setCostInput(draft ?? createDefaultCostInput(configuration, components))
    setSelectedSaved(null)
    if (searchParams.get('configuration') !== configuration.id) {
      const next = new URLSearchParams(searchParams)
      next.set('configuration', configuration.id)
      setSearchParams(next, { replace: true })
    }
  }, [configuration, components, componentsLoading, searchParams, setSearchParams])

  const componentById = useMemo(() => new Map(components.map((component) => [component.id, component])), [components])
  const sampleRows = useMemo(() => demoQuotations.map((quote) => {
    const customerRecord = demoCustomers.find((item) => item.id === quote.customerId)
    const meterRecord = demoConfigurations.find((item) => item.id === quote.configurationId)
    return { id: quote.id, customer: customerRecord?.name ?? 'Demo customer', meter: `${meterRecord?.name ?? 'Demo meter'} · ${quote.quantity} meters`, total: quote.unitPriceNgn * quote.quantity, date: quote.createdAt, status: quote.status }
  }), [])
  const resolvedInput: CostingInput | null = configuration && costInput ? {
    ...costInput,
    lines: costInput.lines.map((line) => {
      const catalogue = componentById.get(line.componentId)
      return { ...line, catalogueUnitCostNgn: catalogue?.currentUnitCostNgn ?? line.catalogueUnitCostNgn }
    }),
  } : null
  let costing: ReturnType<typeof calculateCosting> | null = null
  let costErrors: string[] = []
  if (resolvedInput) {
    costErrors = costingInputErrors(resolvedInput)
    if (!costErrors.length) {
      try { costing = calculateCosting(resolvedInput) }
      catch (cause) { costErrors = [cause instanceof Error ? cause.message : 'Unable to calculate the production cost.'] }
    }
  } else costErrors = ['Select a meter configuration and costing session.']

  let pricing = null as ReturnType<typeof calculateQuotationPricing> | null
  let pricingError = ''
  if (costing) {
    try { pricing = calculateQuotationPricing({ productionCostPerMeterNgn: costing.productionCostPerMeterNgn, markupPercent: markup.trim() ? Number(markup) : Number.NaN, quantity: quantity.trim() ? Number(quantity) : Number.NaN, discountEnabled, discountPercent: discount.trim() ? Number(discount) : Number.NaN }) }
    catch (cause) { pricingError = cause instanceof Error ? cause.message : 'Quotation pricing is invalid.' }
  }
  const detailErrors = [!customer.companyName.trim() ? 'Customer or company name is required.' : '', !customer.address.trim() ? 'Customer address is required.' : '', !date ? 'Quotation date is required.' : '', !Number.isSafeInteger(Number(validityDays)) || Number(validityDays) < 1 || Number(validityDays) > 365 ? 'Validity must be a whole number from 1 to 365 days.' : ''].filter(Boolean)
  const quoteIsSaved = quotationHistory.some((item) => item.quotationNumber === quotationNumber)
  const canPreview = Boolean(configuration && costing && pricing && !pricingError && !detailErrors.length)

  function makeSavedQuotation(snapshotId = `QT-SNAPSHOT-${Date.now()}`): SavedQuotation | null {
    if (!configuration || !resolvedInput || !costing || !pricing) return null
    const snapshot = captureCostingSnapshot(snapshotId, configuration, resolvedInput, costing)
    return {
      id: `Q-${Date.now()}`, quotationNumber, quotationDate: date, validityDays: Number(validityDays), customer: { ...customer },
      configurationId: configuration.id, configurationCode: configuration.code, configurationName: configuration.name,
      meterType: configuration.meterType, description: configuration.description, image: configuration.image,
      costingSnapshot: snapshot,
      quanSubtotals: costing.groups.filter((group) => group.lines.length > 0).map(({ group, subtotalNgn }) => ({ group, subtotalNgn })),
      pricing: { ...pricing }, paymentTerms, deliveryTerms, notes, status: 'Saved draft',
    }
  }

  const draftQuotation = makeSavedQuotation('QT-PREVIEW-SNAPSHOT')
  const livePreview = draftQuotation ? toCustomerFacingQuotation(draftQuotation) : null
  const preview = selectedSaved ? toCustomerFacingQuotation(selectedSaved) : livePreview
  const loading = componentsLoading || configurationsLoading

  function updateCustomer(key: keyof QuotationCustomer, value: string) { setCustomer((current) => ({ ...current, [key]: value })); setSelectedSaved(null); setError(''); setMessage('') }
  function handleCustomerPreset(id: string) {
    const preset = demoCustomers.find((item) => item.id === id)
    if (preset) { setCustomer({ companyName: preset.name, address: preset.location, contactPerson: preset.contactName, emailOrPhone: preset.email }); setSelectedSaved(null) }
  }
  function setCostQuantity(value: string) { setQuantity(value); setSelectedSaved(null); setMessage(''); setError('') }
  function saveQuotation() {
    if (!canPreview || !draftQuotation || quoteIsSaved) return
    const stored = storeSavedQuotation(draftQuotation)
    if (!stored) { setError('Could not save this quotation. The quotation number may already be in use or browser storage may be unavailable.'); return }
    const updated = readSavedQuotations()
    setQuotationHistory(updated)
    setMessage(`${quotationNumber} was saved as a draft snapshot. It has not been sent or approved.`)
    setError('')
  }
  function newQuotation() {
    const next = nextQuotationNumber(readSavedQuotations())
    setQuotationNumber(next)
    setCustomer(initialCustomer())
    setDate(dateToday())
    setValidityDays('30')
    setQuantity('50')
    setMarkup('20')
    setDiscountEnabled(false)
    setDiscount('5')
    setNotes('')
    setSelectedSaved(null)
    setMessage('')
    setError('')
  }
  function exportHistory() {
    downloadCsv('prepaid-quotations.csv', [
      ['Quotation ID', 'Customer', 'Meter and quantity', 'Total NGN', 'Date', 'Status'],
      ...quotationHistory.map((item) => [item.quotationNumber, item.customer.companyName, `${item.configurationName} · ${item.pricing.quantity} meters`, String(item.pricing.totalNgn), item.quotationDate, item.status]),
      ...sampleRows.map((item) => [item.id, item.customer, item.meter, String(item.total), item.date, `${item.status} · sample`]),
    ])
  }
  async function downloadExcel() {
    const quote = makeSavedQuotation('QT-EXPORT-SNAPSHOT')
    if (!quote) { setError(costErrors[0] ?? 'Correct the costing session before exporting.'); return }
    try { const { downloadInternalCostingWorkbook } = await import('../lib/quotation-exports'); downloadInternalCostingWorkbook(quote); setMessage('Internal costing workbook download started. This does not save or finalize the quotation.'); setError('') }
    catch { setError('Excel costing workbook could not be generated. No success was recorded.'); setMessage('') }
  }
  async function downloadPdf() {
    if (!canPreview || !livePreview) { setError(detailErrors[0] ?? pricingError ?? costErrors[0] ?? 'Complete valid quotation details before downloading the PDF.'); return }
    try { const { downloadCustomerQuotationPdf } = await import('../lib/quotation-exports'); downloadCustomerQuotationPdf(livePreview, quotationNumber); setMessage('Customer quotation PDF download started. This does not save or finalize the quotation.'); setError('') }
    catch { setError('Customer quotation PDF could not be generated. No success was recorded.'); setMessage('') }
  }
  const handleConfigurationChange = (id: string) => {
    setConfigurationId(id)
    setSelectedSaved(null)
    const next = new URLSearchParams(searchParams)
    next.set('configuration', id)
    setSearchParams(next)
  }

  if (loading) return <Card className="p-10 text-center text-[12px] text-slate-500">Loading demo configurations, components and costing sessions…</Card>
  if (!configuration) return <Card className="p-10 text-center"><h2 className="text-sm font-semibold text-slate-800">No meter configuration found</h2><p className="mt-2 text-xs text-slate-500">Create a configuration before preparing a quotation.</p></Card>

  return <div className="space-y-5">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-600">Commercial · Demo workflow</p><h2 className="mt-1.5 text-[21px] font-semibold tracking-tight text-slate-900">Quotation builder</h2><p className="mt-1 text-[12px] text-slate-500">Use the current costing session to prepare customer pricing and export separate internal and customer documents.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => document.getElementById('quotation-details')?.scrollIntoView({ behavior: 'smooth' })}>Edit quotation details</Button><Button variant="outline" onClick={() => { setSelectedSaved(null); document.getElementById('customer-quotation-preview')?.scrollIntoView({ behavior: 'smooth' }) }}>Preview quotation</Button><Button variant="outline" onClick={downloadExcel} disabled={!costing}><FileSpreadsheet size={14} /> Download Excel Costing</Button><Button onClick={saveQuotation} disabled={!canPreview || quoteIsSaved}><Save size={14} /> {quoteIsSaved ? 'Saved to history' : 'Save quotation'}</Button></div></div>
    {message && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[10px] text-emerald-800">{message}</div>}{error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-[10px] text-rose-700">{error}</div>}
    <div className="grid gap-3 sm:grid-cols-3"><Card className="p-4"><p className="text-[10px] text-slate-500">Quotation records</p><p className="mt-1 text-lg font-semibold text-slate-900">{quotationHistory.length + demoQuotations.length}<span className="ml-2 text-[9px] font-medium text-blue-600">demo</span></p></Card><Card className="p-4"><p className="text-[10px] text-slate-500">Historical samples awaiting approval</p><p className="mt-1 text-lg font-semibold text-slate-900">{demoQuotations.filter((item) => item.status === 'Awaiting approval').length}</p></Card><Card className="p-4"><p className="text-[10px] text-slate-500">Saved local draft total</p><p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">{money(quotationHistory.reduce((sum, item) => sum + item.pricing.totalNgn, 0))}</p></Card></div>
    {selectedSaved && <div className="flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-[10px] text-blue-800"><span>Viewing saved snapshot {selectedSaved.quotationNumber}. These values are preserved from the save date.</span><Button variant="ghost" size="sm" onClick={() => setSelectedSaved(null)}><X size={13} /> Return to builder</Button></div>}
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(400px,0.85fr)]">
      <div className="space-y-4">
        <Card className="overflow-hidden"><SectionTitle title="1. Meter configuration" description="Production costs come from this configuration's active costing session." /><div className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_145px]"><div><label className="block text-[10px] font-semibold text-slate-500">SELECT CONFIGURATION<select aria-label="Quotation meter configuration" value={configuration.id} onChange={(event) => handleConfigurationChange(event.target.value)} className={inputClass}>{configurations.map((item) => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}</select></label><div className="mt-4 flex items-start gap-3"><div className="min-w-0"><p className="text-[12px] font-semibold text-slate-800">{configuration.name} <span className="font-normal text-slate-400">· {configuration.code}</span></p><p className="mt-1 text-[10px] leading-4 text-slate-500">{configuration.description}</p></div></div></div><AssetImage src={configuration.image} alt={`${configuration.name} meter demo illustration`} className="h-24 w-full rounded-lg border border-slate-100 bg-slate-50 object-contain p-2" /></div></Card>
        <Card id="quotation-details" className="overflow-hidden"><SectionTitle title="2. Customer and quotation details" description="Fictional demo customers are provided so the workflow can be explored without real customer information." /><div className="grid gap-x-4 gap-y-3 p-5 sm:grid-cols-2"><label className="text-[10px] font-semibold text-slate-500 sm:col-span-2">DEMO CUSTOMER PRESET<select defaultValue={demoCustomers[0]?.id ?? ''} onChange={(event) => handleCustomerPreset(event.target.value)} className={inputClass}>{demoCustomers.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label className="text-[10px] font-semibold text-slate-500">CUSTOMER OR COMPANY NAME<input aria-label="Customer or company name" value={customer.companyName} onChange={(event) => updateCustomer('companyName', event.target.value)} className={inputClass} /></label><label className="text-[10px] font-semibold text-slate-500">CONTACT PERSON (OPTIONAL)<input aria-label="Contact person" value={customer.contactPerson} onChange={(event) => updateCustomer('contactPerson', event.target.value)} className={inputClass} /></label><label className="text-[10px] font-semibold text-slate-500 sm:col-span-2">CUSTOMER ADDRESS<textarea aria-label="Customer address" value={customer.address} onChange={(event) => updateCustomer('address', event.target.value)} rows={2} className={`${inputClass} h-auto py-2`} /></label><label className="text-[10px] font-semibold text-slate-500">EMAIL OR PHONE (OPTIONAL)<input aria-label="Customer email or phone" value={customer.emailOrPhone} onChange={(event) => updateCustomer('emailOrPhone', event.target.value)} className={inputClass} /></label><label className="text-[10px] font-semibold text-slate-500">QUOTATION NUMBER<input aria-label="Quotation number" value={quotationNumber} readOnly className={`${inputClass} bg-slate-50 text-slate-500`} /></label><label className="text-[10px] font-semibold text-slate-500">QUOTATION DATE<input aria-label="Quotation date" type="date" value={date} onChange={(event) => { setDate(event.target.value); setSelectedSaved(null) }} className={inputClass} /></label><label className="text-[10px] font-semibold text-slate-500">VALID FOR (DAYS)<input aria-label="Validity period in days" type="number" min="1" max="365" step="1" value={validityDays} onChange={(event) => { setValidityDays(event.target.value); setSelectedSaved(null) }} className={inputClass} /></label><label className="text-[10px] font-semibold text-slate-500 sm:col-span-2">PAYMENT TERMS<input aria-label="Payment terms" value={paymentTerms} onChange={(event) => { setPaymentTerms(event.target.value); setSelectedSaved(null) }} className={inputClass} /></label><label className="text-[10px] font-semibold text-slate-500 sm:col-span-2">DELIVERY TERMS<input aria-label="Delivery terms" value={deliveryTerms} onChange={(event) => { setDeliveryTerms(event.target.value); setSelectedSaved(null) }} className={inputClass} /></label><label className="text-[10px] font-semibold text-slate-500 sm:col-span-2">ADDITIONAL NOTES<textarea aria-label="Additional notes" value={notes} onChange={(event) => { setNotes(event.target.value); setSelectedSaved(null) }} rows={2} className={`${inputClass} h-auto py-2`} placeholder="Optional customer-facing note" /></label></div></Card>
        <Card className="overflow-hidden"><SectionTitle title="3. Internal costing and customer pricing" description="Markup is applied to production cost per meter from the existing costing service. Batch-only costs are reported in the Excel workbook and are not allocated into the per-meter selling price." /><div className="grid gap-4 p-5 sm:grid-cols-2"><label className="text-[10px] font-semibold text-slate-500">QUOTED QUANTITY (METERS)<input aria-label="Quoted quantity" type="number" min="1" step="1" value={quantity} onChange={(event) => setCostQuantity(event.target.value)} className={inputClass} /></label><label className="text-[10px] font-semibold text-slate-500">MARKUP (%)<input aria-label="Markup percentage" type="number" min="0" step="any" value={markup} onChange={(event) => { setMarkup(event.target.value); setSelectedSaved(null) }} className={inputClass} /></label><label className="flex items-center gap-2 text-[10px] font-semibold text-slate-600"><input aria-label="Enable discount" type="checkbox" checked={discountEnabled} onChange={(event) => { setDiscountEnabled(event.target.checked); setSelectedSaved(null) }} className="size-4 accent-blue-700" /> Apply optional discount</label><label className="text-[10px] font-semibold text-slate-500">DISCOUNT (%)<input aria-label="Discount percentage" type="number" min="0" max="100" step="any" value={discount} disabled={!discountEnabled} onChange={(event) => { setDiscount(event.target.value); setSelectedSaved(null) }} className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-400`} /></label></div><div className="grid gap-3 border-t border-slate-100 bg-slate-50/60 p-5 sm:grid-cols-2"><Metric label="Component cost / meter" value={costing ? money(costing.componentCostPerMeterNgn) : '—'} /><Metric label="Additional cost / meter" value={costing ? money(costing.productionCostPerMeterNgn - costing.componentCostPerMeterNgn) : '—'} /><Metric label="Production cost / meter" value={costing ? money(costing.productionCostPerMeterNgn) : '—'} emphasis /><Metric label={`Markup amount / meter (${markup || '—'}%)`} value={pricing ? money(pricing.markupAmountPerMeterNgn) : '—'} /><Metric label="Selling price / meter" value={pricing ? money(pricing.sellingPricePerMeterNgn) : '—'} emphasis /><Metric label={`Quotation subtotal · ${quantity || '—'} meters`} value={pricing ? money(pricing.subtotalNgn) : '—'} /><Metric label={discountEnabled ? `Discount (${discount || '—'}%)` : 'Discount'} value={pricing ? `− ${money(pricing.discountAmountNgn)}` : '—'} /><Metric label="Total before tax" value={pricing ? money(pricing.totalNgn) : '—'} emphasis /></div><div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-3"><span className="text-[9px] text-slate-500">No tax rate is configured or included in these totals.</span><Button variant="outline" size="sm" onClick={() => { setSelectedSaved(null); setMessage('Selling price recalculated from the current costing session.'); setError('') }} disabled={!pricing}><BadgeCheck size={13} /> Recalculate price</Button></div>{(costErrors.length > 0 || pricingError || detailErrors.length > 0) && <div role="alert" className="space-y-1 border-t border-amber-100 bg-amber-50 px-5 py-3 text-[10px] text-amber-800">{[...costErrors, pricingError, ...detailErrors].filter(Boolean).map((item) => <p key={item}>{item}</p>)}</div>}</Card>
        <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={downloadExcel} disabled={!costing}><FileSpreadsheet size={14} /> Download Excel Costing</Button><Button variant="outline" onClick={downloadPdf} disabled={!canPreview}><FileText size={14} /> Download PDF Quotation</Button><Button onClick={saveQuotation} disabled={!canPreview || quoteIsSaved}><Save size={14} /> {quoteIsSaved ? 'Saved to history' : 'Save quotation'}</Button><Button variant="ghost" onClick={newQuotation}><Plus size={14} /> New quotation</Button></div>
      </div>
      <aside id="customer-quotation-preview" className="space-y-4"><div className="flex items-center justify-between"><div><h3 className="text-[13px] font-semibold text-slate-900">Customer quotation preview</h3><p className="mt-1 text-[10px] text-slate-500">Matches the customer facing PDF; internal costs are excluded.</p></div>{selectedSaved && <span className="rounded bg-blue-50 px-2 py-1 text-[9px] font-semibold text-blue-700">SAVED SNAPSHOT</span>}</div>{preview ? <CustomerQuotationPreview quote={preview} /> : <Card className="p-8 text-center text-[11px] text-slate-500">Complete the required customer details and valid pricing to preview the quotation.</Card>}<Card className="overflow-hidden"><SectionTitle title="Export documents" description="Downloads do not save, send or approve a quotation." /><div className="space-y-3 p-4"><button onClick={downloadExcel} disabled={!costing} className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/40 disabled:opacity-50"><span className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><FileSpreadsheet size={17} /></span><span><span className="block text-[10px] font-semibold text-slate-800">Download Excel Costing</span><span className="mt-1 block text-[9px] text-slate-500">Internal component and production cost breakdown · XLSX</span></span><Download className="ml-auto text-slate-400" size={14} /></button><button onClick={downloadPdf} disabled={!canPreview} className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/40 disabled:opacity-50"><span className="flex size-9 items-center justify-center rounded-lg bg-rose-50 text-rose-700"><FileText size={17} /></span><span><span className="block text-[10px] font-semibold text-slate-800">Download PDF Quotation</span><span className="mt-1 block text-[9px] text-slate-500">Customer pricing only · no component costs or margin</span></span><Download className="ml-auto text-slate-400" size={14} /></button></div></Card><Card className="p-4"><h3 className="text-[11px] font-semibold text-slate-800">Current costing session</h3><p className="mt-1 text-[9px] leading-4 text-slate-500">{costing ? `${costing.componentCount} component lines · ${costing.productionQuantity} meter production batch` : 'Fix costing inputs to enable quotation pricing.'} This quote uses per-meter production cost. One-time batch charges stay separate in the internal costing workbook.</p><div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-[10px] text-slate-600"><span>Batch production total</span><span className="font-semibold tabular-nums">{costing ? money(costing.batchProductionCostNgn) : '—'}</span></div></Card></aside>
    </div>
    <HistoryPanel quotations={quotationHistory} samples={sampleRows} onView={setSelectedSaved} onExport={exportHistory} />
  </div>
}

function Metric({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return <div className={`rounded-lg border px-3 py-2.5 ${emphasis ? 'border-blue-100 bg-blue-50/60' : 'border-slate-100 bg-white'}`}><p className="text-[9px] text-slate-500">{label}</p><p className={`mt-1 text-[13px] font-semibold tabular-nums ${emphasis ? 'text-blue-900' : 'text-slate-800'}`}>{value}</p></div>
}
