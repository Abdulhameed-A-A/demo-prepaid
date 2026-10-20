import { demoConfigurations } from './demo-data'
import type { MeterComponent, MeterConfiguration } from '../types/catalog'

export const CONFIGURATIONS_STORAGE_KEY = 'prepaid-demo-configurations-v1'

export function normalizeConfigurationLines(lines: Array<{ componentId: string; quantity: number }>, components: MeterComponent[]) {
  return lines.map((line) => {
    const component = components.find((item) => item.id === line.componentId)
    if (!component) throw new Error(`Select a valid component variant for line ${line.componentId}.`)
    return { componentId: component.id, quantity: line.quantity, unitOfMeasure: component.unitOfMeasure, quanGroup: component.quanGroup, costSnapshotNgn: component.currentUnitCostNgn }
  })
}

export function readStoredConfigurations(components: MeterComponent[]): MeterConfiguration[] {
  try {
    const stored = window.localStorage.getItem(CONFIGURATIONS_STORAGE_KEY)
    if (!stored) return demoConfigurations
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed) || !parsed.every((item) => item && typeof item.id === 'string' && typeof item.code === 'string' && typeof item.name === 'string' && Array.isArray(item.components))) return demoConfigurations
    const componentIds = new Set(components.map((component) => component.id))
    if (!parsed.every((item) => item.components.every((line: { componentId?: string; quantity?: number; costSnapshotNgn?: number }) => typeof line.componentId === 'string' && componentIds.has(line.componentId) && Number.isFinite(line.quantity) && (line.quantity ?? -1) >= 0 && Number.isFinite(line.costSnapshotNgn) && (line.costSnapshotNgn ?? -1) >= 0))) return demoConfigurations
    return parsed as MeterConfiguration[]
  } catch { return demoConfigurations }
}

export function persistConfigurations(configurations: MeterConfiguration[]): boolean {
  try { window.localStorage.setItem(CONFIGURATIONS_STORAGE_KEY, JSON.stringify(configurations)); return true } catch { return false }
}
