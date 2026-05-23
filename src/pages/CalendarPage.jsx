import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { useRecords } from '../hooks/useRecords'

const THAI_MONTHS_FULL = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']
const DAYS_TH = ['อา','จ','อ','พ','พฤ','ศ','ส']

function toDateStr(y, m, d) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}

export default function CalendarPage() {
  const navigate = useNavigate()
  const { records } = useRecords()
  const today = new Date()

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate()

  const cells = []
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, type: 'prev' })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, type: 'current' })
  }
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, type: 'next' })
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const handleDayClick = (cell) => {
    if (cell.type !== 'current') return
    navigate(`/entry/${toDateStr(viewYear, viewMonth, cell.day)}`)
  }

  return (
    <div className="card fade-in">
      <div className="card-header">
        <CalendarIcon size={18} style={{ color: 'var(--green-600)' }} />
        <span className="card-title">ปฏิทินส่งป่วย</span>
      </div>
      <div className="card-body">
        <div className="calendar-nav">
          <button className="btn btn-ghost btn-icon" onClick={prevMonth}>
            <ChevronLeft size={18} />
          </button>
          <span className="calendar-month-title">
            {THAI_MONTHS_FULL[viewMonth]} {viewYear + 543}
          </span>
          <button className="btn btn-ghost btn-icon" onClick={nextMonth}>
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="calendar-grid" style={{ gap: '0.4rem' }}>
          {DAYS_TH.map(d => (
            <div key={d} className="calendar-day-header">{d}</div>
          ))}
          {cells.map((cell, i) => {
            const isToday = cell.type === 'current' &&
              cell.day === today.getDate() &&
              viewMonth === today.getMonth() &&
              viewYear === today.getFullYear()
            const dateStr = cell.type === 'current' ? toDateStr(viewYear, viewMonth, cell.day) : ''
            const dayRecs = dateStr ? records.filter(r => r.date === dateStr) : []
            
            const trrCount = dayRecs.filter(r => (r.destination || 'ตร.ศบบ.') === 'ตร.ศบบ.').length
            const hospCount = dayRecs.filter(r => r.destination === 'รพ. อปร.ฯ').length

            return (
              <div
                key={i}
                className={[
                  'calendar-day',
                  cell.type !== 'current' ? 'other-month' : '',
                  isToday ? 'today' : '',
                ].join(' ')}
                onClick={() => handleDayClick(cell)}
                style={{ 
                  aspectRatio: 'auto',
                  minHeight: '75px', 
                  padding: '0.3rem', 
                  justifyContent: 'flex-start',
                  borderColor: dayRecs.length > 0 ? 'var(--green-200)' : 'transparent',
                  background: dayRecs.length > 0 && !isToday ? 'var(--green-50)' : ''
                }}
              >
                <div style={{
                  fontWeight: 700, 
                  marginBottom: 'auto', 
                  fontSize: '0.9rem',
                  background: isToday ? 'var(--green-600)' : 'transparent',
                  color: isToday ? 'white' : 'inherit',
                  width: '24px', height: '24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%'
                }}>
                  {cell.day}
                </div>
                
                {dayRecs.length > 0 && cell.type === 'current' && (
                  <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '3px', fontSize: '0.65rem' }}>
                    {trrCount > 0 && (
                      <div style={{ background: '#dbeafe', color: '#1e3a8a', padding: '2px 0', borderRadius: '4px', textAlign: 'center', fontWeight: 600 }}>
                        ตร. {trrCount}
                      </div>
                    )}
                    {hospCount > 0 && (
                      <div style={{ background: '#ede9fe', color: '#4c1d95', padding: '2px 0', borderRadius: '4px', textAlign: 'center', fontWeight: 600 }}>
                        รพ. {hospCount}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
