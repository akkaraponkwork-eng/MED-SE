import { useState } from 'react'
import { X, CheckCircle, XCircle } from 'lucide-react'
import ImageCropperModal from './ImageCropperModal'

export default function ReturnForm({ entry, onSave, onClose }) {
  const p = entry.patient
  const fullName = `${p.rank} ${p.firstName} ${p.lastName}`

  // ดึงข้อมูลเดิมมาแสดง
  const [examResult, setExamResult] = useState(entry.examResult || '')
  const [treatment, setTreatment] = useState(entry.treatment || '')
  const [noAppointment, setNoAppointment] = useState(entry.noAppointment || false)
  const [appointmentDate, setAppointmentDate] = useState(entry.appointmentDate || '')
  
  // สำหรับเวลา นัดต่อ
  const [apptTime, setApptTime] = useState(() => {
    if (entry.appointmentTime) {
      if (entry.appointmentTime.includes(':')) return entry.appointmentTime
      return `${entry.appointmentTime}:00`
    }
    return '09:00'
  })
  
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

  const [apptType, setApptType] = useState(() => {
    if (entry.noAppointment) return 'none'
    if (!entry.appointmentDate) return 'none'
    if (/^\d{4}-\d{2}-\d{2}/.test(entry.appointmentDate)) return 'date'
    return 'text'
  })

  const [markNotReturned, setMarkNotReturned] = useState(false)

  const [isOcrLoading, setIsOcrLoading] = useState(false)

  const handleSave = () => {
    if (markNotReturned) {
      onSave({ 
        ...entry, 
        returned: false, 
        examResult: '', 
        treatment: '', 
        appointmentDate: '', 
        appointmentTime: '', 
        noAppointment: false 
      })
    } else {
      onSave({ 
        ...entry, 
        returned: true,
        examResult,
        treatment,
        appointmentDate: apptType === 'none' ? '' : appointmentDate,
        appointmentTime: apptType === 'none' ? '' : apptTime,
        noAppointment: apptType === 'none'
      })
    }
  }

  const [apptHour, apptMinute] = apptTime.split(':')

  const addMed = (med) => {
    const prefix = treatment ? treatment + '\n' : ''
    setTreatment(`${prefix}-${med} `)
  }

  const [ocrProgress, setOcrProgress] = useState(0)
  const [cropImageSrc, setCropImageSrc] = useState(null)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCropImageSrc(reader.result)
    reader.readAsDataURL(file)
    e.target.value = null
  }

  const handleOCR = async (croppedBlob) => {
    setCropImageSrc(null)
    setIsOcrLoading(true)
    setOcrProgress(0)
    try {
      const Tesseract = (await import('tesseract.js')).default
      const { data: { text } } = await Tesseract.recognize(
        croppedBlob,
        'tha+eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.floor(m.progress * 100))
            }
          }
        }
      )
      
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
      let meds = []
      let currentMed = ''
      
      for (let line of lines) {
        if (line.includes('โรงพยาบาล') || line.includes('พลฯ') || line.includes('จ.ส.อ.') || line.includes('จ.ส.ท.') || line.includes('จ.ส.ต.') || line.includes('ส.อ.') || line.includes('ส.ท.') || line.includes('ส.ต.')) continue
        
        let matchTabs = line.match(/^(\d+)\s*(TAB|เม็ด)/i) || line.match(/(\d+)\s*(TAB|เม็ด)$/i)
        if (matchTabs && currentMed) {
          meds.push(`-${currentMed.trim()} ${matchTabs[1]} ${matchTabs[2]}`)
          currentMed = ''
          continue
        }
        
        if (/^[a-zA-Z]/.test(line) && !line.includes('HN:')) {
          if (currentMed) currentMed += ' ' + line
          else currentMed = line
        }
      }
      
      const parsedText = meds.length > 0 ? meds.join('\n') : text
      const prefix = treatment ? treatment + '\n' : ''
      setTreatment(prefix + parsedText)
      
    } catch (err) {
      alert('สแกนไม่สำเร็จ: ' + err.message)
    } finally {
      setIsOcrLoading(false)
      setOcrProgress(0)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <div className="modal-header">
          <span style={{ fontSize: '1.2rem' }}>🏠</span>
          <h2 className="modal-title">บันทึกข้อมูลการรักษา (กลับจากส่งป่วย)</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          {/* Patient Info */}
          <div className="selected-patient" style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.4rem' }}>👤</span>
            <div className="selected-patient-info">
              <strong>{fullName}</strong>
              <span>{p.platoon} เลขที่ {p.number}</span>
            </div>
          </div>
          
          <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--gray-600)' }}>
            <strong>อาการตอนไป:</strong> {entry.symptoms || '-'}
          </div>

          {/* Toggle: กลับแล้ว / ยกเลิกสถานะกลับ */}
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
              }}
            >
              ⚠️ บันทึกข้อมูลแล้ว — สามารถแก้ไขข้อมูล หรือเลือก "ยกเลิกการกลับ"
            </div>
          )}

          {!markNotReturned && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">ผลการตรวจ</label>
                <textarea
                  className="form-control"
                  placeholder="เช่น ไม่มี ล้างแผลที่ก้น"
                  value={examResult}
                  onChange={e => setExamResult(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">การรักษา (เพิ่มยาอัตโนมัติ)</label>
                  <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer', color: 'var(--green-600)', padding: '0.2rem 0.5rem', background: '#dcfce7', borderRadius: 'var(--radius-full)' }}>
                    {isOcrLoading ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <div className="spinner" style={{ width: '12px', height: '12px', borderTopColor: 'var(--green-600)' }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{ocrProgress}%</span>
                      </div>
                    ) : <span>📷</span>}
                    {!isOcrLoading && <span style={{ fontSize: '0.75rem', marginLeft: '0.3rem', fontWeight: 600 }}>สแกนซองยา</span>}
                    <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileSelect} disabled={isOcrLoading} />
                  </label>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.6rem', marginTop: '0.5rem' }}>
                  {COMMON_MEDS.map(med => (
                    <button
                      key={med}
                      type="button"
                      style={{
                        padding: '0.2rem 0.5rem',
                        fontSize: '0.75rem',
                        background: 'var(--green-50)',
                        border: '1px solid var(--green-200)',
                        borderRadius: 'var(--radius-full)',
                        color: 'var(--green-700)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                      onClick={() => addMed(med)}
                    >
                      + {med}
                    </button>
                  ))}
                </div>
                <textarea
                  className="form-control"
                  placeholder="เช่น -Special Mouth Wash 1 ขวด&#10;-Bromhexine 8 mg 20 เม็ด"
                  value={treatment}
                  onChange={e => setTreatment(e.target.value)}
                  rows={3}
                />
              </div>

              {/* นัดหมาย */}
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
                      ระบุวันที่
                    </label>
                    <label className="checkbox-label" style={{ padding: 0 }}>
                      <input
                        type="radio"
                        checked={apptType === 'text'}
                        onChange={() => setApptType('text')}
                        style={{ borderRadius: '50%' }}
                      />
                      ระบุเป็นข้อความ
                    </label>
                    <label className="checkbox-label" style={{ padding: 0 }}>
                      <input
                        type="radio"
                        checked={apptType === 'none'}
                        onChange={() => setApptType('none')}
                        style={{ borderRadius: '50%' }}
                      />
                      ไม่มีนัด
                    </label>
                  </div>
                </div>

                {apptType !== 'none' && (
                  <div className="appt-row">
                    <div>
                      <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                        {apptType === 'date' ? 'วันที่นัด' : 'ข้อความนัด (เช่น นัดทำแผลทุกวัน)'}
                      </label>
                      {apptType === 'date' ? (
                        <input
                          type="date"
                          className="form-control"
                          value={appointmentDate}
                          onChange={e => setAppointmentDate(e.target.value)}
                        />
                      ) : (
                        <input
                          type="text"
                          className="form-control"
                          placeholder="เช่น นัดล้างแผล"
                          value={appointmentDate}
                          onChange={e => setAppointmentDate(e.target.value)}
                        />
                      )}
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>เวลานัด (ถ้ามี)</label>
                      <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
                        <select
                          className="form-control"
                          style={{ padding: '0.5rem', textAlign: 'center' }}
                          value={apptHour || '09'}
                          onChange={e => setApptTime(`${e.target.value}:${apptMinute || '00'}`)}
                        >
                          <option value="">--</option>
                          {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        <span>:</span>
                        <select
                          className="form-control"
                          style={{ padding: '0.5rem', textAlign: 'center' }}
                          value={apptMinute || '00'}
                          onChange={e => setApptTime(`${apptHour || '09'}:${e.target.value}`)}
                        >
                          {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ยกเลิกการกลับ */}
          {entry.returned && (
            <label className="checkbox-label" style={{ marginTop: '1rem' }}>
              <input
                type="checkbox"
                checked={markNotReturned}
                onChange={e => setMarkNotReturned(e.target.checked)}
              />
              ยกเลิกการกลับ (เคลียร์ข้อมูลการรักษา)
            </label>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>
              ยกเลิก
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              style={{ flex: 2 }}
            >
              {markNotReturned
                ? <><XCircle size={16} /> ยกเลิกการกลับ</>
                : <><CheckCircle size={16} /> บันทึกข้อมูลกลับ</>
              }
            </button>
          </div>
        </div>
      </div>
      {cropImageSrc && (
        <ImageCropperModal
          imageSrc={cropImageSrc}
          onCropComplete={handleOCR}
          onCancel={() => setCropImageSrc(null)}
        />
      )}
    </div>
  )
}
