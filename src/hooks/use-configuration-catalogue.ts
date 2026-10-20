import { useEffect, useState } from 'react'
import { persistConfigurations, readStoredConfigurations } from '../data/configuration-catalog'
import { demoComponents, demoConfigurations } from '../data/demo-data'
import type { MeterComponent, MeterConfiguration } from '../types/catalog'

export function useConfigurationCatalogue(components: MeterComponent[] = demoComponents) {
  const [configurations, setConfigurations] = useState<MeterConfiguration[]>([])
  const [loading, setLoading] = useState(true)
  const [storageWarning, setStorageWarning] = useState(false)
  useEffect(() => { setConfigurations(readStoredConfigurations(components)); setLoading(false) }, [components])
  function commit(next: MeterConfiguration[]) {
    setConfigurations(next)
    setStorageWarning(!persistConfigurations(next))
  }
  return { configurations: configurations.length ? configurations : demoConfigurations, loading, storageWarning, commit }
}
