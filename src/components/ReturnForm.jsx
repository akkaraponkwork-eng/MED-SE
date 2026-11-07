'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle, XCircle, Home, User, AlertTriangle, Clock, Check, Plus } from 'lucide-react'

// รายการผลการตรวจที่พบบ่อย (แตะเพื่อเลือก/ถอดออกได้ทันที ไม่ต้องพิมพ์บนมือถือ)
const QUICK_EXAM_RESULTS = [
  'URI (ไข้หวัด)',
  'Pharyngitis (คออักเสบ)',
  'Myalgia (ปวดกล้ามเนื้อ)',
  'Dyspepsia (โรคกระเพาะ)',
  'AGE (ท้องเสีย)',
  'Dermatitis (ผื่นแพ้)',
  'ทำแผล / ล้างแผลเรียบร้อย',
  'ตรวจไม่พบความผิดปกติ'
]

const COMMON_MEDS = [
  'Paracetamol 500mg',
  'Amoxicillin 500mg',
  'Loratadine 10mg',
  'Bromhexine 8mg',
  'Brown Mixture',
  'Special Mouth Wash',
  'Oxymetazoline 0.025',
  'น้ำเกลือล้างจมูก',
  'CPM 4mg'
]

// เวลานัดหมายที่พบบ่อย
const QUICK_TIMES = ['08:30', '09:00', '10:00', '13:30']

export default function ReturnForm({ entry, onSave, onClose }) {
  const p = entry.patient || {}
  const fullName = [p.rank, p.firstName, p.lastName].filter(Boolean).join(' ') || 'ไม่ระบุชื่อ'

  // ดึงข้อมูลเดิมมาแสดง
  const [examResult, setExamResult] = useState(entry.examResult || '')
  const [treatment, setTreatment] = useState(entry.treatment || '')
  const [appointmentDate, setAppointmentDate] = useState(() => {
    if (entry.appointmentDate && /^\d{4}-\d{2}-\d{2}/.test(entry.appointmentDate)) {
      return entry.appointmentDate
    }
    return ''
  })
  const [appointmentText, setAppointmentText] = useState(() => {
    if (entry.patient?.appointmentText) return entry.patient.appointmentText
    if (entry.appointmentText) return entry.appointmentText
    if (entry.appointmentDate && !/^\d{4}-\d{2}-\d{2}/.test(entry.appointmentDate)) {
      return entry.appointmentDate
    }
    return ''
  })
  const [isEveryday, setIsEveryday] = useState(entry.patient?.isEveryday || false)

  // ปิด Modal เมื่อกด Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // สำหรับเวลา นัดต่อ
  const [apptTime, setApptTime] = useState(() => {
    if (entry.appointmentTime) {
      if (entry.appointmentTime.includes(':')) return entry.appointmentTime
      return `${entry.appointmentTime}:00`
    }
    return '09:00'
  })

  const [apptType, setApptType] = useState(() => {
    if (entry.noAppointment) return 'none'
    if (entry.patient?.appointmentText || entry.appointmentText) return 'text'
    if (!entry.appointmentDate) return 'none'
    if (/^\d{4}-\d{2}-\d{2}/.test(entry.appointmentDate)) return 'date'
    return 'text'
  })

  const [markNotReturned, setMarkNotReturned] = useState(false)

  const handleSave = () => {
    if (markNotReturned) {
      onSave({
        ...entry,
        returned: false,
        returnTime: '',
        examResult: '',
        treatment: '',
        appointmentDate: '',
        appointmentTime: '',
        noAppointment: false,
        patient: {
          ...entry.patient,
          appointmentText: '',
          isEveryday: false
        }
      })
    } else {
      onSave({
        ...entry,
        returned: true,
        returnTime: entry.returnTime || new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        examResult,
        treatment,
        appointmentDate: apptType === 'none' ? '' : appointmentDate,
        appointmentTime: apptType === 'none' ? '' : apptTime,
        noAppointment: apptType === 'none',
        patient: {
          ...entry.patient,
          appointmentText: apptType === 'text' ? appointmentText : '',
          isEveryday: apptType === 'text' && isEveryday
        }
      })
    }
  }

  // แตะเลือก / ถอดผลการตรวจที่พบบ่อย
  const handleToggleExamResult = (chip) => {
    const cur = (examResult || '').trim()
    if (!cur) {
      setExamResult(chip)
      return
    }
    const parts = cur.split(',').map(s => s.trim()).filter(Boolean)
    const idx = parts.indexOf(chip)
    if (idx >= 0) {
      parts.splice(idx, 1)
      setExamResult(parts.join(', '))
    } else {
      setExamResult([...parts, chip].join(', '))
    }
  }

  const addMed = (med) => {
    const prefix = treatment ? treatment.trimEnd() + '\n' : ''
    setTreatment(`${prefix}-${med} `)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Home size={20} style={{ color: 'var(--green-600)' }} />
            <h2 className="modal-title">บันทึกข้อมูลการรักษา (กลับจากส่งป่วย)</h2>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="ปิด">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Patient Info */}
          <div className="selected-patient" style={{ marginBottom: '1rem' }}>
            <User size={22} style={{ color: 'var(--green-600)', flexShrink: 0 }} />
            <div className="selected-patient-info" style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <strong>{fullName}</strong>
                {p.code && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--green-700)', background: 'var(--green-50)', border: '1px solid var(--green-200)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                    {p.code}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginTop: '0.15rem' }}>
                <span>{p.platoon && String(p.platoon).startsWith('หมวด') ? p.platoon : `หมวด ${p.platoon}`} เลขที่ {p.number}</span>
                {p.unit && <span style={{ marginLeft: '0.4rem', color: 'var(--gray-400)' }}>{p.unit}</span>}
              </div>
              {p.disease && p.disease !== '-' && (
                <div style={{ marginTop: '0.35rem', padding: '0.25rem 0.5rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#b91c1c', fontSize: '0.78rem', fontWeight: 600 }}>
                  โรคประจำตัว: {p.disease}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '1rem', padding: '0.6rem 0.75rem', background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--gray-700)' }}>
            <strong>อาการตอนไป:</strong> {entry.symptoms || '-'}
          </div>

          {/* Alert: กรณีบันทึกกลับแล้ว */}
          {entry.returned && (
            <div
              style={{
                padding: '0.75rem 1rem',
                background: '#fff7ed',
                border: '1.5px solid #fed7aa',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                fontSize: '0.875rem',
                color: '#c2410c',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <span>บันทึกข้อมูลแล้ว สามารถแก้ไขข้อมูล หรือเลือก "ยกเลิกการกลับ" ด้านล่าง</span>
            </div>
          )}

          {!markNotReturned && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* ผลการตรวจ */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>ผลการตรวจ</label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>แตะเลือกด้านล่างหรือพิมพ์เอง</span>
                </div>

                {/* Quick Exam Result Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.55rem' }}>
                  {QUICK_EXAM_RESULTS.map(item => {
                    const active = (examResult || '').includes(item)
                    return (
                      <button
                        key={item}
                        type="button"
                        className={`quick-chip ${active ? 'active' : ''}`}
                        onClick={() => handleToggleExamResult(item)}
                      >
                        {active && <Check size={13} />}
                        <span>{item}</span>
                      </button>
                    )
                  })}
                </div>

                <textarea
                  className="form-control"
                  placeholder="เช่น ตรวจไม่พบความผิดปกติ ล้างแผล ทำแผลเรียบร้อย"
                  value={examResult}
                  onChange={e => setExamResult(e.target.value)}
                  rows={2}
                />
              </div>

              {/* การรักษา (ยา) */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>การรักษา / รายการยา</label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>แตะเพื่อเพิ่มในรายการ</span>
                </div>

                {/* Quick Medication Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.55rem' }}>
                  {COMMON_MEDS.map(med => (
                    <button
                      key={med}
                      type="button"
                      className="quick-chip"
                      onClick={() => addMed(med)}
                      style={{ fontSize: '0.8rem' }}
                    >
                      <Plus size={13} style={{ color: 'var(--green-600)' }} />
                      <span>{med}</span>
                    </button>
                  ))}
                </div>

                <textarea
                  className="form-control"
                  placeholder="เช่น&#10;-Paracetamol 500mg 10 เม็ด&#10;-Special Mouth Wash 1 ขวด"
                  value={treatment}
                  onChange={e => setTreatment(e.target.value)}
                  rows={3}
                />
              </div>

              {/* การนัดหมาย */}
              <div style={{ background: 'var(--gray-50)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.5rem' }}>การนัดหมายครั้งถัดไป</label>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <label className="checkbox-label" style={{ padding: 0 }}>
                      <input
                        type="radio"
                        checked={apptType === 'date'}
                        onChange={() => setApptType('date')}
                        style={{ borderRadius: '50%' }}
                      />
                      <span>ระบุวันที่</span>
                    </label>
                    <label className="checkbox-label" style={{ padding: 0 }}>
                      <input
                        type="radio"
                        checked={apptType === 'text'}
                        onChange={() => setApptType('text')}
                        style={{ borderRadius: '50%' }}
                      />
                      <span>ระบุเป็นข้อความ</span>
                    </label>
                    <label className="checkbox-label" style={{ padding: 0 }}>
                      <input
                        type="radio"
                        checked={apptType === 'none'}
                        onChange={() => setApptType('none')}
                        style={{ borderRadius: '50%' }}
                      />
                      <span>ไม่มีนัด</span>
                    </label>
                  </div>
                </div>

                {apptType !== 'none' && (
                  <div className="appt-row">
                    <div>
                      <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                        {apptType === 'date' ? 'วันที่นัด' : 'วันที่นัด (ระบุเพื่อลงนัดล่วงหน้า)'}
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={appointmentDate}
                        onChange={e => setAppointmentDate(e.target.value)}
                      />
                      {apptType === 'text' && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                            ข้อความนัด (เช่น นัดล้างแผล)
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="เช่น นัดล้างแผล"
                            value={appointmentText}
                            onChange={e => setAppointmentText(e.target.value)}
                          />
                          <label className="checkbox-label" style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                              type="checkbox"
                              checked={isEveryday}
                              onChange={e => setIsEveryday(e.target.checked)}
                            />
                            <span>นัดต่อเนื่องทุกวัน</span>
                          </label>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                        เวลานัด
                      </label>
                      <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.45rem', flexWrap: 'wrap' }}>
                        {QUICK_TIMES.map(t => {
                          const active = apptTime === t
                          return (
                            <button
                              key={t}
                              type="button"
                              className={`quick-chip ${active ? 'active' : ''}`}
                              onClick={() => setApptTime(t)}
                              style={{ minHeight: '34px', fontSize: '0.8rem', padding: '0.25rem 0.6rem' }}
                            >
                              <Clock size={12} />
                              <span>{t} น.</span>
                            </button>
                          )
                        })}
                      </div>
                      <input
                        type="time"
                        className="form-control"
                        value={apptTime}
                        onChange={e => setApptTime(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ตัวเลือกยกเลิกการกลับ */}
          {entry.returned && (
            <label className="checkbox-label" style={{ marginTop: '1rem', color: '#b91c1c' }}>
              <input
                type="checkbox"
                checked={markNotReturned}
                onChange={e => setMarkNotReturned(e.target.checked)}
              />
              <span>ยกเลิกสถานะการกลับ (ล้างข้อมูลการรักษาออก และส่งกลับไปรอผล)</span>
            </label>
          )}
        </div>

        {/* Sticky Action Footer (ตรึงอยู่ด้านล่างหน้าจอโทรศัพท์เสมอ) */}
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1, minHeight: '44px' }}>
            ยกเลิก
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            style={{
              flex: 2,
              minHeight: '44px',
              fontWeight: 700,
              background: markNotReturned ? '#b91c1c' : undefined,
              borderColor: markNotReturned ? '#991b1b' : undefined
            }}
          >
            {markNotReturned
              ? <><XCircle size={18} /> ยืนยันยกเลิกการกลับ</>
              : <><CheckCircle size={18} /> บันทึกข้อมูลกลับ</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
