import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import * as api from '../services/api'

const CACHE_KEY = 'med_records_cache'
const QUEUE_KEY = 'med_sync_queue'

export const RecordsContext = createContext(null)

// Helpers for normalization and cache (reused from useRecords.js)
function normalizeTime(val) {
  if (!val) return ''
  const s = String(val).trim()
  if (/^\d{1,2}:\d{2}/.test(s)) {
    const [h, m] = s.split(':')
    return `${String(h).padStart(2, '0')}:${m.slice(0, 2)}`
  }
  const dt = new Date(s)
  if (!isNaN(dt.getTime())) {
    return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
  }
  return ''
}

function normalizeDate(val) {
  if (!val) return ''
  const s = String(val).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  const dt = new Date(s)
  if (!isNaN(dt.getTime())) {
    const y = dt.getFullYear()
    const m = String(dt.getMonth() + 1).padStart(2, '0')
    const d = String(dt.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return s
}

function normalizeRecord(r) {
  let patientObj = r.patient || {}
  if (typeof patientObj === 'string') {
    try { patientObj = JSON.parse(patientObj) } catch { patientObj = {} }
  }

  return {
    ...r,
    patient: patientObj,
    date: normalizeDate(r.date),
    appointmentDate: normalizeDate(r.appointmentDate),
    appointmentTime: normalizeTime(r.appointmentTime),
    destination: r.destination || 'ตร.ศบบ.',
    returned: r.returned === true || r.returned === 'TRUE',
    noAppointment: r.noAppointment === true || r.noAppointment === 'TRUE',
    returnTime: normalizeTime(r.returnTime),
    returnNotes: r.returnNotes || '',
  }
}

function loadCache(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveCache(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
}

export function RecordsProvider({ children }) {
  const [records, setRecords] = useState(() => {
    const cached = loadCache(CACHE_KEY) || []
    return cached.map(normalizeRecord)
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [syncStatus, setSyncStatus] = useState('synced')

  const syncLockRef = useRef(false)

  // Load sync queue from LocalStorage
  const getQueue = useCallback(() => {
    return loadCache(QUEUE_KEY) || []
  }, [])

  // Process the offline queue
  const syncQueueAsync = useCallback(async () => {
    if (syncLockRef.current) return false
    const queue = getQueue()
    if (queue.length === 0) {
      setSyncStatus('synced')
      return true
    }

    if (!navigator.onLine) {
      setSyncStatus('offline')
      return false
    }

    syncLockRef.current = true
    setSyncStatus('syncing')
    setError(null)

    const workingQueue = [...queue]
    let success = true

    for (let i = 0; i < workingQueue.length; i++) {
      const action = workingQueue[i]
      try {
        if (action.type === 'add') {
          await api.addRecord(action.record)
        } else if (action.type === 'update') {
          await api.updateRecord(action.record)
        } else if (action.type === 'delete') {
          await api.deleteRecord(action.recordId)
        }
        // Remove from queue and update storage
        workingQueue.splice(i, 1)
        saveCache(QUEUE_KEY, workingQueue)
        i-- // Adjust index after splice
      } catch (err) {
        console.error('Failed to sync queue action:', action, err)
        setSyncStatus('offline')
        setError(`Sync error: ${err.message}`)
        success = false
        break
      }
    }

    syncLockRef.current = false
    if (success) {
      setSyncStatus('synced')
    }
    return success
  }, [getQueue])

  // Fetch all records from the API (with offline fallback and queue sync check)
  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    // First try to clear the sync queue if there are items
    const queueCleared = await syncQueueAsync()
    if (!queueCleared) {
      setLoading(false)
      return // Don't fetch and overwrite local data if we have pending unsynced changes
    }

    setSyncStatus('syncing')
    try {
      const data = await api.getAllRecords()
      const normalized = data.map(normalizeRecord)
      setRecords(normalized)
      saveCache(CACHE_KEY, normalized)
      setSyncStatus('synced')
    } catch (err) {
      console.warn('fetchAll failed, using cached records:', err.message)
      setError(err.message)
      setSyncStatus('offline')
    } finally {
      setLoading(false)
    }
  }, [syncQueueAsync])

  // Add action to the queue
  const enqueueAction = useCallback((action) => {
    const queue = getQueue()
    const newQueue = [...queue, action]
    saveCache(QUEUE_KEY, newQueue)
    // Run sync in the background
    syncQueueAsync()
  }, [getQueue, syncQueueAsync])

  const add = useCallback(async (record) => {
    const newRecord = normalizeRecord({
      ...record,
      id: Date.now().toString() + Math.random().toString().slice(2, 6)
    })
    
    // Update local state and cache immediately
    setRecords(prev => {
      const updated = [...prev, newRecord]
      saveCache(CACHE_KEY, updated)
      return updated
    })

    // Enqueue mutation
    enqueueAction({ type: 'add', recordId: newRecord.id, record: newRecord })
    return newRecord
  }, [enqueueAction])

  const update = useCallback(async (record) => {
    const normalized = normalizeRecord(record)
    
    // Update local state and cache immediately
    setRecords(prev => {
      const updated = prev.map(r => r.id === normalized.id ? normalized : r)
      saveCache(CACHE_KEY, updated)
      return updated
    })

    // Enqueue mutation (remove any previous pending adds/updates for the same id if applicable to keep queue minimal,
    // but a simple append works fine since update will eventually overwrite on server)
    enqueueAction({ type: 'update', recordId: normalized.id, record: normalized })
  }, [enqueueAction])

  const remove = useCallback(async (id) => {
    // Update local state and cache immediately
    setRecords(prev => {
      const updated = prev.filter(r => r.id !== id)
      saveCache(CACHE_KEY, updated)
      return updated
    })

    // Enqueue mutation
    enqueueAction({ type: 'delete', recordId: id })
  }, [enqueueAction])

  const getByDate = useCallback((date) => {
    return records.filter(r => r.date === date)
  }, [records])

  const getDatesWithRecords = useCallback(() => {
    const dates = new Set(records.map(r => r.date))
    return [...dates]
  }, [records])

  // Initial load
  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Automatic sync when online status changes
  useEffect(() => {
    const handleOnline = () => {
      console.log('App came online, syncing queue...')
      syncQueueAsync().then(success => {
        if (success) {
          fetchAll()
        }
      })
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [syncQueueAsync, fetchAll])

  return (
    <RecordsContext.Provider value={{
      records,
      loading,
      error,
      syncStatus,
      getByDate,
      getDatesWithRecords,
      add,
      update,
      remove,
      refetch: fetchAll
    }}>
      {children}
    </RecordsContext.Provider>
  )
}

export function useRecordsContext() {
  const context = useContext(RecordsContext)
  if (!context) {
    throw new Error('useRecordsContext must be used within a RecordsProvider')
  }
  return context
}
