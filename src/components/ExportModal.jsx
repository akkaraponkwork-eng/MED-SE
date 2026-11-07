'use client'

import { useState, useMemo } from 'react'
import { 
  X, Download, FileSpreadsheet, Calendar, Filter, 
  CheckCircle, FileText, Building2, Users, Layers
} from 'lucide-react'
import { useRecords, usePatients } from '@/hooks/useRecords'
import { exportComprehensiveExcel } from '@/services/excelExport'

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

export default function ExportModal({ onClose, defaultDate = null }) {
  const { records } = useRecords()
  const { patients } = usePatients()

  const todayIso = new Date().toISOString().slice(0, 10)
  const currentMonthIso = todayIso.slice(0, 7) // YYYY-MM

  // ตัวเลือกช่วงเวลา
  const [dateRangeType, setDateRangeType] = useState(() => {
    if (defaultDate) return 'today'
    return 'all'
  })
  const [selectedDate, setSelectedDate] = useState(defaultDate || todayIso)
  const [selectedMonth, setSelectedMonth] = useState(currentMonthIso)
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().slice(0, 10)
  })
  const [customEnd, setCustomEnd] = useState(todayIso)

  // ตัวเลือกตัวกรองเสริม
  const [destFilter, setDestFilter] = useState('all') // 'all' | 'ตร.ศบบ.' | 'รพ. อปร.ฯ'
  const [platoonFilter, setPlatoonFilter] = useState('all')

  // กรองประวัติการส่งป่วยตามช่วงเวลาและเงื่อนไข
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // กรองตามวันที่
      if (dateRangeType === 'today') {
        if (r.date !== selectedDate) return false
      } else if (dateRangeType === 'month') {
        if (!r.date || !r.date.startsWith(selectedMonth)) return false
      } else if (dateRangeType === 'custom') {
        if (!r.date || r.date < customStart || r.date > customEnd) return false
      }

      // กรองตามสถานพยาบาล
      if (destFilter !== 'all' && (r.destination || 'ตร.ศบบ.') !== destFilter) {
        return false
      }

      // กรองตามหมวด
      if (platoonFilter !== 'all') {
        const pl = String(r.patient?.platoon || '')
        if (!pl.includes(platoonFilter.replace('หมวด ', ''))) return false
      }

      return true
    })
  }, [records, dateRangeType, selectedDate, selectedMonth, customStart, customEnd, destFilter, platoonFilter])

  // คำนวณชื่อไฟล์เริ่มต้นตามเงื่อนไขที่เลือก
  const defaultFilename = useMemo(() => {
    if (dateRangeType === 'today') {
      return `รายงานส่งป่วย_พัน.บร.ศบ_${selectedDate}.xlsx`
    }
    if (dateRangeType === 'month') {
      const [y, m] = selectedMonth.split('-').map(Number)
      const thaiMonthName = THAI_MONTHS[m - 1] || ''
      const thaiYearShort = (y + 543).toString().slice(-2)
      return `รายงานส่งป่วย_พัน.บร.ศบ_${thaiMonthName}${thaiYearShort}.xlsx`
    }
    if (dateRangeType === 'custom') {
      return `รายงานส่งป่วย_พัน.บร.ศบ_${customStart}_ถึง_${customEnd}.xlsx`
    }
    return `รายงานส่งป่วย_พัน.บร.ศบ_ข้อมูลทั้งหมด_${todayIso}.xlsx`
  }, [dateRangeType, selectedDate, selectedMonth, customStart, customEnd, todayIso])

  const [filename, setFilename] = useState(defaultFilename)

  // อัปเดตชื่อไฟล์เมื่อเปลี่ยนตัวกรอง หากผู้ใช้ยังไม่ได้พิมพ์ชื่อเอง
  const handleRangeChange = (type) => {
    setDateRangeType(type)
    // ให้ชื่อไฟล์อัปเดตตามประเภทใหม่
    setTimeout(() => {
      // trigger re-eval
    }, 0)
  }

  // ส่งออกไฟล์
  const handleDownload = () => {
    let dateLabel = 'ข้อมูลทั้งหมดทุกช่วงเวลา'
    if (dateRangeType === 'today') {
      dateLabel = `ประจำวันที่ ${selectedDate}`
    } else if (dateRangeType === 'month') {
      const [y, m] = selectedMonth.split('-').map(Number)
      dateLabel = `ประจำเดือน ${THAI_MONTHS[m - 1]} ${y + 543}`
    } else if (dateRangeType === 'custom') {
      dateLabel = `ตั้งแต่ ${customStart} ถึง ${customEnd}`
    }

    exportComprehensiveExcel({
      records: filteredRecords,
      patients,
      filename: filename.trim() || defaultFilename,
      filterInfo: {
        dateLabel,
        destination: destFilter,
        platoon: platoonFilter
      }
    })

    onClose()
  }

  return (
    <div className="modal-overlay center" onClick={onClose} style={{ zIndex: 300 }}>
      <div 
        className="modal" 
        style={{ maxWidth: '580px', borderRadius: 'var(--radius-xl)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <FileSpreadsheet size={22} style={{ color: 'var(--green-600)' }} />
          <h2 className="modal-title">ส่งออกข้อมูลเป็นไฟล์ Excel (.xlsx)</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* ข้อมูลแผ่นงานที่จะสร้าง */}
          <div style={{
            background: 'var(--green-50)',
            border: '1px solid var(--green-200)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            fontSize: '0.82rem',
            color: 'var(--green-900)',
            lineHeight: 1.5,
          }}>
            <div style={{ fontWeight: 700, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers size={16} />
              <span>ไฟล์ Excel รวม 3 แผ่นงาน (Multi-Sheet) พร้อมใช้งาน:</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <li><strong>แผ่นงานที่ 1:</strong> ประวัติการส่งป่วย (วันที่, อาการ, ผลตรวจ, การรักษา, การนัดต่อ)</li>
              <li><strong>แผ่นงานที่ 2:</strong> รายชื่อทหารผลัดปัจจุบัน (รหัส, ยศ, ชื่อ, หมวด, โรคประจำตัว, บัตร ปชช.)</li>
              <li><strong>แผ่นงานที่ 3:</strong> สรุปสถิติ (ยอดรวมแยกตามหมวดและสถานที่ส่งตรวจ)</li>
            </ul>
          </div>

          {/* เลือกช่วงเวลา */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontWeight: 700, color: 'var(--gray-800)' }}>
              1. เลือกช่วงข้อมูลการส่งป่วย
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.65rem' }}>
              <button
                type="button"
                className={`btn ${dateRangeType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.82rem', padding: '0.5rem 0.75rem' }}
                onClick={() => handleRangeChange('all')}
              >
                ทั้งหมด (ทุกช่วงเวลา)
              </button>
              <button
                type="button"
                className={`btn ${dateRangeType === 'month' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.82rem', padding: '0.5rem 0.75rem' }}
                onClick={() => handleRangeChange('month')}
              >
                ประจำเดือน
              </button>
              <button
                type="button"
                className={`btn ${dateRangeType === 'today' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.82rem', padding: '0.5rem 0.75rem' }}
                onClick={() => handleRangeChange('today')}
              >
                เฉพาะรายวัน
              </button>
              <button
                type="button"
                className={`btn ${dateRangeType === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.82rem', padding: '0.5rem 0.75rem' }}
                onClick={() => handleRangeChange('custom')}
              >
                กำหนดช่วงวันเอง
              </button>
            </div>

            {/* ส่วนเลือกเดือน */}
            {dateRangeType === 'month' && (
              <div style={{ background: 'var(--gray-50)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>เลือกเดือนและปี:</label>
                <input
                  type="month"
                  className="form-control"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                />
              </div>
            )}

            {/* ส่วนเลือกวันเดี่ยว */}
            {dateRangeType === 'today' && (
              <div style={{ background: 'var(--gray-50)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>เลือกวันที่ส่งป่วย:</label>
                <input
                  type="date"
                  className="form-control"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                />
              </div>
            )}

            {/* ส่วนกำหนดช่วงวันเอง */}
            {dateRangeType === 'custom' && (
              <div style={{ background: 'var(--gray-50)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>ตั้งแต่วันที่:</label>
                  <input
                    type="date"
                    className="form-control"
                    value={customStart}
                    onChange={e => setCustomStart(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>ถึงวันที่:</label>
                  <input
                    type="date"
                    className="form-control"
                    value={customEnd}
                    onChange={e => setCustomEnd(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ตัวกรองสถานที่ส่งตรวจ & หมวด */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                ส่งป่วยที่:
              </label>
              <select
                className="form-control"
                value={destFilter}
                onChange={e => setDestFilter(e.target.value)}
              >
                <option value="all">ทั้งหมด (ตร.ศบบ. และ รพ. อปร.ฯ)</option>
                <option value="ตร.ศบบ.">เฉพาะ ตร.ศบบ.</option>
                <option value="รพ. อปร.ฯ">เฉพาะ รพ. อปร.ฯ</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                หมวด:
              </label>
              <select
                className="form-control"
                value={platoonFilter}
                onChange={e => setPlatoonFilter(e.target.value)}
              >
                <option value="all">ทุกหมวด</option>
                <option value="หมวด 1">หมวด 1</option>
                <option value="หมวด 2">หมวด 2</option>
                <option value="หมวด 3">หมวด 3</option>
                <option value="หมวด 4">หมวด 4</option>
              </select>
            </div>
          </div>

          {/* สรุปยอดรายการที่จะส่งออก */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--gray-50)',
            border: '1px solid var(--gray-200)',
            borderRadius: 'var(--radius-md)',
            padding: '0.65rem 1rem',
            marginBottom: '1rem',
            fontSize: '0.82rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gray-700)' }}>
              <FileText size={15} style={{ color: 'var(--green-600)' }} />
              <span>ประวัติการส่งป่วย:</span>
              <strong style={{ color: 'var(--green-700)' }}>{filteredRecords.length} รายการ</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gray-700)' }}>
              <Users size={15} style={{ color: 'var(--green-600)' }} />
              <span>รายชื่อทหารในผลัด:</span>
              <strong style={{ color: 'var(--green-700)' }}>{patients.length} นาย</strong>
            </div>
          </div>

          {/* ตั้งชื่อไฟล์ */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
              ชื่อไฟล์ Excel ที่จะดาวน์โหลด:
            </label>
            <input
              type="text"
              className="form-control"
              value={filename}
              onChange={e => setFilename(e.target.value)}
              placeholder={defaultFilename}
            />
          </div>

          {/* ปุ่มดาวน์โหลด / ยกเลิก */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              style={{ flex: 1 }}
            >
              ยกเลิก
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleDownload}
              style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <Download size={16} />
              <span>ดาวน์โหลด Excel (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

