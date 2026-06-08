import { useContext } from 'react'
import { RecordsContext } from './recordsContext'

export function useSyncStatus() {
  const context = useContext(RecordsContext)
  return context ? context.syncStatus : 'synced'
}

