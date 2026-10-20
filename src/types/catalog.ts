export type QuanGroup = 'Quan 1' | 'Quan 2' | 'Quan 3' | 'Quan 4'

export type ComponentCategory =
  | 'Metering IC'
  | 'Resistor'
  | 'Capacitor'
  | 'Display module'
  | 'Current transformer'
  | 'Power module'
  | 'Enclosure'
  | 'Terminal & wiring'
  | 'Keypad'
  | 'Security seal'
  | 'Calibration'

export type ComponentPriceChange = {
  id: string
  date: string
  previousUnitCostNgn: number
  unitCostNgn: number
  supplier: string
  note: string
}

export type MeterComponent = {
  id: string
  code: string
  name: string
  category: ComponentCategory
  specification: string
  unitOfMeasure: 'piece' | 'set' | 'hour'
  currentUnitCostNgn: number
  quanGroup: QuanGroup
  image: string
  priceHistory: ComponentPriceChange[]
  status?: 'Active' | 'Draft' | 'Review'
  updatedAt?: string
}

export type ConfigurationLine = {
  componentId: MeterComponent['id']
  quantity: number
  unitOfMeasure: MeterComponent['unitOfMeasure']
  quanGroup: QuanGroup
  costSnapshotNgn: number
}

export type MeterConfiguration = {
  id: string
  code: string
  name: string
  meterType: 'Single phase' | 'Three phase'
  description: string
  phase: 'Single phase' | 'Three phase'
  rating: string
  image: string
  status: 'Approved' | 'In review' | 'Draft'
  components: ConfigurationLine[]
}

export type DemoCustomer = {
  id: string
  name: string
  contactName: string
  email: string
  location: string
}

export type DemoQuotation = {
  id: string
  customerId: DemoCustomer['id']
  configurationId: MeterConfiguration['id']
  quantity: number
  unitPriceNgn: number
  marginPercent: number
  status: 'Awaiting approval' | 'Sent to client' | 'Approved' | 'Expired' | 'Draft'
  createdAt: string
  validUntil: string
}
