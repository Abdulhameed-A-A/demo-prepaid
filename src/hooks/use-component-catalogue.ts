import { useEffect, useState } from 'react'
import { demoComponents } from '../data/demo-data'
import { persistComponents, readStoredComponents } from '../data/component-catalog'
import type { MeterComponent } from '../types/catalog'

export function useComponentCatalogue() {
  const [components, setComponents] = useState<MeterComponent[]>(demoComponents)
  const [loading, setLoading] = useState(true)
  const [storageWarning, setStorageWarning] = useState(false)
  useEffect(() => { setComponents(readStoredComponents(demoComponents)); setLoading(false) }, [])
  function commit(next: MeterComponent[]) {
    setComponents(next)
    setStorageWarning(!persistComponents(next))
  }
  return { components, loading, storageWarning, commit }
}
