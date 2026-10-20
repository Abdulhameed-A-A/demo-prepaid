import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateQuotationPricing } from '../src/data/quotation-service.ts'

const productionCostPerMeterNgn = 1150 + 150

test('calculates the required 20 percent markup and ten meter subtotal', () => {
  const price = calculateQuotationPricing({ productionCostPerMeterNgn, markupPercent: 20, quantity: 10, discountEnabled: false, discountPercent: 0 })
  assert.equal(price.productionCostPerMeterNgn, 1300)
  assert.equal(price.markupAmountPerMeterNgn, 260)
  assert.equal(price.sellingPricePerMeterNgn, 1560)
  assert.equal(price.subtotalNgn, 15600)
  assert.equal(price.totalNgn, 15600)
})

test('applies a five percent discount after quotation subtotal', () => {
  const price = calculateQuotationPricing({ productionCostPerMeterNgn, markupPercent: 20, quantity: 10, discountEnabled: true, discountPercent: 5 })
  assert.equal(price.discountAmountNgn, 780)
  assert.equal(price.totalNgn, 14820)
})

test('updates the total when quotation quantity changes', () => {
  const price = calculateQuotationPricing({ productionCostPerMeterNgn, markupPercent: 20, quantity: 12, discountEnabled: false, discountPercent: 0 })
  assert.equal(price.subtotalNgn, 18720)
})

test('rejects invalid quantities, markup, discount, and costs', () => {
  const valid = { productionCostPerMeterNgn, markupPercent: 20, quantity: 10, discountEnabled: true, discountPercent: 5 }
  assert.throws(() => calculateQuotationPricing({ ...valid, productionCostPerMeterNgn: -1 }), /Production cost/)
  assert.throws(() => calculateQuotationPricing({ ...valid, markupPercent: -1 }), /Markup/)
  assert.throws(() => calculateQuotationPricing({ ...valid, quantity: 0 }), /positive whole number/)
  assert.throws(() => calculateQuotationPricing({ ...valid, discountPercent: 101 }), /between 0 and 100/)
  assert.throws(() => calculateQuotationPricing({ ...valid, markupPercent: Number.POSITIVE_INFINITY }), /Markup/)
})
