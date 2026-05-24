import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

function thaiDate(dateStr) {
  if (!dateStr) return ''
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(String(dateStr))) {
    const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number)
    if (m >= 1 && m <= 12) return `${d} ${THAI_MONTHS[m - 1]} ${(y + 543).toString().slice(-2)}`
  }
  // raw Date string fallback
  const dt = new Date(dateStr)
  if (!isNaN(dt.getTime())) {
    const y = dt.getFullYear()
    const m = dt.getMonth() + 1
    const d = dt.getDate()
    return `${d} ${THAI_MONTHS[m - 1]} ${(y + 543).toString().slice(-2)}`
  }
  return String(dateStr)
}

function formatApptTime(timeStr) {
  if (!timeStr) return ''
  const s = String(timeStr).trim()
  // HH:MM หรือ HH:MM:SS
  if (/^\d{2}:\d{2}/.test(s)) return s.slice(0, 5)
  return s
}

function buildReportText(date, entries) {
  const lines = []
  lines.push(`ส่งป่วยประจำวันที่ ${thaiDate(date)}`)

  // แยกกลุ่มตาม destination
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
      // หมวด X เลขที่ XXX
      const platoonPart = p.platoon ? ` หมวด ${p.platoon} ` : ''
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
        lines.push(` `)
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

    // blank line between groups
    if (groupIdx < destKeys.length - 1) lines.push('')
  })

  return lines.join('\n')
}

export default function DailyReport({ date, entries }) {
  const [copied, setCopied] = useState(false)

  const reportText = buildReportText(date, entries)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const ta = document.createElement('textarea')
      ta.value = reportText
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (entries.length === 0) return null

  return (
    <div className="report-section">
      <div className="section-divider"><span>ข้อความสรุปรายวัน</span></div>
      <div className="report-box" id="daily-report-box">
        <button
          id="copy-report-btn"
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
