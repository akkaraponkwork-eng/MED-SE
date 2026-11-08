'use client'

// ===== useRecords & usePatients Hooks =====
import { useState, useEffect, useCallback, useContext } from 'react'
import * as api from '../services/api'
import { DEFAULT_PATIENTS } from '@/data/defaultPatients'
import { RecordsContext } from './recordsContext'

const CACHE_KEY = 'med_records_cache'
const PATIENTS_KEY = 'med_patients_cache'
const PATIENTS_SOURCE_KEY = 'med_patients_source'

// แปลง time ไม่ว่า format ไหน → HH:MM (24 ชม.)
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

export function usePatients() {
  const [patients, setPatients] = useState(() => {
    const cached = loadCache(PATIENTS_KEY)
    if (cached && Array.isArray(cached) && cached.length > 0) return cached
    return DEFAULT_PATIENTS
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchPatients = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getPatientList()
      if (Array.isArray(data) && data.length > 0) {
        const source = loadCache(PATIENTS_SOURCE_KEY)
        const hasCodeInRemote = data.some(p => p.code && p.code.trim() !== '')

        if (source === 'imported' && !hasCodeInRemote) {
          console.log('[usePatients] ข้อมูลท้องถิ่นมาจากการ Import และ Google Sheet ยังเป็นข้อมูลเก่า — คงข้อมูล Import ไว้')
        } else {
          setPatients(data)
          saveCache(PATIENTS_KEY, data)
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPatients()

    const handlePatientsUpdated = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setPatients(e.detail)
      }
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('patients_updated', handlePatientsUpdated)
      return () => window.removeEventListener('patients_updated', handlePatientsUpdated)
    }
  }, [fetchPatients])

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

// Hook สำหรับดึง state records จาก Context
export function useRecords() {
  const context = useContext(RecordsContext)
  if (!context) {
    throw new Error('useRecords must be used within a RecordsProvider')
  }
  return context
}
