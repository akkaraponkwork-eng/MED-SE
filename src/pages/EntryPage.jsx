import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Trash2, X } from 'lucide-react'
import { useRecords } from '../hooks/useRecords'
import PatientForm from '../components/PatientForm'
import DailyReport from '../components/DailyReport'
import ReturnForm from '../components/ReturnForm'
import ReturnReport from '../components/ReturnReport'

const THAI_MONTHS_FULL = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

function thaiDateFull(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  const dateObj = new Date(dateStr)
  const weekdays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
  return `วัน${weekdays[dateObj.getDay()]}ที่ ${d} ${THAI_MONTHS_FULL[m - 1]} ${y + 543}`
}

// แปลง appointmentDate เป็นวันที่ภาษาไทย
function safeApptDate(val) {
  if (!val) return ''
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
    const [y, m, d] = val.slice(0, 10).split('-').map(Number)
    if (!isNaN(y) && m >= 1 && m <= 12) return `${d} ${THAI_MONTHS_SHORT[m - 1]} ${y + 543}`
  }
  const dt = new Date(val)
  if (!isNaN(dt.getTime())) {
    const y = dt.getFullYear()
    const m = dt.getMonth() + 1
    const d = dt.getDate()
    return `${d} ${THAI_MONTHS_SHORT[m - 1]} ${y + 543}`
  }
  return val
}

function Toast({ msg, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200)
    return () => clearTimeout(t)
  }, [onDone])
  return <div className="toast toast-green">✅ {msg}</div>
}

export default function EntryPage() {
  const { date } = useParams()
  const navigate = useNavigate()
  const { getByDate, add, update, remove, loading } = useRecords()

  const [showForm, setShowForm] = useState(false)
  const [editEntry, setEditEntry] = useState(null)
  const [showReturnForm, setShowReturnForm] = useState(false)
  const [returnEntry, setReturnEntry] = useState(null)
  const [toast, setToast] = useState('')
  const [activeTab, setActiveTab] = useState('list') // 'list' | 'report' | 'return'
  const [confirmDelete, setConfirmDelete] = useState(null)

  const entries = getByDate(date)

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [viewDetailsEntry, setViewDetailsEntry] = useState(null)

  useEffect(() => {
    setCurrentPage(1)
  }, [date, entries.length])

  const totalPages = Math.ceil(entries.length / itemsPerPage)
  const paginatedEntries = entries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleSave = (record) => {
    if (record.id) {
      update(record)
      setToast('อัปเดตข้อมูลเรียบร้อย')
    } else {
      add({ ...record, date })
      setToast('เพิ่มผู้ป่วยเรียบร้อย')
    }
    setShowForm(false)
    setEditEntry(null)
  }

  const handleEdit = (entry) => {
    setEditEntry(entry)
    setShowForm(true)
  }

  const handleDelete = (id) => {
    remove(id)
    setConfirmDelete(null)
    setToast('ลบข้อมูลเรียบร้อย')
  }

  const handleOpenReturn = (entry) => {
    setReturnEntry(entry)
    setShowReturnForm(true)
  }

  const handleSaveReturn = (record) => {
    update(record)
    
    let message = record.returned ? 'บันทึกกลับเรียบร้อย ✅' : 'ยกเลิกสถานะกลับแล้ว'

    // Auto-create appointment record
    if (record.returned && !record.noAppointment && record.appointmentDate) {
      if (/^\d{4}-\d{2}-\d{2}/.test(record.appointmentDate)) {
        const apptDate = record.appointmentDate.slice(0, 10)
        const existingEntries = getByDate(apptDate)
        const alreadyExists = existingEntries.some(e => 
          e.patient.firstName === record.patient.firstName && 
          e.patient.lastName === record.patient.lastName
        )
        
        if (!alreadyExists) {
          add({
            date: apptDate,
            patient: record.patient,
            destination: record.destination || 'ตร.ศบบ.',
            symptoms: `นัดตรวจ/ติดตามอาการ (อ้างอิงจาก ${date})`,
            appointmentTime: record.appointmentTime || ''
          })
          message = 'บันทึกกลับและลงนัดหมายล่วงหน้าเรียบร้อย ✅'
        }
      }
    }

    setShowReturnForm(false)
    setReturnEntry(null)
    setToast(message)
  }

  const isToday = date === new Date().toISOString().slice(0, 10)

  const returnedCount = entries.filter(e => e.returned).length
  const notReturnedCount = entries.length - returnedCount

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <button
          id="back-btn"
          className="btn btn-ghost btn-icon"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="page-title">
            {isToday ? '📋 ส่งป่วยวันนี้' : '📋 ส่งป่วย'}
          </div>
          <div className="page-subtitle">{thaiDateFull(date)}</div>
        </div>
        <button
          id="add-patient-btn"
          className="btn btn-primary btn-sm"
          onClick={() => { setEditEntry(null); setShowForm(true) }}
        >
          <Plus size={12} />
          เพิ่มผู้ป่วย
        </button>
      </div>

      {/* Entry Meta Banner */}
      <div className="entry-meta">
        <div className="entry-meta-icon">🏥</div>
        <div style={{ flex: 1 }}>
          <div className="entry-meta-date">ยอดส่งป่วย</div>
          <div className="entry-meta-sub">รายชื่อผู้ป่วย {entries.length} นาย</div>
        </div>
        {/* สรุปสถานะกลับ */}
        {entries.length > 0 && (
          <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
            <span style={{
              padding: '0.2rem 0.5rem',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}>เสร็จสิ้น {returnedCount}</span>
            {notReturnedCount > 0 && (
              <span style={{
                padding: '0.2rem 0.5rem',
                background: 'rgba(255, 161, 30, 0.9)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}>ดำเนินการ {notReturnedCount}</span>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      {entries.length > 0 && (
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            📋 รายชื่อ
          </button>
          <button
            className={`tab ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => setActiveTab('report')}
          >
            📄 ส่งป่วย
          </button>
          <button
            className={`tab ${activeTab === 'return' ? 'active' : ''}`}
            onClick={() => setActiveTab('return')}
            style={{ position: 'relative' }}
          >
            🏠 ส่งกลับ
            {notReturnedCount > 0 && (
              <span style={{
                position: 'absolute', top: '2px', right: '4px',
                width: '8px', height: '8px',
                background: '#f97316',
                borderRadius: '50%',
              }} />
            )}
          </button>
        </div>
      )}

      {/* Patient List Tab */}
      {(activeTab === 'list' || entries.length === 0) && (
        <div className="fade-in">
          {loading && entries.length === 0 ? (
            <div className="loading" style={{ padding: '3rem 0' }}>
              <div className="spinner" />
              <p style={{ marginTop: '0.5rem', color: 'var(--gray-500)' }}>กำลังโหลดข้อมูล...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏥</div>
              <h3>ยังไม่มีผู้ป่วยวันนี้</h3>
              <p>กดปุ่ม "เพิ่ม" เพื่อบันทึกรายชื่อผู้ป่วย</p>
              <button
                className="btn btn-primary"
                style={{ marginTop: '1rem' }}
                onClick={() => { setEditEntry(null); setShowForm(true) }}
              >
                <Plus size={16} /> เพิ่มผู้ป่วย
              </button>
            </div>
          ) : (
            <>
              <div className="patient-list">
                {paginatedEntries.map((entry, idx) => {
                  const p = entry.patient
                  const fullName = `${p.rank} ${p.firstName} ${p.lastName}`
                  const dest = entry.destination || 'ตร.ศบบ.'
                  const isHosp = dest === 'รพ. อปร.ฯ'
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx

                  return (
                    <div
                      key={entry.id}
                      className="patient-card slide-up"
                      id={`card-${entry.id}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setViewDetailsEntry(entry)}
                    >
                      <div className="patient-card-header">
                        <div className="patient-number">{globalIdx + 1}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <div
                              className="patient-name"
                              style={{ color: 'var(--gray-900)' }}
                            >
                              {fullName}
                            </div>
                            {/* Badge ประเภทส่งป่วย */}
                            <span style={{
                              fontSize: '0.72rem', fontWeight: 700,
                              padding: '0.15rem 0.5rem',
                              borderRadius: 'var(--radius-full)',
                              background: isHosp ? '#dbeafe' : 'var(--green-100)',
                              color: isHosp ? '#1d4ed8' : 'var(--green-700)',
                              whiteSpace: 'nowrap',
                            }}>
                              {isHosp ? 'รพ. อปร.ฯ' : 'ตร.ศบบ.'}
                            </span>
                            {/* Badge สถานะกลับ */}
                            {entry.returned ? (
                              <span style={{
                                fontSize: '0.72rem', fontWeight: 700,
                                padding: '0.15rem 0.5rem',
                                borderRadius: 'var(--radius-full)',
                                background: '#dcfce7',
                                color: '#15803d',
                                whiteSpace: 'nowrap',
                              }}>
                                เสร็จสิ้น {entry.returnTime && `${entry.returnTime} น.`}
                              </span>
                            ) : (
                              <span style={{
                                fontSize: '0.72rem', fontWeight: 700,
                                padding: '0.15rem 0.5rem',
                                borderRadius: 'var(--radius-full)',
                                background: '#fff7ed',
                                color: '#c2410c',
                                whiteSpace: 'nowrap',
                              }}>
                                ยังไม่กลับ
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="patient-actions">
                          {/* ปุ่มบันทึกกลับ */}
                          <button
                            className={`btn btn-icon btn-sm ${entry.returned ? 'btn-ghost' : 'btn-return'}`}
                            onClick={(e) => { e.stopPropagation(); handleOpenReturn(entry) }}
                            title={entry.returned ? 'แก้ไขการกลับ' : 'บันทึกกลับ'}
                            id={`return-${entry.id}`}
                          >
                            🏠
                          </button>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={(e) => { e.stopPropagation(); handleEdit(entry) }}
                            title="แก้ไข"
                            id={`edit-${entry.id}`}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="btn btn-danger btn-icon btn-sm"
                            onClick={(e) => { e.stopPropagation(); setConfirmDelete(entry.id) }}
                            title="ลบ"
                            id={`delete-${entry.id}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', marginBottom: '2rem' }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                  >
                    ◀ ก่อนหน้า
                  </button>
                  <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)', fontWeight: 600 }}>
                    หน้า {currentPage} จาก {totalPages}
                  </span>
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
                  >
                    ถัดไป ▶
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Report Tab — รายงานส่งป่วย */}
      {activeTab === 'report' && entries.length > 0 && (
        <div className="fade-in">
          <DailyReport date={date} entries={entries} />
        </div>
      )}

      {/* Return Tab — รายงานกลับ */}
      {activeTab === 'return' && entries.length > 0 && (
        <div className="fade-in">
          <ReturnReport date={date} entries={entries} />
        </div>
      )}

      {/* FAB */}
      <button
        id="fab-add-btn"
        className="fab"
        onClick={() => { setEditEntry(null); setShowForm(true) }}
        title="เพิ่มผู้ป่วย"
      >
        +
      </button>

      {/* Patient Form Modal */}
      {showForm && (
        <PatientForm
          date={date}
          editData={editEntry}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditEntry(null) }}
        />
      )}

      {/* Return Form Modal */}
      {showReturnForm && returnEntry && (
        <ReturnForm
          entry={returnEntry}
          onSave={handleSaveReturn}
          onClose={() => { setShowReturnForm(false); setReturnEntry(null) }}
        />
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" style={{ maxHeight: 'auto', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0' }}>
            <div className="modal-body" style={{ padding: '2rem 1.5rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                {/* <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🗑️</div> */}
                <h3 style={{ marginBottom: '0.5rem' }}>ลบรายการนี้?</h3>
                <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>การกระทำนี้ไม่สามารถยกเลิกได้</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>
                  ยกเลิก
                </button>
                <button
                  className="btn btn-danger"
                  style={{ flex: 1, background: '#dc2626', color: 'white' }}
                  onClick={() => handleDelete(confirmDelete)}
                  id="confirm-delete-btn"
                >
                  ตกลง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Patient Details Modal */}
      {viewDetailsEntry && (
        <div className="modal-overlay" onClick={() => setViewDetailsEntry(null)}>
          <div className="modal" style={{ maxHeight: '80vh', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span style={{ fontSize: '1.2rem' }}>📄</span>
              <h2 className="modal-title">รายละเอียดข้อมูลผู้ป่วย</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setViewDetailsEntry(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--gray-100)' }}>
                <strong style={{ fontSize: '1.1rem', color: 'var(--gray-900)' }}>
                  {viewDetailsEntry.patient.rank} {viewDetailsEntry.patient.firstName} {viewDetailsEntry.patient.lastName}
                </strong>
                <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                  {viewDetailsEntry.patient.platoon} เลขที่ {viewDetailsEntry.patient.number}
                </div>
              </div>

              <div className="patient-detail" style={{ fontSize: '0.95rem' }}>
                {viewDetailsEntry.symptoms && (
                  <div className="patient-detail-row">
                    <span className="patient-detail-label">อาการ:</span>
                    <span>{viewDetailsEntry.symptoms}</span>
                  </div>
                )}
                {viewDetailsEntry.examResult && (
                  <div className="patient-detail-row">
                    <span className="patient-detail-label">ผลการตรวจ:</span>
                    <span>{viewDetailsEntry.examResult}</span>
                  </div>
                )}
                {viewDetailsEntry.treatment && (
                  <div className="patient-detail-row">
                    <span className="patient-detail-label">การรักษา:</span>
                    <span style={{ whiteSpace: 'pre-line' }}>{viewDetailsEntry.treatment}</span>
                  </div>
                )}
                {viewDetailsEntry.notes && (
                  <div className="patient-detail-row">
                    <span className="patient-detail-label">หมายเหตุ:</span>
                    <span>{viewDetailsEntry.notes}</span>
                  </div>
                )}
                {!viewDetailsEntry.symptoms && !viewDetailsEntry.examResult && !viewDetailsEntry.treatment && !viewDetailsEntry.notes && (
                  <div style={{ color: 'var(--gray-400)', fontStyle: 'italic', padding: '1rem 0', textAlign: 'center' }}>
                    ยังไม่มีข้อมูลรายละเอียด
                  </div>
                )}
              </div>

              {viewDetailsEntry.noAppointment ? (
                <div className="no-appt" style={{ marginTop: '1.5rem' }}>ไม่มีนัดต่อ</div>
              ) : viewDetailsEntry.appointmentDate ? (
                <div className="patient-appt" style={{ marginTop: '1.5rem' }}>
                  📅 นัดต่อ {safeApptDate(viewDetailsEntry.appointmentDate)}{viewDetailsEntry.appointmentTime && ` เวลา ${viewDetailsEntry.appointmentTime} น.`}
                </div>
              ) : null}

              {/* {viewDetailsEntry.returned && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  background: '#f0fdf4',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: '4px solid var(--green-500)',
                  fontSize: '0.875rem',
                  color: 'var(--green-800)',
                }}>
                  <strong>🏠 กลับหน่วยแล้ว</strong><br />
                  เวลา: {viewDetailsEntry.returnTime} น.
                  {viewDetailsEntry.returnNotes && <div style={{ marginTop: '0.25rem', color: 'var(--gray-600)' }}>{viewDetailsEntry.returnNotes}</div>}
                </div>
              )} */}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
    </>
  )
}
