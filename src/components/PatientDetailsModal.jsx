import { X } from 'lucide-react'

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

  return (
    <div className="modal-overlay center" onClick={onClose} style={{ zIndex: 300 }}>
      <div className="modal" style={{ maxHeight: '80vh', borderRadius: 'var(--radius-xl)' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span style={{ fontSize: '1.2rem' }}>📄</span>
          <h2 className="modal-title">รายละเอียดข้อมูลผู้ป่วย</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--gray-100)' }}>
            <strong style={{ fontSize: '1.1rem', color: 'var(--gray-900)' }}>
              {entry.patient?.rank} {entry.patient?.firstName} {entry.patient?.lastName}
            </strong>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
              {entry.patient?.platoon && String(entry.patient.platoon).startsWith('หมวด') ? entry.patient.platoon : `หมวด ${entry.patient?.platoon}`} เลขที่ {entry.patient?.number}
            </div>
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
              {entry.appointmentDate && `📅 นัดต่อ ${safeApptDate(entry.appointmentDate)}${entry.appointmentTime ? ` เวลา ${entry.appointmentTime} น.` : ''}`}
              {entry.patient?.appointmentText && <div style={{marginTop: '0.25rem', color: 'var(--gray-600)', fontSize: '0.9rem'}}>📝 {entry.patient.appointmentText} {entry.patient.isEveryday && '(ต่อเนื่องทุกวัน)'}</div>}
              {(!entry.appointmentDate && entry.appointmentTime) && <div style={{marginTop: '0.25rem', color: 'var(--gray-600)', fontSize: '0.9rem'}}>⏰ เวลา {entry.appointmentTime} น.</div>}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
