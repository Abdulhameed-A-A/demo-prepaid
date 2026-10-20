export type CostBasis = 'per-unit' | 'batch'
export type CostLineInput = {
  componentId: string
  componentCode?: string
  componentName: string
  specification: string
  quantity: number
  unitOfMeasure: string
  quanGroup: string
  unitCostNgn: number
  catalogueUnitCostNgn: number
}
export type AdditionalCostInput = { id: string; name: string; amountNgn: number; basis: CostBasis }
export type CostingInput = { productionQuantity: number; lines: CostLineInput[]; additionalCosts: AdditionalCostInput[] }
export type CostLineResult = CostLineInput & { lineTotalNgn: number; differsFromCatalogue: boolean }
export type QuanSubtotal = { group: string; subtotalNgn: number; lines: CostLineResult[] }
export type CostingResult = {
  productionQuantity: number
  componentCount: number
  groups: QuanSubtotal[]
  componentCostPerMeterNgn: number
  perUnitAdditionalCostsNgn: number
  batchAdditionalCostsNgn: number
  additionalCosts: AdditionalCostInput[]
  productionCostPerMeterNgn: number
  batchProductionCostNgn: number
}
export type CostingSnapshot = {
  id: string
  createdAt: string
  configurationId: string
  configurationCode: string
  configurationName: string
  meterType: string
  description: string
  image: string
  productionQuantity: number
  lines: Array<{ componentId: string; componentCode: string; componentName: string; specification: string; quantity: number; unitOfMeasure: string; quanGroup: string; unitCostNgn: number; lineTotalNgn: number }>
  additionalCosts: AdditionalCostInput[]
  componentCostPerMeterNgn: number
  productionCostPerMeterNgn: number
  batchProductionCostNgn: number
}

const isSafeAmount = (amount: number) => Number.isFinite(amount) && Math.abs(amount) <= Number.MAX_SAFE_INTEGER

export function costingInputErrors(input: CostingInput): string[] {
  const errors: string[] = []
  if (!Number.isSafeInteger(input.productionQuantity) || input.productionQuantity <= 0) errors.push('Production quantity must be a positive whole number within the supported range.')
  input.lines.forEach((line) => {
    if (!isSafeAmount(line.quantity) || line.quantity < 0) errors.push(`${line.componentName}: quantity must be zero or greater and within the supported range.`)
    if (!isSafeAmount(line.unitCostNgn) || line.unitCostNgn < 0) errors.push(`${line.componentName}: unit cost must be zero or greater and within the supported range.`)
    if (!isSafeAmount(line.catalogueUnitCostNgn) || line.catalogueUnitCostNgn < 0) errors.push(`${line.componentName}: catalogue cost is invalid.`)
  })
  input.additionalCosts.forEach((cost) => {
    if (!cost.name.trim()) errors.push('Each additional cost needs a name.')
    if (!isSafeAmount(cost.amountNgn) || cost.amountNgn < 0) errors.push(`${cost.name || 'Additional cost'}: amount must be zero or greater and within the supported range.`)
    if (cost.basis !== 'per-unit' && cost.basis !== 'batch') errors.push(`${cost.name || 'Additional cost'}: choose a valid cost basis.`)
  })
  return errors
}

export function calculateCosting(input: CostingInput): CostingResult {
  const errors = costingInputErrors(input)
  if (errors.length) throw new RangeError(errors.join(' '))
  const lines: CostLineResult[] = input.lines.map((line) => {
    const lineTotalNgn = line.quantity * line.unitCostNgn
    if (!isSafeAmount(lineTotalNgn)) throw new RangeError(`${line.componentName}: line total is outside the supported range.`)
    return { ...line, lineTotalNgn, differsFromCatalogue: line.unitCostNgn !== line.catalogueUnitCostNgn }
  })
  const groupNames = [...new Set(['Quan 1', 'Quan 2', 'Quan 3', 'Quan 4', ...lines.map((line) => line.quanGroup)])]
  const groups = groupNames.map((group) => ({ group, subtotalNgn: lines.filter((line) => line.quanGroup === group).reduce((sum, line) => sum + line.lineTotalNgn, 0), lines: lines.filter((line) => line.quanGroup === group) }))
  const componentCostPerMeterNgn = groups.reduce((sum, group) => sum + group.subtotalNgn, 0)
  const perUnitAdditionalCostsNgn = input.additionalCosts.filter((cost) => cost.basis === 'per-unit').reduce((sum, cost) => sum + cost.amountNgn, 0)
  const batchAdditionalCostsNgn = input.additionalCosts.filter((cost) => cost.basis === 'batch').reduce((sum, cost) => sum + cost.amountNgn, 0)
  const productionCostPerMeterNgn = componentCostPerMeterNgn + perUnitAdditionalCostsNgn
  const batchProductionCostNgn = productionCostPerMeterNgn * input.productionQuantity + batchAdditionalCostsNgn
  if (![componentCostPerMeterNgn, perUnitAdditionalCostsNgn, batchAdditionalCostsNgn, productionCostPerMeterNgn, batchProductionCostNgn].every(isSafeAmount)) throw new RangeError('The calculated total is outside the supported range.')
  return { productionQuantity: input.productionQuantity, componentCount: lines.length, groups, componentCostPerMeterNgn, perUnitAdditionalCostsNgn, batchAdditionalCostsNgn, additionalCosts: input.additionalCosts.map((cost) => ({ ...cost })), productionCostPerMeterNgn, batchProductionCostNgn }
}

export function captureCostingSnapshot(id: string, configuration: { id: string; code: string; name: string; meterType: string; description: string; image: string }, input: CostingInput, result = calculateCosting(input)): CostingSnapshot {
  return {
    id, createdAt: new Date().toISOString(), configurationId: configuration.id, configurationCode: configuration.code,
    configurationName: configuration.name, meterType: configuration.meterType, description: configuration.description,
    image: configuration.image, productionQuantity: result.productionQuantity,
    lines: result.groups.flatMap((group) => group.lines.map((line) => ({ componentId: line.componentId, componentCode: line.componentCode ?? line.componentId, componentName: line.componentName, specification: line.specification, quantity: line.quantity, unitOfMeasure: line.unitOfMeasure, quanGroup: line.quanGroup, unitCostNgn: line.unitCostNgn, lineTotalNgn: line.lineTotalNgn }))),
    additionalCosts: result.additionalCosts.map((cost) => ({ ...cost })), componentCostPerMeterNgn: result.componentCostPerMeterNgn,
    productionCostPerMeterNgn: result.productionCostPerMeterNgn, batchProductionCostNgn: result.batchProductionCostNgn,
  }
}
