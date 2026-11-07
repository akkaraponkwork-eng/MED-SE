'use client'

import { X, FileText, Calendar, PenLine, Clock } from 'lucide-react'

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

function thaiDate(dateStr) {
  if (!dateStr) return ''
  if (/^\d{4}-\d{2}-\d{2}/.test(String(dateStr))) {
    const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number)
    if (m >= 1 && m <= 12) return `${d} ${THAI_MONTHS[m - 1]} ${(y + 543).toString().slice(-2)}`
  }
  return String(dateStr)
}

function safeApptDate(dateVal) {
  if (!dateVal) return ''
  if (/^\d{4}-\d{2}-\d{2}/.test(String(dateVal))) return thaiDate(dateVal)
  return String(dateVal).startsWith('นัด') ? dateVal : `นัด${dateVal}`
}

export default function PatientDetailsModal({ entry, onClose }) {
  if (!entry) return null
  const p = entry.patient || {}

  return (
    <div className="modal-overlay center" onClick={onClose} style={{ zIndex: 300 }}>
      <div className="modal" style={{ maxHeight: '80vh', borderRadius: 'var(--radius-xl)' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <FileText size={20} style={{ color: 'var(--green-600)' }} />
          <h2 className="modal-title">รายละเอียดข้อมูลผู้ป่วย</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--gray-100)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: '1.1rem', color: 'var(--gray-900)' }}>
                {p.rank || 'พลฯ'} {p.firstName || ''} {p.lastName || ''}
              </strong>
              {p.code && (
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--green-700)', background: 'var(--green-50)', border: '1px solid var(--green-200)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                  {p.code}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '0.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span>{p.platoon && String(p.platoon).startsWith('หมวด') ? p.platoon : `หมวด ${p.platoon || '1'}`} เลขที่ {p.number || '-'}</span>
              {p.unit && <span style={{ color: 'var(--gray-400)' }}>• {p.unit}</span>}
            </div>
            {p.disease && p.disease !== '-' && (
              <div style={{ marginTop: '0.5rem', padding: '0.35rem 0.65rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '0.82rem', fontWeight: 600 }}>
                โรคประจำตัว: {p.disease}
              </div>
            )}
            {p.citizenId && (
              <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)', marginTop: '0.35rem' }}>
                เลขบัตร ปชช.: {p.citizenId}
              </div>
            )}
          </div>

          <div className="patient-detail" style={{ fontSize: '0.95rem' }}>
            {entry.symptoms && (
              <div className="patient-detail-row">
                <span className="patient-detail-label">อาการ:</span>
                <span>{entry.symptoms}</span>
              </div>
            )}
            {entry.examResult && (
              <div className="patient-detail-row">
                <span className="patient-detail-label">ผลการตรวจ:</span>
                <span>{entry.examResult}</span>
              </div>
            )}
            {entry.treatment && (
              <div className="patient-detail-row">
                <span className="patient-detail-label">การรักษา:</span>
                <span style={{ whiteSpace: 'pre-line' }}>{entry.treatment}</span>
              </div>
            )}
            {entry.notes && (
              <div className="patient-detail-row">
                <span className="patient-detail-label">หมายเหตุ:</span>
                <span>{entry.notes}</span>
              </div>
            )}
            {!entry.symptoms && !entry.examResult && !entry.treatment && !entry.notes && (
              <div style={{ color: 'var(--gray-400)', fontStyle: 'italic', padding: '1rem 0', textAlign: 'center' }}>
                ยังไม่มีข้อมูลรายละเอียด
              </div>
            )}
          </div>

          {entry.noAppointment ? (
            <div className="no-appt" style={{ marginTop: '1.5rem' }}>ไม่มีนัดต่อ</div>
          ) : (entry.appointmentDate || entry.patient?.appointmentText || entry.appointmentText) ? (
            <div className="patient-appt" style={{ marginTop: '1.5rem' }}>
              {entry.appointmentDate && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={14} />
                  <span>นัดต่อ {safeApptDate(entry.appointmentDate)}{entry.appointmentTime ? ` เวลา ${entry.appointmentTime} น.` : ''}</span>
                </div>
              )}
              {(p.appointmentText || entry.appointmentText) && (
                <div style={{ marginTop: '0.25rem', color: 'var(--gray-600)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <PenLine size={14} />
                  <span>{p.appointmentText || entry.appointmentText} {p.isEveryday && '(ต่อเนื่องทุกวัน)'}</span>
                </div>
              )}
              {(!entry.appointmentDate && entry.appointmentTime) && (
                <div style={{ marginTop: '0.25rem', color: 'var(--gray-600)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={14} />
                  <span>เวลา {entry.appointmentTime} น.</span>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
