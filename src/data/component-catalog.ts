import type { ComponentCategory, MeterComponent, QuanGroup } from '../types/catalog'

export const COMPONENTS_STORAGE_KEY = 'prepaid-demo-components-v1'
export const componentCategories: ComponentCategory[] = ['Metering IC', 'Resistor', 'Capacitor', 'Display module', 'Current transformer', 'Power module', 'Enclosure', 'Terminal & wiring', 'Keypad', 'Security seal', 'Calibration']
export const quanGroups: QuanGroup[] = ['Quan 1', 'Quan 2', 'Quan 3', 'Quan 4']
export type ComponentStatus = NonNullable<MeterComponent['status']>
export type ComponentDraft = Pick<MeterComponent, 'code' | 'name' | 'category' | 'specification' | 'unitOfMeasure' | 'currentUnitCostNgn' | 'quanGroup' | 'status'>
export type ComponentDraftInput = Omit<ComponentDraft, 'currentUnitCostNgn'> & { currentUnitCostNgn: string | number }

export const statusOf = (component: MeterComponent): ComponentStatus => component.status ?? 'Active'

export function validateComponentDraft(input: ComponentDraftInput, components: MeterComponent[], editingId?: string): Partial<Record<keyof ComponentDraftInput, string>> {
  const errors: Partial<Record<keyof ComponentDraftInput, string>> = {}
  if (!input.code.trim()) errors.code = 'Enter a component code.'
  else if (components.some((item) => item.code.toLowerCase() === input.code.trim().toLowerCase() && item.id !== editingId)) errors.code = 'This component code is already in use.'
  if (!input.name.trim()) errors.name = 'Enter a component name.'
  if (!input.specification.trim()) errors.specification = 'Enter the technical specification or variant.'
  const cost = Number(input.currentUnitCostNgn)
  if (input.currentUnitCostNgn === '' || !Number.isFinite(cost) || cost <= 0 || cost > Number.MAX_SAFE_INTEGER) errors.currentUnitCostNgn = 'Enter a valid unit cost greater than ₦0 within the supported range.'
  return errors
}

export function filterAndSortComponents(components: MeterComponent[], options: { query?: string; quanGroup?: string; category?: string; status?: string; sort?: 'name' | 'cost'; direction?: 'asc' | 'desc' }): MeterComponent[] {
  const query = options.query?.trim().toLowerCase() ?? ''
  return components.filter((item) => (!query || `${item.name} ${item.code}`.toLowerCase().includes(query))
    && (!options.quanGroup || options.quanGroup === 'all' || item.quanGroup === options.quanGroup)
    && (!options.category || options.category === 'all' || item.category === options.category)
    && (!options.status || options.status === 'all' || statusOf(item) === options.status))
    .sort((a, b) => {
      const result = options.sort === 'cost' ? a.currentUnitCostNgn - b.currentUnitCostNgn : a.name.localeCompare(b.name, 'en')
      return options.direction === 'desc' ? -result : result
    })
}

export function readStoredComponents(fallback: MeterComponent[]): MeterComponent[] {
  try {
    const stored = window.localStorage.getItem(COMPONENTS_STORAGE_KEY)
    if (!stored) return fallback
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed) || !parsed.every((item) => item && typeof item.id === 'string' && typeof item.code === 'string' && typeof item.currentUnitCostNgn === 'number' && Array.isArray(item.priceHistory))) return fallback
    return parsed as MeterComponent[]
  } catch { return fallback }
}

export function persistComponents(components: MeterComponent[]): boolean {
  try { window.localStorage.setItem(COMPONENTS_STORAGE_KEY, JSON.stringify(components)); return true } catch { return false }
}

export function getCategoryImage(category: ComponentCategory): string {
  if (category === 'Display module') return '/images/display-module-closeup.jpg'
  if (category === 'Enclosure') return '/images/meter-enclosure.svg'
  if (category === 'Terminal & wiring' || category === 'Security seal') return '/images/wiring-terminal-block.jpg'
  if (category === 'Keypad') return '/images/prepaid-meter.svg'
  if (category === 'Resistor' || category === 'Capacitor') return '/images/electronic-components-reference.jpg'
  return '/images/meter-circuit-board-closeup.jpg'
}
