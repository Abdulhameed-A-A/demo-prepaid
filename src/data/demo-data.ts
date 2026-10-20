import type { ComponentPriceChange, DemoCustomer, DemoQuotation, MeterConfiguration, MeterComponent } from '../types/catalog'
import { calculateCosting } from './costing-service'

const priceChange = (id: string, date: string, previousUnitCostNgn: number, unitCostNgn: number, supplier: string, note: string): ComponentPriceChange => ({ id, date, previousUnitCostNgn, unitCostNgn, supplier, note })

export const demoComponents: MeterComponent[] = [
  { id: 'cmp-metering-ic-a1', code: 'IC-MTR-A1', name: 'Metering IC', category: 'Metering IC', specification: 'ADE7755 · single-phase energy measurement · 5(60)A', unitOfMeasure: 'piece', currentUnitCostNgn: 4850, quanGroup: 'Quan 1', image: '/images/meter-circuit-board-closeup.jpg', priceHistory: [priceChange('chg-ic-2024-10', '2024-10-21', 4650, 4850, 'Fictional demo supplier · CircuitSource NG', 'Quarterly supplier revision'), priceChange('chg-ic-2024-07', '2024-07-12', 4400, 4650, 'Fictional demo supplier · CircuitSource NG', 'Freight adjustment')] },
  { id: 'cmp-resistor-1k-025w', code: 'RES-1K-025W', name: 'Metal film resistor', category: 'Resistor', specification: '1 kΩ · ±1% · 0.25 W · axial', unitOfMeasure: 'piece', currentUnitCostNgn: 18, quanGroup: 'Quan 2', image: '/images/electronic-components-reference.jpg', priceHistory: [priceChange('chg-res1-2024-10', '2024-10-08', 16, 18, 'Fictional demo supplier · CircuitSource NG', 'Updated landed cost')] },
  { id: 'cmp-resistor-10k-05w', code: 'RES-10K-05W', name: 'Metal film resistor', category: 'Resistor', specification: '10 kΩ · ±1% · 0.5 W · axial', unitOfMeasure: 'piece', currentUnitCostNgn: 24, quanGroup: 'Quan 2', image: '/images/electronic-components-reference.jpg', priceHistory: [priceChange('chg-res2-2024-09', '2024-09-19', 22, 24, 'Fictional demo supplier · CircuitSource NG', 'New demo price')] },
  { id: 'cmp-resistor-100k-025w', code: 'RES-100K-025W', name: 'Metal film resistor', category: 'Resistor', specification: '100 kΩ · ±1% · 0.25 W · axial', unitOfMeasure: 'piece', currentUnitCostNgn: 20, quanGroup: 'Quan 2', image: '/images/electronic-components-reference.jpg', priceHistory: [priceChange('chg-res3-2024-06', '2024-06-04', 19, 20, 'Fictional demo supplier · CircuitSource NG', 'Annual price review')] },
  { id: 'cmp-cap-10uf-50v', code: 'CAP-10UF-50V', name: 'Aluminium electrolytic capacitor', category: 'Capacitor', specification: '10 µF · 50 V · ±20% · radial', unitOfMeasure: 'piece', currentUnitCostNgn: 42, quanGroup: 'Quan 2', image: '/images/electronic-components-reference.jpg', priceHistory: [priceChange('chg-cap1-2024-10', '2024-10-04', 38, 42, 'Fictional demo supplier · CircuitSource NG', 'Supplier update')] },
  { id: 'cmp-cap-100uf-25v', code: 'CAP-100UF-25V', name: 'Aluminium electrolytic capacitor', category: 'Capacitor', specification: '100 µF · 25 V · ±20% · radial', unitOfMeasure: 'piece', currentUnitCostNgn: 58, quanGroup: 'Quan 2', image: '/images/electronic-components-reference.jpg', priceHistory: [priceChange('chg-cap2-2024-08', '2024-08-23', 55, 58, 'Fictional demo supplier · CircuitSource NG', 'Supplier update')] },
  { id: 'cmp-display-lcd-7seg', code: 'DSP-LCD-7S', name: 'Segment LCD module', category: 'Display module', specification: '7 digit · reflective TN · 3 V · 1/4 duty', unitOfMeasure: 'piece', currentUnitCostNgn: 2200, quanGroup: 'Quan 1', image: '/images/display-module-closeup.jpg', priceHistory: [priceChange('chg-disp1-2024-10', '2024-10-19', 2350, 2200, 'Fictional demo supplier · DisplayWorks', 'Volume discount')] },
  { id: 'cmp-display-lcd-backlit', code: 'DSP-LCD-BL', name: 'Segment LCD module', category: 'Display module', specification: '8 digit · green backlight · 3.3 V · FPC 20 pin', unitOfMeasure: 'piece', currentUnitCostNgn: 3450, quanGroup: 'Quan 1', image: '/images/display-module-closeup.jpg', priceHistory: [priceChange('chg-disp2-2024-07', '2024-07-11', 3200, 3450, 'Fictional demo supplier · DisplayWorks', 'Backlit variant revision')] },
  { id: 'cmp-ct-1000-1', code: 'CT-1000-1', name: 'Current transformer', category: 'Current transformer', specification: '1000:1 · 0.2 class · 5(60)A input', unitOfMeasure: 'piece', currentUnitCostNgn: 1750, quanGroup: 'Quan 1', image: '/images/meter-circuit-board-closeup.jpg', priceHistory: [priceChange('chg-ct1-2024-09', '2024-09-30', 1820, 1750, 'Fictional demo supplier · MeasurePoint', 'New contract pricing')] },
  { id: 'cmp-ct-2500-1', code: 'CT-2500-1', name: 'Current transformer', category: 'Current transformer', specification: '2500:1 · 0.2 class · 10(100)A input', unitOfMeasure: 'piece', currentUnitCostNgn: 2480, quanGroup: 'Quan 1', image: '/images/meter-circuit-board-closeup.jpg', priceHistory: [priceChange('chg-ct2-2024-08', '2024-08-15', 2350, 2480, 'Fictional demo supplier · MeasurePoint', 'Higher current rating variant')] },
  { id: 'cmp-psu-3w-acdc', code: 'PSU-3W-ACDC', name: 'Isolated power module', category: 'Power module', specification: '85–265 V AC input · 3.3 V DC · 3 W', unitOfMeasure: 'piece', currentUnitCostNgn: 2450, quanGroup: 'Quan 2', image: '/images/meter-circuit-board-closeup.jpg', priceHistory: [priceChange('chg-psu1-2024-10', '2024-10-14', 2400, 2450, 'Fictional demo supplier · VoltCore', 'Updated freight estimate')] },
  { id: 'cmp-psu-5w-acdc', code: 'PSU-5W-ACDC', name: 'Isolated power module', category: 'Power module', specification: '85–265 V AC input · 5 V DC · 5 W', unitOfMeasure: 'piece', currentUnitCostNgn: 3150, quanGroup: 'Quan 2', image: '/images/meter-circuit-board-closeup.jpg', priceHistory: [priceChange('chg-psu2-2024-07', '2024-07-20', 3000, 3150, 'Fictional demo supplier · VoltCore', '5 W variant revision')] },
  { id: 'cmp-case-ip54-1p', code: 'CASE-IP54-1P', name: 'Meter enclosure', category: 'Enclosure', specification: 'IP54 · UV-stabilized polycarbonate · single phase', unitOfMeasure: 'piece', currentUnitCostNgn: 3600, quanGroup: 'Quan 3', image: '/images/meter-enclosure.svg', priceHistory: [priceChange('chg-case1-2024-10', '2024-10-17', 3300, 3600, 'Fictional demo supplier · MoldTech West', 'Resin cost update')] },
  { id: 'cmp-case-ip54-3p', code: 'CASE-IP54-3P', name: 'Meter enclosure', category: 'Enclosure', specification: 'IP54 · UV-stabilized polycarbonate · three phase', unitOfMeasure: 'piece', currentUnitCostNgn: 6850, quanGroup: 'Quan 3', image: '/images/meter-enclosure.svg', priceHistory: [priceChange('chg-case2-2024-09', '2024-09-02', 6500, 6850, 'Fictional demo supplier · MoldTech West', 'Larger housing revision')] },
  { id: 'cmp-terminal-4way', code: 'TERM-4WAY', name: 'Meter terminal block', category: 'Terminal & wiring', specification: '4 way · brass insert · 100 A rated', unitOfMeasure: 'piece', currentUnitCostNgn: 980, quanGroup: 'Quan 3', image: '/images/wiring-terminal-block.jpg', priceHistory: [priceChange('chg-term1-2024-06', '2024-06-28', 930, 980, 'Fictional demo supplier · Connectix', 'Copper content adjustment')] },
  { id: 'cmp-terminal-8way', code: 'TERM-8WAY', name: 'Meter terminal block', category: 'Terminal & wiring', specification: '8 way · brass insert · 100 A rated', unitOfMeasure: 'piece', currentUnitCostNgn: 1480, quanGroup: 'Quan 3', image: '/images/wiring-terminal-block.jpg', priceHistory: [priceChange('chg-term2-2024-08', '2024-08-01', 1410, 1480, 'Fictional demo supplier · Connectix', 'Terminal variant revision')] },
  { id: 'cmp-keypad-3x4', code: 'KEY-3X4', name: 'Membrane keypad', category: 'Keypad', specification: '3 × 4 numeric · 12 key · 1M cycle', unitOfMeasure: 'piece', currentUnitCostNgn: 1250, quanGroup: 'Quan 1', image: '/images/prepaid-meter.svg', priceHistory: [priceChange('chg-key-2024-05', '2024-05-26', 1180, 1250, 'Fictional demo supplier · HMI Assembly', 'Keypad overlay refresh')] },
  { id: 'cmp-seal-tamper', code: 'SEAL-TAMPER', name: 'Anti-tamper seal set', category: 'Security seal', specification: 'Numbered polymer seal · pack of 2', unitOfMeasure: 'set', currentUnitCostNgn: 165, quanGroup: 'Quan 4', image: '/images/wiring-terminal-block.jpg', priceHistory: [priceChange('chg-seal-2024-04', '2024-04-13', 150, 165, 'Fictional demo supplier · SecureTag', 'Batch material change')] },
  { id: 'cmp-cal-test', code: 'CAL-TEST', name: 'Calibration & test', category: 'Calibration', specification: 'Bench calibration · accuracy class 1.0', unitOfMeasure: 'hour', currentUnitCostNgn: 1850, quanGroup: 'Quan 4', image: '/images/meter-circuit-board-closeup.jpg', priceHistory: [priceChange('chg-cal-2024-03', '2024-03-08', 1750, 1850, 'Fictional demo supplier · TestBench Services', 'Labor rate review')] },
]

type DemoConfigurationInput = Omit<MeterConfiguration, 'components' | 'meterType' | 'description'> & { components: Array<{ componentId: string; quantity: number }> }

const rawDemoConfigurations: DemoConfigurationInput[] = [
  { id: 'cfg-pre-1p-smart', code: 'PRE-1P-SMART', name: 'PRE-1P Smart', phase: 'Single phase', rating: '5(60)A · direct connected', image: '/images/prepaid-meter.svg', status: 'Approved', components: [{ componentId: 'cmp-metering-ic-a1', quantity: 1 }, { componentId: 'cmp-display-lcd-7seg', quantity: 1 }, { componentId: 'cmp-ct-1000-1', quantity: 1 }, { componentId: 'cmp-psu-3w-acdc', quantity: 1 }, { componentId: 'cmp-case-ip54-1p', quantity: 1 }, { componentId: 'cmp-terminal-4way', quantity: 1 }, { componentId: 'cmp-keypad-3x4', quantity: 1 }, { componentId: 'cmp-resistor-1k-025w', quantity: 4 }, { componentId: 'cmp-resistor-10k-05w', quantity: 2 }, { componentId: 'cmp-cap-10uf-50v', quantity: 2 }, { componentId: 'cmp-cap-100uf-25v', quantity: 1 }, { componentId: 'cmp-seal-tamper', quantity: 1 }, { componentId: 'cmp-cal-test', quantity: 1 }] },
  { id: 'cfg-pre-1p-basic', code: 'PRE-1P-BASIC', name: 'PRE-1P Basic', phase: 'Single phase', rating: '5(60)A · direct connected', image: '/images/prepaid-meter.svg', status: 'Approved', components: [{ componentId: 'cmp-metering-ic-a1', quantity: 1 }, { componentId: 'cmp-display-lcd-7seg', quantity: 1 }, { componentId: 'cmp-ct-1000-1', quantity: 1 }, { componentId: 'cmp-psu-3w-acdc', quantity: 1 }, { componentId: 'cmp-case-ip54-1p', quantity: 1 }, { componentId: 'cmp-terminal-4way', quantity: 1 }, { componentId: 'cmp-keypad-3x4', quantity: 1 }, { componentId: 'cmp-resistor-100k-025w', quantity: 4 }, { componentId: 'cmp-cap-10uf-50v', quantity: 2 }, { componentId: 'cmp-seal-tamper', quantity: 1 }, { componentId: 'cmp-cal-test', quantity: 1 }] },
  { id: 'cfg-pre-3p-commercial', code: 'PRE-3P-COM', name: 'PRE-3P Commercial', phase: 'Three phase', rating: '10(100)A · direct connected', image: '/images/three-phase-meter.svg', status: 'In review', components: [{ componentId: 'cmp-metering-ic-a1', quantity: 1 }, { componentId: 'cmp-display-lcd-backlit', quantity: 1 }, { componentId: 'cmp-ct-2500-1', quantity: 3 }, { componentId: 'cmp-psu-5w-acdc', quantity: 1 }, { componentId: 'cmp-case-ip54-3p', quantity: 1 }, { componentId: 'cmp-terminal-8way', quantity: 1 }, { componentId: 'cmp-keypad-3x4', quantity: 1 }, { componentId: 'cmp-resistor-1k-025w', quantity: 8 }, { componentId: 'cmp-resistor-10k-05w', quantity: 4 }, { componentId: 'cmp-cap-100uf-25v', quantity: 3 }, { componentId: 'cmp-seal-tamper', quantity: 2 }, { componentId: 'cmp-cal-test', quantity: 2 }] },
]

export const demoConfigurations: MeterConfiguration[] = rawDemoConfigurations.map((configuration) => ({
  ...configuration,
  meterType: configuration.phase,
  description: configuration.rating,
  components: configuration.components.map((line) => {
    const component = demoComponents.find((item) => item.id === line.componentId)
    if (!component) throw new Error(`Unknown component ${line.componentId} in ${configuration.code}`)
    return { ...line, unitOfMeasure: component.unitOfMeasure, quanGroup: component.quanGroup, costSnapshotNgn: component.currentUnitCostNgn }
  }),
}))

export const demoCustomers: DemoCustomer[] = [
  { id: 'cus-lagoon-energy', name: 'Lagoon Energy Cooperative', contactName: 'Tomi Adebayo', email: 'tomi@lagoon-demo.example', location: 'Lagos, Nigeria' },
  { id: 'cus-northstar-utilities', name: 'Northstar Utility Partners', contactName: 'Ibrahim Musa', email: 'ibrahim@northstar-demo.example', location: 'Kaduna, Nigeria' },
  { id: 'cus-riverbend-power', name: 'Riverbend Power Services', contactName: 'Chika Nwosu', email: 'chika@riverbend-demo.example', location: 'Enugu, Nigeria' },
]

export const demoQuotations: DemoQuotation[] = [
  { id: 'QT-DEMO-0089', customerId: 'cus-lagoon-energy', configurationId: 'cfg-pre-3p-commercial', quantity: 250, unitPriceNgn: 39168, marginPercent: 19, status: 'Awaiting approval', createdAt: '2024-10-22', validUntil: '2024-11-21' },
  { id: 'QT-DEMO-0088', customerId: 'cus-riverbend-power', configurationId: 'cfg-pre-1p-smart', quantity: 200, unitPriceNgn: 23422, marginPercent: 21, status: 'Sent to client', createdAt: '2024-10-21', validUntil: '2024-11-20' },
  { id: 'QT-DEMO-0087', customerId: 'cus-northstar-utilities', configurationId: 'cfg-pre-3p-commercial', quantity: 150, unitPriceNgn: 39168, marginPercent: 19, status: 'Approved', createdAt: '2024-10-18', validUntil: '2024-11-17' },
  { id: 'QT-DEMO-0086', customerId: 'cus-lagoon-energy', configurationId: 'cfg-pre-1p-basic', quantity: 500, unitPriceNgn: 23111, marginPercent: 20, status: 'Expired', createdAt: '2024-10-16', validUntil: '2024-10-30' },
  { id: 'QT-DEMO-0085', customerId: 'cus-riverbend-power', configurationId: 'cfg-pre-1p-smart', quantity: 120, unitPriceNgn: 23616, marginPercent: 22, status: 'Approved', createdAt: '2024-10-12', validUntil: '2024-11-11' },
  { id: 'QT-DEMO-0084', customerId: 'cus-northstar-utilities', configurationId: 'cfg-pre-1p-basic', quantity: 300, unitPriceNgn: 22918, marginPercent: 19, status: 'Draft', createdAt: '2024-10-08', validUntil: '2024-11-07' },
]

export function getConfigurationCostNgn(configuration: MeterConfiguration, components: MeterComponent[] = demoComponents) {
  return calculateCosting({ productionQuantity: 1, lines: configuration.components.map((line) => {
    const component = components.find((item) => item.id === line.componentId)
    if (!component) throw new Error(`Unknown component ${line.componentId} in ${configuration.code}`)
    return { componentId: component.id, componentName: component.name, specification: component.specification, quantity: line.quantity, unitOfMeasure: line.unitOfMeasure, quanGroup: line.quanGroup, unitCostNgn: component.currentUnitCostNgn, catalogueUnitCostNgn: component.currentUnitCostNgn }
  }), additionalCosts: [] }).componentCostPerMeterNgn
}

export const demoPriceChanges = demoComponents.flatMap((component) => component.priceHistory.map((change) => ({ ...change, componentId: component.id, componentCode: component.code, componentName: component.name, category: component.category }))).sort((a, b) => b.date.localeCompare(a.date))

export function validateDemoReferences() {
  const componentIds = new Set(demoComponents.map((component) => component.id))
  const customerIds = new Set(demoCustomers.map((customer) => customer.id))
  const configurationIds = new Set(demoConfigurations.map((configuration) => configuration.id))
  const missingConfigurationComponents = demoConfigurations.flatMap((configuration) => configuration.components.filter((line) => !componentIds.has(line.componentId)).map((line) => `${configuration.id} → ${line.componentId}`))
  const missingQuotationCustomers = demoQuotations.filter((quotation) => !customerIds.has(quotation.customerId)).map((quotation) => `${quotation.id} → ${quotation.customerId}`)
  const missingQuotationConfigurations = demoQuotations.filter((quotation) => !configurationIds.has(quotation.configurationId)).map((quotation) => `${quotation.id} → ${quotation.configurationId}`)
  const duplicateComponentIds = demoComponents.map((component) => component.id).filter((id, index, all) => all.indexOf(id) !== index)
  const outOfDateComponentPrices = demoComponents.filter((component) => {
    const latestChange = [...component.priceHistory].sort((a, b) => b.date.localeCompare(a.date))[0]
    return !latestChange || latestChange.unitCostNgn !== component.currentUnitCostNgn
  }).map((component) => component.id)
  const inconsistentQuotationMargins = demoQuotations.filter((quotation) => {
    const configuration = demoConfigurations.find((item) => item.id === quotation.configurationId)
    return !configuration || Math.round(getConfigurationCostNgn(configuration) * (1 + quotation.marginPercent / 100)) !== quotation.unitPriceNgn
  }).map((quotation) => quotation.id)
  const problems = [...missingConfigurationComponents, ...missingQuotationCustomers, ...missingQuotationConfigurations, ...duplicateComponentIds, ...outOfDateComponentPrices, ...inconsistentQuotationMargins]
  if (problems.length > 0) throw new Error(`Demo data has invalid references: ${problems.join(', ')}`)
  return { componentCount: demoComponents.length, configurationCount: demoConfigurations.length, customerCount: demoCustomers.length, quotationCount: demoQuotations.length, priceChangeCount: demoPriceChanges.length, validConfigurationComponentReferences: demoConfigurations.reduce((total, configuration) => total + configuration.components.length, 0) }
}
