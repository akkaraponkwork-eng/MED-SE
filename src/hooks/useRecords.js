// ===== useRecords Hook =====
// จัดการสถานะและ CRUD สำหรับบันทึกส่งป่วยพร้อม cache ใน localStorage
import { useState, useEffect, useCallback } from 'react'
import * as api from '../services/api'
import { DEFAULT_PATIENTS } from '@/data/defaultPatients'

const CACHE_KEY = 'med_records_cache'
const PATIENTS_KEY = 'med_patients_cache'

// แปลง time ไม่ว่า format ไหน → HH:MM (24 ชม.)
function normalizeTime(val) {
  if (!val) return ''
  const s = String(val).trim()
  // HH:MM หรือ H:MM
  if (/^\d{1,2}:\d{2}/.test(s)) {
    const [h, m] = s.split(':')
    return `${String(h).padStart(2, '0')}:${m.slice(0, 2)}`
  }
  // Date string เช่น "Sat Dec 30 1899 09:00:00 GMT+0642"
  const dt = new Date(s)
  if (!isNaN(dt.getTime())) {
    return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
  }
  return ''
}

// แปลง date ไม่ว่า format ไหน → YYYY-MM-DD
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

// Normalize record ให้ทุก field อยู่ใน format ที่ถูกต้อง
function normalizeRecord(r) {
  if (!r) return null
  let patientObj = r.patient || {}
  // ป้องกันกรณี patient ถูกบันทึกเป็น string จาก cache หรือ API
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
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveCache(key, data) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
}

const PATIENTS_SOURCE_KEY = 'web_med_patients_source_v2'

export function usePatients() {
  const [patients, setPatients] = useState(() => loadCache(PATIENTS_KEY) || DEFAULT_PATIENTS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // รับการแจ้งเตือนเมื่อมีการบันทึกรายชื่อใหม่จากหน้าอื่น
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleUpdate = (e) => {
      const updated = e.detail || loadCache(PATIENTS_KEY)
      if (Array.isArray(updated) && updated.length > 0) {
        setPatients(updated)
      }
    }

    window.addEventListener('patients_updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('patients_updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  const fetchPatients = useCallback(async (force = false) => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getPatientList()
      if (Array.isArray(data) && data.length > 0) {
        const localSource = loadCache(PATIENTS_SOURCE_KEY)
        const localCache = loadCache(PATIENTS_KEY)

        // หากผู้ใช้เพิ่งนำเข้ารายชื่อใหม่ในเครื่อง (imported) และไม่ได้กด force sync
        // ให้ตรวจสอบว่า Google Sheet เป็นข้อมูลใหม่หรือไม่ ถ้ายังเป็นผลัดเก่า ไม่ให้ทับข้อมูลที่นำเข้า
        if (!force && localSource === 'imported' && Array.isArray(localCache) && localCache.length > 0) {
          // ถ้าข้อมูลจาก Google Sheet ไม่มี code แต่ข้อมูลในเครื่องมี code แสดงว่า Sheet ยังไม่ได้อัปเดต
          const localHasCode = localCache.some(p => p.code)
          const remoteHasCode = data.some(p => p.code)
          if (localHasCode && !remoteHasCode) {
            console.warn('Google Sheet ยังเป็นข้อมูลผลัดเดิม จึงเก็บข้อมูลที่นำเข้าล่าสุดไว้')
            return
          }
        }

        setPatients(data)
        saveCache(PATIENTS_KEY, data)
        saveCache(PATIENTS_SOURCE_KEY, 'sheet')
      } else if (!loadCache(PATIENTS_KEY)) {
        // ถ้า Sheet ว่างและยังไม่มีใน cache ให้ใช้ default
        saveCache(PATIENTS_KEY, DEFAULT_PATIENTS)
        saveCache(PATIENTS_SOURCE_KEY, 'default')
      }
    } catch (err) {
      setError(err.message)
      if (!loadCache(PATIENTS_KEY)) {
        saveCache(PATIENTS_KEY, DEFAULT_PATIENTS)
        saveCache(PATIENTS_SOURCE_KEY, 'default')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPatients() }, [fetchPatients])

  const savePatientsList = useCallback(async (newPatients, syncToSheet = true) => {
    const formatted = newPatients.map((p, idx) => ({
      id: p.id || `p${idx + 1}`,
      code: (p.code || '').trim(),
      rank: (p.rank || 'พลฯ').trim(),
      firstName: (p.firstName || '').trim(),
      lastName: (p.lastName || '').trim(),
      platoon: (p.platoon || 'หมวด 1').trim(),
      number: String(p.number || '').trim(),
      unit: (p.unit || '').trim(),
      citizenId: String(p.citizenId || '').trim(),
      disease: (p.disease || '').trim(),
      province: (p.province || '').trim(),
    }))

    setPatients(formatted)
    saveCache(PATIENTS_KEY, formatted)
    saveCache(PATIENTS_SOURCE_KEY, 'imported')

    // แจ้งเตือนทุก Component ให้ใช้รายชื่อใหม่ทันที
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('patients_updated', { detail: formatted }))
    }

    let syncError = null
    if (syncToSheet) {
      try {
        await api.replacePatients(formatted)
      } catch (err) {
        syncError = err.message
      }
    }

    return { success: true, count: formatted.length, syncError }
  }, [])

  const resetPatientsToDefault = useCallback(async () => {
    saveCache(PATIENTS_SOURCE_KEY, 'default')
    return await savePatientsList(DEFAULT_PATIENTS, true)
  }, [savePatientsList])

  return { 
    patients, 
    loading, 
    error, 
    refetch: fetchPatients, 
    savePatientsList, 
    resetPatientsToDefault 
  }
}

// syncStatus: 'synced' | 'syncing' | 'offline'
export function useRecords() {
  const [records, setRecords] = useState(() => {
    const cached = loadCache(CACHE_KEY) || []
    return cached.map(normalizeRecord).filter(Boolean)
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [syncStatus, setSyncStatus] = useState('synced')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    setSyncStatus('syncing')
    try {
      const data = await api.getAllRecords()
      const normalized = data.map(normalizeRecord).filter(Boolean)
      setRecords(normalized)
      saveCache(CACHE_KEY, normalized)
      setSyncStatus('synced')
    } catch (err) {
      setError(err.message)
      setSyncStatus('offline')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const getByDate = useCallback((date) => {
    return records.filter(r => r.date === date)
  }, [records])

  const getDatesWithRecords = useCallback(() => {
    const dates = new Set(records.map(r => r.date))
    return [...dates]
  }, [records])

  const add = useCallback(async (record) => {
    const newRecord = normalizeRecord({ ...record, id: Date.now().toString() + Math.random().toString().slice(2, 6) })
    setRecords(prev => {
      const updated = [...prev, newRecord]
      saveCache(CACHE_KEY, updated)
      return updated
    })
    try {
      await api.addRecord(newRecord)
      setSyncStatus('synced')
    } catch {
      setSyncStatus('offline')
    }
    return newRecord
  }, [])

  const update = useCallback(async (record) => {
    const normalized = normalizeRecord(record)
    setRecords(prev => {
      const updated = prev.map(r => r.id === normalized.id ? normalized : r)
      saveCache(CACHE_KEY, updated)
      return updated
    })
    try {
      await api.updateRecord(normalized)
      setSyncStatus('synced')
    } catch {
      setSyncStatus('offline')
    }
  }, [])

  const remove = useCallback(async (id) => {
    setRecords(prev => {
      const updated = prev.filter(r => r.id !== id)
      saveCache(CACHE_KEY, updated)
      return updated
    })
    try {
      await api.deleteRecord(id)
      setSyncStatus('synced')
    } catch {
      setSyncStatus('offline')
    }
  }, [])

  return { records, loading, error, syncStatus, getByDate, getDatesWithRecords, add, update, remove, refetch: fetchAll }
}
