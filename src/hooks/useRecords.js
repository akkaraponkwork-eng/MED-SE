import { useState, useEffect, useCallback, useContext } from 'react'
import * as api from '../services/api'
import { RecordsContext } from './recordsContext'


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
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveCache(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
}

export function usePatients() {
  const [patients, setPatients] = useState(() => loadCache(PATIENTS_KEY) || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchPatients = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getPatientList()
      setPatients(data)
      saveCache(PATIENTS_KEY, data)
    } catch (err) {
      setError(err.message)
      // ถ้า fetch ไม่สำเร็จ ใช้ cache ที่มีอยู่
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPatients() }, [fetchPatients])

  return { patients, loading, error, refetch: fetchPatients }
}


// syncStatus: 'synced' | 'syncing' | 'offline'
export function useRecords() {
  const context = useContext(RecordsContext)
  if (!context) {
    throw new Error('useRecords must be used within a RecordsProvider')
  }
  return context
}
