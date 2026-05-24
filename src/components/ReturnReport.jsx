import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

function thaiDate(dateStr) {
  if (!dateStr) return ''
  if (/^\d{4}-\d{2}-\d{2}/.test(String(dateStr))) {
    const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number)
    if (m >= 1 && m <= 12) return `${d} ${THAI_MONTHS[m - 1]} ${(y + 543).toString().slice(-2)}`
  }
  const dt = new Date(dateStr)
  if (!isNaN(dt.getTime())) {
    return `${dt.getDate()} ${THAI_MONTHS[dt.getMonth()]} ${(dt.getFullYear() + 543).toString().slice(-2)}`
  }
  return String(dateStr)
}

function formatApptTime(timeStr) {
  if (!timeStr) return ''
  const s = String(timeStr).trim()
  if (/^\d{2}:\d{2}/.test(s)) return s.slice(0, 5)
  return s
}

function buildReturnText(date, entries) {
  const lines = []
  lines.push(`ส่งป่วยประจำวันที่ ${thaiDate(date)}`)

  const groups = {}
  entries.forEach(entry => {
    const dest = entry.destination || 'ตร.ศบบ.'
    if (!groups[dest]) groups[dest] = []
    groups[dest].push(entry)
  })

  const destOrder = ['ตร.ศบบ.', 'รพ. อปร.ฯ']
  const destKeys = destOrder.filter(d => groups[d])

  destKeys.forEach((dest, groupIdx) => {
    const icon = dest === 'ตร.ศบบ.' ? '🏠' : '🏥'
    lines.push(`${icon} ส่งป่วย ${dest}`)

    groups[dest].forEach((entry, idx) => {
      const p = entry.patient
      const name = `${p.rank} ${p.firstName} ${p.lastName}`
      const platoonPart = p.platoon ? ` หมวด ${p.platoon}` : ''
      const numPart = p.number ? ` เลขที่ ${p.number}` : ''
      const meta = platoonPart || numPart ? ` ${platoonPart}${numPart}` : ''

      lines.push(`${idx + 1}.${name}${meta}`)

      if (entry.symptoms) {
        lines.push(`อาการ: ${entry.symptoms}`)
      }
      if (entry.examResult) {
        lines.push(`ผลการตรวจ: ${entry.examResult}`)
      }
      if (entry.treatment) {
        lines.push(`การรักษา: ${entry.treatment}`)
      }

      if (entry.noAppointment) {
        lines.push(`ไม่มีนัด`)
      } else if (entry.appointmentDate) {
        let apptText = ''
        if (/^\d{4}-\d{2}-\d{2}/.test(String(entry.appointmentDate))) {
          apptText = `นัด${thaiDate(entry.appointmentDate)}`
        } else {
          apptText = String(entry.appointmentDate).startsWith('นัด')
            ? entry.appointmentDate
            : `นัด${entry.appointmentDate}`
        }
        const apptTime = entry.appointmentTime ? ` เวลา ${formatApptTime(entry.appointmentTime)}` : ''
        lines.push(`${apptText}${apptTime}`)
      }

      if (entry.notes && !entry.examResult && !entry.treatment) {
        lines.push(entry.notes)
      }

      if (idx < groups[dest].length - 1) lines.push('')
    })

    if (groupIdx < destKeys.length - 1) lines.push('')
  })

  return lines.join('\n')
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    return true
  }
}

export default function ReturnReport({ date, entries }) {
  const [copied, setCopied] = useState(false)

  const returnedCount = entries.filter(e => e.returned).length
  const notReturnedCount = entries.length - returnedCount
  const reportText = buildReturnText(date, entries)

  const handleCopy = async () => {
    await copyText(reportText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (entries.length === 0) return null

  return (
    <div className="report-section">
      {/* สรุปสถานะ */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{
          flex: 1, padding: '0.75rem', background: 'var(--green-50)',
          border: '1.5px solid var(--green-200)', borderRadius: 'var(--radius-md)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--green-600)' }}>{returnedCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--green-700)', fontWeight: 600 }}>กลับแล้ว</div>
        </div>
        <div style={{
          flex: 1, padding: '0.75rem',
          background: notReturnedCount > 0 ? '#fff7ed' : 'var(--gray-50)',
          border: `1.5px solid ${notReturnedCount > 0 ? '#fed7aa' : 'var(--gray-200)'}`,
          borderRadius: 'var(--radius-md)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: notReturnedCount > 0 ? '#c2410c' : 'var(--gray-400)' }}>
            {notReturnedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: notReturnedCount > 0 ? '#c2410c' : 'var(--gray-400)', fontWeight: 600 }}>
            ยังไม่กลับ
          </div>
        </div>
      </div>

      <div className="section-divider"><span>ข้อความรายงานกลับ</span></div>
      <div className="report-box" id="return-report-box">
        <button
          id="copy-return-btn"
          className={`report-copy-btn ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
        >
          {copied ? <><Check size={13} /> คัดลอกแล้ว!</> : <><Copy size={13} /> คัดลอก</>}
        </button>
        <span style={{ paddingRight: '5rem', display: 'block' }}>{reportText}</span>
      </div>
    </div>
  )
}
