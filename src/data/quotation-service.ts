import type { CostingSnapshot } from './costing-service'

export const QUOTATIONS_STORAGE_KEY = 'prepaid-demo-quotation-snapshots-v1'

export type QuotationCustomer = {
  companyName: string
  address: string
  contactPerson: string
  emailOrPhone: string
}

export type QuotationPricingInput = {
  productionCostPerMeterNgn: number
  markupPercent: number
  quantity: number
  discountEnabled: boolean
  discountPercent: number
}

export type QuotationPricing = {
  productionCostPerMeterNgn: number
  markupPercent: number
  markupAmountPerMeterNgn: number
  sellingPricePerMeterNgn: number
  quantity: number
  subtotalNgn: number
  discountEnabled: boolean
  discountPercent: number
  discountAmountNgn: number
  totalNgn: number
}

export type SavedQuotation = {
  id: string
  quotationNumber: string
  quotationDate: string
  validityDays: number
  customer: QuotationCustomer
  configurationId: string
  configurationCode: string
  configurationName: string
  meterType: string
  description: string
  image: string
  costingSnapshot: CostingSnapshot
  quanSubtotals: Array<{ group: string; subtotalNgn: number }>
  pricing: QuotationPricing
  paymentTerms: string
  deliveryTerms: string
  notes: string
  status: 'Saved draft'
}

export type CustomerFacingQuotation = {
  companyName: string
  companyEmail: string
  companyPhone: string
  quotationNumber: string
  quotationDate: string
  validUntil: string
  customerName: string
  customerAddress: string
  contactPerson: string
  customerContact: string
  meterName: string
  meterCode: string
  meterDescription: string
  quantity: number
  unitSellingPriceNgn: number
  subtotalNgn: number
  discountPercent: number
  discountAmountNgn: number
  totalNgn: number
  paymentTerms: string
  deliveryTerms: string
  notes: string
}

const safe = (value: number) => Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER

export function calculateQuotationPricing(input: QuotationPricingInput): QuotationPricing {
  if (!safe(input.productionCostPerMeterNgn)) throw new RangeError('Production cost per meter must be a valid non-negative amount.')
  if (!safe(input.markupPercent)) throw new RangeError('Markup must be a valid non-negative percentage.')
  if (!Number.isSafeInteger(input.quantity) || input.quantity <= 0) throw new RangeError('Quoted quantity must be a positive whole number.')
  if (!safe(input.discountPercent) || input.discountPercent > 100) throw new RangeError('Discount must be between 0 and 100 percent.')
  const markupAmountPerMeterNgn = input.productionCostPerMeterNgn * input.markupPercent / 100
  const sellingPricePerMeterNgn = input.productionCostPerMeterNgn + markupAmountPerMeterNgn
  const subtotalNgn = sellingPricePerMeterNgn * input.quantity
  const discountAmountNgn = input.discountEnabled ? subtotalNgn * input.discountPercent / 100 : 0
  const totalNgn = subtotalNgn - discountAmountNgn
  if (![markupAmountPerMeterNgn, sellingPricePerMeterNgn, subtotalNgn, discountAmountNgn, totalNgn].every(safe)) throw new RangeError('The quotation total is outside the supported range.')
  return { productionCostPerMeterNgn: input.productionCostPerMeterNgn, markupPercent: input.markupPercent, markupAmountPerMeterNgn, sellingPricePerMeterNgn, quantity: input.quantity, subtotalNgn, discountEnabled: input.discountEnabled, discountPercent: input.discountEnabled ? input.discountPercent : 0, discountAmountNgn, totalNgn }
}

export function nextQuotationNumber(quotations: SavedQuotation[], year = new Date().getFullYear()): string {
  const prefix = `QT-${year}-`
  const used = new Set(quotations.map((item) => item.quotationNumber))
  const sequence = quotations.reduce((max, item) => {
    const match = item.quotationNumber.match(new RegExp(`^QT-${year}-(\\d+)$`))
    return match ? Math.max(max, Number(match[1])) : max
  }, 0)
  let next = sequence + 1
  while (used.has(`${prefix}${String(next).padStart(3, '0')}`)) next += 1
  return `${prefix}${String(next).padStart(3, '0')}`
}

export function readSavedQuotations(): SavedQuotation[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(QUOTATIONS_STORAGE_KEY) ?? '[]') as unknown
    return Array.isArray(parsed) && parsed.every((item) => item && typeof item.quotationNumber === 'string' && item.costingSnapshot && Array.isArray(item.costingSnapshot.lines) && Number.isFinite(item.pricing?.totalNgn)) ? parsed as SavedQuotation[] : []
  } catch { return [] }
}

export function storeSavedQuotation(quotation: SavedQuotation): boolean {
  try {
    const existing = readSavedQuotations()
    if (existing.some((item) => item.quotationNumber === quotation.quotationNumber)) return false
    window.localStorage.setItem(QUOTATIONS_STORAGE_KEY, JSON.stringify([quotation, ...existing]))
    return true
  } catch { return false }
}

export function toCustomerFacingQuotation(quotation: SavedQuotation): CustomerFacingQuotation {
  const date = new Date(`${quotation.quotationDate}T12:00:00`)
  date.setDate(date.getDate() + quotation.validityDays)
  const validUntil = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return {
    companyName: 'Prepaid Meter Demo Company',
    companyEmail: 'sales@example.invalid',
    companyPhone: '+234 000 000 0000',
    quotationNumber: quotation.quotationNumber,
    quotationDate: quotation.quotationDate,
    validUntil,
    customerName: quotation.customer.companyName,
    customerAddress: quotation.customer.address,
    contactPerson: quotation.customer.contactPerson,
    customerContact: quotation.customer.emailOrPhone,
    meterName: quotation.configurationName,
    meterCode: quotation.configurationCode,
    meterDescription: quotation.description,
    quantity: quotation.pricing.quantity,
    unitSellingPriceNgn: quotation.pricing.sellingPricePerMeterNgn,
    subtotalNgn: quotation.pricing.subtotalNgn,
    discountPercent: quotation.pricing.discountEnabled ? quotation.pricing.discountPercent : 0,
    discountAmountNgn: quotation.pricing.discountAmountNgn,
    totalNgn: quotation.pricing.totalNgn,
    paymentTerms: quotation.paymentTerms,
    deliveryTerms: quotation.deliveryTerms,
    notes: quotation.notes,
  }
}
