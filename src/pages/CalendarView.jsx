import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Plus, PieChart, X } from 'lucide-react'
import { useRecords } from '../hooks/useRecords'
import PatientDetailsModal from '../components/PatientDetailsModal'

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const THAI_MONTHS_FULL = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']

function toDateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function thaiDateLabel(dateStr) {
  if (!dateStr) return ''
  const parts = dateStr.split('-').map(Number)
  if (parts.length < 3 || parts.some(isNaN)) return dateStr
  const [y, m, d] = parts
  return `${d} ${THAI_MONTHS[m - 1] ?? ''} ${(y + 543).toString().slice(-2)}`
}

export default function CalendarView() {
  const navigate = useNavigate()
  const { records, getDatesWithRecords, loading } = useRecords()
  const today = new Date()
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate())

  const [showDestModal, setShowDestModal] = useState(null)
  const [showStatusModal, setShowStatusModal] = useState(null)
  const [viewDetailsEntry, setViewDetailsEntry] = useState(null)

  const datesWithData = new Set(getDatesWithRecords())

  // ดึงรายการล่าสุด
  const recentDates = [...datesWithData]
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 7)

  // สถิติวันนี้
  const todayRecords = records.filter(r => r.date === todayStr)
  const todayTotal = todayRecords.length

  const todayTrrRecords = todayRecords.filter(r => (r.destination || 'ตร.ศบบ.') === 'ตร.ศบบ.')
  const todayHospRecords = todayRecords.filter(r => r.destination === 'รพ. อปร.ฯ')

  const todayTrr = todayTrrRecords.length
  const todayHosp = todayHospRecords.length

  const todayReturned = todayRecords.filter(r => r.returned).length
  const todayNotReturned = todayTotal - todayReturned

  const trrPercent = todayTotal === 0 ? 0 : Math.round((todayTrr / todayTotal) * 100)
  const hospPercent = todayTotal === 0 ? 0 : Math.round((todayHosp / todayTotal) * 100)

  return (
    <>
      {/* Stats Row 1: แยกประเภทส่งป่วย */}
      <div className="stats-grid stats-3" style={{ marginBottom: '0.6rem' }}>
        <div className="stat-card">
          <div className="stat-number">{todayTotal}</div>
          <div className="stat-label">ส่งป่วยวันนี้</div>
        </div>
        <div 
          className="stat-card" 
          style={{ cursor: 'pointer', transition: 'all 0.2s' }} 
          onClick={() => todayTrr > 0 && setShowDestModal('ตร.ศบบ.')}
        >
          <div className="stat-number" style={{ color: '#2563eb' }}>{todayTrr}</div>
          <div className="stat-label">🏠 ตร.ศบบ.</div>
        </div>
        <div 
          className="stat-card" 
          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
          onClick={() => todayHosp > 0 && setShowDestModal('รพ. อปร.ฯ')}
        >
          <div className="stat-number" style={{ color: '#7c3aed' }}>{todayHosp}</div>
          <div className="stat-label">🏥 รพ. อปร.ฯ</div>
        </div>
      </div>

      {/* Stats Row 2: สถานะกลับ */}
      <div className="stats-grid stats-2" style={{ marginBottom: '1.25rem' }}>
        <div 
          className="stat-card stat-card-green"
          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
          onClick={() => todayReturned > 0 && setShowStatusModal('returned')}
        >
          <div className="stat-number" style={{ color: 'var(--green-600)' }}>{todayReturned}</div>
          <div className="stat-label">กลับแล้ว</div>
        </div>
        <div 
          className="stat-card" 
          style={{
            borderColor: todayNotReturned > 0 ? '#fed7aa' : 'var(--gray-100)',
            background: todayNotReturned > 0 ? '#fff7ed' : 'white',
            cursor: 'pointer', 
            transition: 'all 0.2s'
          }}
          onClick={() => todayNotReturned > 0 && setShowStatusModal('notReturned')}
        >
          <div className="stat-number" style={{ color: todayNotReturned > 0 ? '#c2410c' : 'var(--gray-400)' }}>
            {todayNotReturned}
          </div>
          <div className="stat-label" style={{ color: todayNotReturned > 0 ? '#c2410c' : 'var(--gray-400)' }}>
            ยังไม่กลับ
          </div>
        </div>
      </div>

      {/* Today Button */}
      <button
        id="goto-today-btn"
        className="btn btn-primary btn-full"
        onClick={() => navigate(`/entry/${todayStr}`)}
        style={{ marginBottom: '1.25rem' }}
      >
        <Plus size={18} />
        ส่งป่วย / บันทึกกลับ วันนี้
      </button>

      {/* Dashboard Donut Chart & Today's List */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-header">
          <PieChart size={18} style={{ color: 'var(--green-600)' }} />
          <span className="card-title">สรุปข้อมูลส่งป่วยวันนี้</span>
        </div>
        <div className="card-body">
          {/* Donut Chart */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', marginTop: '0.5rem' }}>
            <div style={{
              width: '160px', height: '160px', borderRadius: '50%',
              background: todayTotal === 0
                ? 'var(--gray-200)'
                : `conic-gradient(#3b82f6 0% ${trrPercent}%, #8b5cf6 ${trrPercent}% 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                width: '110px', height: '110px', background: 'white', borderRadius: '50%',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--gray-800)', lineHeight: 1.1 }}>{todayTotal}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)', fontWeight: 600 }}>ยอดรวม (นาย)</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6' }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--gray-700)', fontWeight: 600 }}>ตร.ศบบ. ({trrPercent}%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#8b5cf6' }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--gray-700)', fontWeight: 600 }}>รพ. อปร.ฯ ({hospPercent}%)</span>
            </div>
          </div>

          {/* List of Patients Today */}
          {loading && todayTotal === 0 ? (
            <div className="loading" style={{ padding: '2rem 0' }}>
              <div className="spinner" />
              <p style={{ marginTop: '0.5rem', color: 'var(--gray-500)', fontSize: '0.9rem' }}>กำลังโหลดข้อมูล...</p>
            </div>
          ) : todayTotal === 0 ? (
            <div className="empty-state" style={{ padding: '1rem 0 0.5rem' }}>
              <p>ยังไม่มีรายการส่งป่วยในวันนี้</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {todayTrr > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: '#1d4ed8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    🏠 ตร.ศบบ. ({todayTrr} นาย)
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {todayTrrRecords.map((r, i) => (
                      <li key={r.id} style={{ background: '#eff6ff', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: '#1e3a8a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{i + 1}. {r.patient?.rank}{r.patient?.firstName} {r.patient?.lastName}</span>
                        {r.returned ? (
                          <span style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: 600, background: '#dcfce7', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>กลับแล้ว</span>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: '#c2410c', fontWeight: 600, background: '#ffedd5', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>กำลังดำเนินการ</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {todayHosp > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: '#6d28d9', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    🏥 รพ. อปร.ฯ ({todayHosp} นาย)
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {todayHospRecords.map((r, i) => (
                      <li key={r.id} style={{ background: '#f5f3ff', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: '#4c1d95', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{i + 1}. {r.patient?.rank}{r.patient?.firstName} {r.patient?.lastName}</span>
                        {r.returned ? (
                          <span style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: 600, background: '#dcfce7', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>กลับแล้ว</span>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: '#c2410c', fontWeight: 600, background: '#ffedd5', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>กำลังดำเนินการ</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent Records */}
      <div className="card">
        <div className="card-header">
          <span style={{ fontSize: '1.1rem' }}>📋</span>
          <span className="card-title">บันทึกล่าสุด</span>
        </div>
        <div className="card-body" style={{ padding: '0.5rem 0.75rem' }}>
          {loading && recentDates.length === 0 ? (
            <div className="loading" style={{ padding: '2rem' }}>
              <div className="spinner" />
            </div>
          ) : recentDates.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <div className="empty-state-icon">📭</div>
              <h3>ยังไม่มีบันทึก</h3>
              <p>กดปุ่ม "ส่งป่วย / บันทึกกลับ วันนี้" เพื่อเริ่มต้น</p>
            </div>
          ) : (
            <ul className="recent-list">
              {recentDates.map(dateStr => {
                const dayRecords = records.filter(r => r.date === dateStr)
                const parts = (dateStr || '').split('-').map(Number)
                const [y, m, d] = parts.length === 3 && !parts.some(isNaN) ? parts : [0, 0, 0]
                const returnedCount = dayRecords.filter(r => r.returned).length
                const notReturnedCount = dayRecords.length - returnedCount
                return (
                  <li
                    key={dateStr}
                    className="recent-item"
                    onClick={() => navigate(`/entry/${dateStr}`)}
                    id={`recent-${dateStr}`}
                  >
                    <div className="recent-date-badge">
                      <span>{d || '?'}</span>
                      <small>{THAI_MONTHS[m - 1] ?? ''}</small>
                    </div>
                    <div className="recent-info">
                      <strong>วันที่ {thaiDateLabel(dateStr)}</strong>
                      <span>ส่งป่วย {dayRecords.length} ราย</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                      {returnedCount > 0 && (
                        <span className="badge badge-green">กลับแล้ว {returnedCount}</span>
                      )}
                      {notReturnedCount > 0 && (
                        <span className="badge badge-orange">ดำเนินการ {notReturnedCount}</span>
                      )}
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--gray-300)' }} />
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Dest Modal */}
      {showDestModal && (
        <div className="modal-overlay center" onClick={() => setShowDestModal(null)}>
          <div className="modal" style={{ maxHeight: '80vh' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span style={{ fontSize: '1.2rem' }}>{showDestModal === 'ตร.ศบบ.' ? '🏠' : '🏥'}</span>
              <h2 className="modal-title">รายชื่อผู้ป่วยไป {showDestModal}</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowDestModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(showDestModal === 'ตร.ศบบ.' ? todayTrrRecords : todayHospRecords).map((r, i) => (
                  <li key={r.id} onClick={() => setViewDetailsEntry(r)} style={{ 
                    background: showDestModal === 'ตร.ศบบ.' ? '#eff6ff' : '#f5f3ff', 
                    padding: '0.75rem', 
                    borderRadius: 'var(--radius-sm)', 
                    display: 'flex', flexDirection: 'column', gap: '0.2rem',
                    border: `1px solid ${showDestModal === 'ตร.ศบบ.' ? '#bfdbfe' : '#ddd6fe'}`,
                    cursor: 'pointer'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.95rem', color: showDestModal === 'ตร.ศบบ.' ? '#1e3a8a' : '#4c1d95' }}>
                        {i + 1}. {r.patient?.rank}{r.patient?.firstName} {r.patient?.lastName}
                      </strong>
                      {r.returned ? (
                        <span style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: 600, background: '#dcfce7', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>กลับแล้ว</span>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: '#c2410c', fontWeight: 600, background: '#ffedd5', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>กำลังดำเนินการ</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                      <span style={{ background: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid var(--gray-200)' }}>
                        หมวด: {r.patient?.platoon || '-'}
                      </span>
                      <span style={{ background: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid var(--gray-200)' }}>
                        เลขที่: {r.patient?.number || '-'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <div className="modal-overlay center" onClick={() => setShowStatusModal(null)}>
          <div className="modal" style={{ maxHeight: '80vh' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span style={{ fontSize: '1.2rem' }}>{showStatusModal === 'returned' ? '✅' : '⏳'}</span>
              <h2 className="modal-title">รายชื่อผู้ป่วย ({showStatusModal === 'returned' ? 'กลับแล้ว' : 'ยังไม่กลับ'})</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowStatusModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {todayRecords.filter(r => showStatusModal === 'returned' ? r.returned : !r.returned).map((r, i) => (
                  <li key={r.id} onClick={() => setViewDetailsEntry(r)} style={{ 
                    background: showStatusModal === 'returned' ? '#f0fdf4' : '#fff7ed', 
                    padding: '0.75rem', 
                    borderRadius: 'var(--radius-sm)', 
                    display: 'flex', flexDirection: 'column', gap: '0.2rem',
                    border: `1px solid ${showStatusModal === 'returned' ? '#bbf7d0' : '#fed7aa'}`,
                    cursor: 'pointer'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.95rem', color: showStatusModal === 'returned' ? '#166534' : '#9a3412' }}>
                        {i + 1}. {r.patient?.rank}{r.patient?.firstName} {r.patient?.lastName}
                      </strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--gray-600)', background: 'white', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid var(--gray-200)' }}>
                        {r.destination || 'ตร.ศบบ.'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                      <span style={{ background: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid var(--gray-200)' }}>
                        หมวด: {r.patient?.platoon || '-'}
                      </span>
                      <span style={{ background: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid var(--gray-200)' }}>
                        เลขที่: {r.patient?.number || '-'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Patient Details Modal */}
      <PatientDetailsModal
        entry={viewDetailsEntry}
        onClose={() => setViewDetailsEntry(null)}
      />
    </>
  )
}
