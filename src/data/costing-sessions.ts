import type { CostingInput, CostingSnapshot } from './costing-service'

export const COSTING_SESSIONS_STORAGE_KEY = 'prepaid-demo-costing-sessions-v1'
export const COSTING_DRAFTS_STORAGE_KEY = 'prepaid-demo-costing-drafts-v1'
export function readCostingSnapshots(): CostingSnapshot[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(COSTING_SESSIONS_STORAGE_KEY) ?? '[]') as unknown
    return Array.isArray(value) && value.every((item) => item && typeof item.id === 'string' && Array.isArray(item.lines) && Number.isFinite(item.batchProductionCostNgn)) ? value as CostingSnapshot[] : []
  } catch { return [] }
}
export function storeCostingSnapshot(snapshot: CostingSnapshot): boolean {
  try {
    const snapshots = readCostingSnapshots()
    window.localStorage.setItem(COSTING_SESSIONS_STORAGE_KEY, JSON.stringify([snapshot, ...snapshots].slice(0, 30)))
    return true
  } catch { return false }
}

export function readCostingDraft(configurationId: string): CostingInput | null {
  try {
    const drafts = JSON.parse(window.localStorage.getItem(COSTING_DRAFTS_STORAGE_KEY) ?? '{}') as Record<string, CostingInput>
    const draft = drafts[configurationId]
    return draft && Array.isArray(draft.lines) && Array.isArray(draft.additionalCosts) ? draft : null
  } catch { return null }
}

export function storeCostingDraft(configurationId: string, input: CostingInput): boolean {
  try {
    const drafts = JSON.parse(window.localStorage.getItem(COSTING_DRAFTS_STORAGE_KEY) ?? '{}') as Record<string, CostingInput>
    drafts[configurationId] = input
    window.localStorage.setItem(COSTING_DRAFTS_STORAGE_KEY, JSON.stringify(drafts))
    return true
  } catch { return false }
}
