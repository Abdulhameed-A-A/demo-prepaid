import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateCosting, captureCostingSnapshot, costingInputErrors, type CostingInput } from '../src/data/costing-service.ts'

const fixture: CostingInput = {
  productionQuantity: 4,
  lines: [
    { componentId: 'display-7', componentName: 'Display module', specification: '7 digit LCD', quantity: 1, unitOfMeasure: 'piece', quanGroup: 'Quan 1', unitCostNgn: 100, catalogueUnitCostNgn: 100 },
    { componentId: 'resistor-1k', componentName: 'Resistor', specification: '1 kΩ · 0.25 W', quantity: 2, unitOfMeasure: 'piece', quanGroup: 'Quan 2', unitCostNgn: 10, catalogueUnitCostNgn: 12 },
    { componentId: 'terminal-4', componentName: 'Terminal block', specification: '4 way', quantity: 3, unitOfMeasure: 'piece', quanGroup: 'Quan 3', unitCostNgn: 5, catalogueUnitCostNgn: 5 },
  ],
  additionalCosts: [
    { id: 'labour', name: 'Labour', amountNgn: 12, basis: 'per-unit' },
    { id: 'packaging', name: 'Packaging', amountNgn: 8, basis: 'per-unit' },
    { id: 'setup', name: 'Batch setup', amountNgn: 50, basis: 'batch' },
  ],
}

test('calculates line totals from quantity per meter and unit cost', () => {
  const result = calculateCosting(fixture)
  assert.deepEqual(result.groups.flatMap((group) => group.lines.map((line) => line.lineTotalNgn)), [100, 20, 15])
})

test('calculates Quan subtotals and returns zero for unused groups', () => {
  const result = calculateCosting(fixture)
  assert.deepEqual(result.groups.map((group) => [group.group, group.subtotalNgn]), [['Quan 1', 100], ['Quan 2', 20], ['Quan 3', 15], ['Quan 4', 0]])
  assert.equal(result.componentCostPerMeterNgn, 135)
})

test('adds per-unit costs to the component cost per meter', () => {
  const result = calculateCosting(fixture)
  assert.equal(result.perUnitAdditionalCostsNgn, 20)
  assert.equal(result.productionCostPerMeterNgn, 155)
})

test('multiplies per-meter production cost by batch quantity and adds batch-only costs once', () => {
  const result = calculateCosting(fixture)
  assert.equal(result.batchAdditionalCostsNgn, 50)
  assert.equal(result.batchProductionCostNgn, 670)
})

test('allows zero component quantity and contributes zero cost', () => {
  const result = calculateCosting({ ...fixture, lines: [{ ...fixture.lines[0], quantity: 0 }] })
  assert.equal(result.componentCount, 1)
  assert.equal(result.componentCostPerMeterNgn, 0)
})

test('rejects negative quantities, non-finite prices and non-positive production quantity', () => {
  const invalid = { ...fixture, productionQuantity: 0, lines: [{ ...fixture.lines[0], quantity: -1, unitCostNgn: Number.NaN }] }
  assert.equal(costingInputErrors(invalid).length, 3)
  assert.throws(() => calculateCosting(invalid), /must be a positive whole number/)
})

test('snapshot captures names, specs, quantities and costs used at costing time', () => {
  const result = calculateCosting(fixture)
  const snapshot = captureCostingSnapshot('COST-1', { id: 'cfg-1', code: 'MTR-1', name: 'Demo meter', meterType: 'Single phase', description: '5(60)A', image: '/meter.svg' }, fixture, result)
  assert.deepEqual(snapshot.lines.map(({ componentName, specification, quantity, unitCostNgn }) => [componentName, specification, quantity, unitCostNgn]), [
    ['Display module', '7 digit LCD', 1, 100], ['Resistor', '1 kΩ · 0.25 W', 2, 10], ['Terminal block', '4 way', 3, 5],
  ])
  assert.equal(snapshot.batchProductionCostNgn, 670)
})
