'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { 
  ArrowLeft, Search, Upload, Download, FileSpreadsheet, 
  Trash2, Plus, Users, CheckCircle, AlertTriangle, RefreshCw, X,
  HeartPulse, ShieldAlert, FileText, Check, ChevronDown, Filter
} from 'lucide-react'
import { usePatients } from '@/hooks/useRecords'

// หัวตารางทางการตามแบบฟอร์มการนำเข้าข้อมูลทหารใหม่ พัน.บร.ศบ.
const OFFICIAL_EXCEL_HEADERS = [
  'รหัส', 'ยศ', 'ชื่อ', 'สกุล', 'หน่วย', 'หมวด', 'รหัสภายใน',
  'เลขบัตรประจำตัวประชาชน', 'วดป.เกิด', 'ภูมิลำเนา', 'อำเภอ', 'จังหวัด',
  'ชื่อบิดา', 'สกุลบิดา', 'ชื่อมารดา', 'สกุลมารดา', 'การศึกษา', 'ศาสนา',
  'น้ำหนัก', 'ส่วนสูง', 'คัดเลือกแบบสมัครออนไลน์', 'คัดเลือกแบบร้องขอ',
  'คัดเลือกแบบจับฉลาก', 'คัดเลือกแบบหลีกเลี่ยง', 'โรคประจำตัว (ระบุโรค)',
  'วัคซีนโควิด-19เข็มที่1(ชนิด)', 'วัคซีนโควิด-19เข็มที่2(ชนิด)',
  'วัคซีนโควิด-19เข็มที่3(ชนิด)', 'วัคซีนโควิด-19เข็มที่4(ชนิด)',
  'วัคซีนโควิด-19เข็มที่5(ชนิด)', 'เข็มสุดท้ายได้รับเมื่อวันที่'
]

const PLATOONS = ['ทั้งหมด', 'หมวด 1', 'หมวด 2', 'หมวด 3', 'หมวด 4', 'หมวด 5', 'มีโรคประจำตัว']
const PLATOON_CHOICES = ['หมวด 1', 'หมวด 2', 'หมวด 3', 'หมวด 4', 'หมวด 5']

// ฟังก์ชันแปลง 2D Array จาก Excel/CSV/Pasted ให้เป็น Object รายชื่อทหาร
function parseMilitaryData(rawRows, platoonStrategy = 'auto', defaultFixedPlatoon = 'หมวด 1') {
  if (!rawRows || rawRows.length === 0) return []

  // วิเคราะห์หัวตารางในแถวแรก
  const firstRow = (rawRows[0] || []).map(c => String(c || '').trim())
  const headerStr = firstRow.join(' ').toLowerCase()

  const hasCodeHeader = firstRow.some(h => /รหัส/i.test(h) && !/รหัสภายใน/i.test(h))
  const hasNameHeader = firstRow.some(h => /^ชื่อ$/i.test(h) || /^ชื่อ\s*ทหาร/i.test(h) || /^firstname$/i.test(h))
  const hasRankHeader = firstRow.some(h => /^ยศ/i.test(h))
  const isHeaderPresent = hasCodeHeader || hasNameHeader || hasRankHeader

  let startIndex = 0
  let colIdx = {
    code: -1,
    rank: -1,
    firstName: -1,
    lastName: -1,
    unit: -1,
    platoon: -1,
    number: -1,
    citizenId: -1,
    disease: -1,
    province: -1,
    weight: -1,
    height: -1,
    birthDate: -1,
  }

  if (isHeaderPresent) {
    startIndex = 1
    colIdx.code = firstRow.findIndex(h => /รหัส/i.test(h) && !/รหัสภายใน/i.test(h))
    colIdx.rank = firstRow.findIndex(h => /^ยศ/i.test(h))
    colIdx.firstName = firstRow.findIndex(h => /^ชื่อ$/i.test(h) || /^ชื่อ\s*ทหาร/i.test(h) || /^firstname$/i.test(h))
    colIdx.lastName = firstRow.findIndex(h => /^(นาม)?สกุล$/i.test(h) || /^lastname$/i.test(h))
    colIdx.unit = firstRow.findIndex(h => /หน่วย/i.test(h))
    colIdx.platoon = firstRow.findIndex(h => /หมวด/i.test(h))
    colIdx.number = firstRow.findIndex(h => /^เลขที่$/i.test(h) || /^ลำดับ$/i.test(h))
    colIdx.citizenId = firstRow.findIndex(h => /บัตรประจำตัวประชาชน/i.test(h) || /บัตรประชาชน/i.test(h))
    colIdx.disease = firstRow.findIndex(h => /โรคประจำตัว/i.test(h))
    colIdx.province = firstRow.findIndex(h => /จังหวัด/i.test(h))
    colIdx.weight = firstRow.findIndex(h => /น้ำหนัก/i.test(h))
    colIdx.height = firstRow.findIndex(h => /ส่วนสูง/i.test(h))
    colIdx.birthDate = firstRow.findIndex(h => /เกิด/i.test(h))
  } else {
    // ถ้าไม่มีหัวตาราง ให้เดาตามจำนวนคอลัมน์มาตรฐาน
    const sample = firstRow
    if (sample.length >= 5) {
      colIdx = {
        code: -1,
        rank: 0,
        firstName: 1,
        lastName: 2,
        platoon: 3,
        number: 4,
        unit: -1,
        citizenId: -1,
        disease: -1,
        province: -1,
      }
    } else if (sample.length === 4) {
      colIdx = {
        code: -1,
        rank: -1,
        firstName: 0,
        lastName: 1,
        platoon: 2,
        number: 3,
        unit: -1,
        citizenId: -1,
        disease: -1,
        province: -1,
      }
    }
  }

  const rawExtracted = []

  for (let i = startIndex; i < rawRows.length; i++) {
    const row = rawRows[i]
    if (!row || row.length === 0) continue

    const firstName = colIdx.firstName >= 0 ? String(row[colIdx.firstName] || '').trim() : ''
    if (!firstName) continue

    const code = colIdx.code >= 0 ? String(row[colIdx.code] || '').trim() : ''
    const rank = colIdx.rank >= 0 ? String(row[colIdx.rank] || 'พลฯ').trim() : 'พลฯ'
    const lastName = colIdx.lastName >= 0 ? String(row[colIdx.lastName] || '').trim() : ''
    const unit = colIdx.unit >= 0 ? String(row[colIdx.unit] || '').trim() : ''
    let platoon = colIdx.platoon >= 0 ? String(row[colIdx.platoon] || '').trim() : ''
    const citizenId = colIdx.citizenId >= 0 ? String(row[colIdx.citizenId] || '').trim() : ''
    const rawDisease = colIdx.disease >= 0 ? String(row[colIdx.disease] || '').trim() : ''
    const province = colIdx.province >= 0 ? String(row[colIdx.province] || '').trim() : ''
    let number = colIdx.number >= 0 ? String(row[colIdx.number] || '').trim() : ''

    // ดึงเลขที่จากรหัสถ้าไม่มีคอลัมน์เลขที่ (เช่น ANAศ001 -> 1)
    if (!number && code) {
      const matchNum = code.match(/\d+/)
      if (matchNum) {
        number = String(parseInt(matchNum[0], 10))
      }
    }

    // กรองโรคประจำตัวที่ไม่ระบุหรือขีดละไว้
    const disease = (rawDisease === '-' || rawDisease === 'ไม่มี' || rawDisease === 'ปกติ') ? '' : rawDisease

    rawExtracted.push({
      code,
      rank: rank || 'พลฯ',
      firstName,
      lastName,
      unit: unit || 'พัน.บร.กบร.ศบบ.',
      platoon,
      number,
      citizenId,
      disease,
      province,
    })
  }

  // จัดการจัดหมวดทหาร (เนื่องจากแบบฟอร์มรับเข้ามักจะยังไม่ระบุหมวด)
  const total = rawExtracted.length
  const perPlatoon = Math.ceil(total / 4)

  return rawExtracted.map((p, idx) => {
    let finalPlatoon = p.platoon

    if (platoonStrategy === 'auto') {
      // จัดเฉลี่ยเข้า หมวด 1 - 4 เท่าๆ กัน
      const plNum = Math.min(4, Math.floor(idx / perPlatoon) + 1)
      finalPlatoon = `หมวด ${plNum}`
    } else if (platoonStrategy === 'fixed') {
      finalPlatoon = defaultFixedPlatoon
    } else if (platoonStrategy === 'keep') {
      if (!finalPlatoon) {
        finalPlatoon = defaultFixedPlatoon
      }
    }

    // ทำความสะอาดชื่อหมวด
    const matchPl = String(finalPlatoon).match(/\d+/)
    if (matchPl) {
      finalPlatoon = `หมวด ${matchPl[0]}`
    } else if (finalPlatoon && !String(finalPlatoon).startsWith('หมวด')) {
      finalPlatoon = `หมวด ${finalPlatoon}`
    }

    const finalNumber = p.number || String(idx + 1)

    return {
      id: `p_imp_${idx + 1}`,
      ...p,
      platoon: finalPlatoon || 'หมวด 1',
      number: finalNumber,
    }
  })
}

// แยกข้อความที่คัดลอกจาก Excel หรือ CSV/TSV
function parseTextToRows(text) {
  if (!text || !text.trim()) return []
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const rows = []

  for (const line of lines) {
    let parts = []
    if (line.includes('\t')) {
      parts = line.split('\t').map(s => s.trim())
    } else if (line.includes(',')) {
      parts = line.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''))
    } else {
      parts = line.split(/\s+/).map(s => s.trim())
    }
    if (parts.length > 0) rows.push(parts)
  }

  return rows
}

export default function PatientsPage() {
  const router = useRouter()
  const { patients, loading, savePatientsList, resetPatientsToDefault } = usePatients()

  const [search, setSearch] = useState('')
  const [selectedPlatoon, setSelectedPlatoon] = useState('ทั้งหมด')
  const [showImportModal, setShowImportModal] = useState(false)
  const [toast, setToast] = useState('')

  // State สำหรับ Modal นำเข้า
  const [importTab, setImportTab] = useState('file') // 'file' | 'paste'
  const [pasteText, setPasteText] = useState('')
  const [rawRows, setRawRows] = useState([])
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [platoonStrategy, setPlatoonStrategy] = useState('auto') // 'auto' | 'fixed' | 'keep'
  const [defaultFixedPlatoon, setDefaultFixedPlatoon] = useState('หมวด 1')
  const [importMode, setImportMode] = useState('replace') // 'replace' | 'append'
  const [syncToSheet, setSyncToSheet] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewSearch, setPreviewSearch] = useState('')
  const fileInputRef = useRef(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  // ประมวลผลข้อความเมื่อพิมพ์หรือวาง
  const handlePasteChange = (val) => {
    setPasteText(val)
    const rows = parseTextToRows(val)
    setRawRows(rows)
    setUploadedFileName('')
  }

  // จัดการอัปโหลดไฟล์ (.xlsx, .xls, .csv, .tsv, .txt)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadedFileName(file.name)
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')

    const reader = new FileReader()

    if (isExcel) {
      reader.onload = (event) => {
        try {
          const buffer = event.target?.result
          const wb = XLSX.read(buffer, { type: 'array' })
          const firstSheet = wb.SheetNames[0]
          const sheet = wb.Sheets[firstSheet]
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })
          setRawRows(rows)
          setPasteText('')
        } catch (err) {
          alert('ไม่สามารถอ่านไฟล์ Excel ได้: ' + err.message)
        }
      }
      reader.readAsArrayBuffer(file)
    } else {
      reader.onload = (event) => {
        try {
          const text = event.target?.result
          if (typeof text === 'string') {
            const rows = parseTextToRows(text)
            setRawRows(rows)
            setPasteText(text)
          }
        } catch (err) {
          alert('ไม่สามารถอ่านไฟล์ได้: ' + err.message)
        }
      }
      reader.readAsText(file, 'UTF-8')
    }
  }

  // รายชื่อที่แปลงแล้วพร้อมตัวเลือกหมวด
  const parsedPreview = useMemo(() => {
    if (!rawRows || rawRows.length === 0) return []
    return parseMilitaryData(rawRows, platoonStrategy, defaultFixedPlatoon)
  }, [rawRows, platoonStrategy, defaultFixedPlatoon])

  // สรุปยอดแยกแต่ละหมวดใน Preview
  const previewPlatoonCounts = useMemo(() => {
    const counts = {}
    PLATOON_CHOICES.forEach(pl => { counts[pl] = 0 })
    parsedPreview.forEach(p => {
      counts[p.platoon] = (counts[p.platoon] || 0) + 1
    })
    return counts
  }, [parsedPreview])

  // ยอดทหารที่มีโรคประจำตัวในระบบ
  const diseaseCount = useMemo(() => {
    return patients.filter(p => p.disease && p.disease !== '-').length
  }, [patients])

  // กรองรายชื่อทหารในหน้าหลัก
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      if (selectedPlatoon === 'มีโรคประจำตัว') {
        if (!p.disease || p.disease === '-') return false
      } else if (selectedPlatoon !== 'ทั้งหมด' && p.platoon !== selectedPlatoon) {
        return false
      }

      if (!search.trim()) return true
      const q = search.toLowerCase()
      const full = `${p.code || ''} ${p.rank} ${p.firstName} ${p.lastName} ${p.platoon} ${p.number} ${p.disease || ''} ${p.citizenId || ''} ${p.province || ''} ${p.unit || ''}`.toLowerCase()
      return full.includes(q)
    })
  }, [patients, selectedPlatoon, search])

  // นับจำนวนทหารแต่ละหมวดในหน้าหลัก
  const countsByPlatoon = useMemo(() => {
    const counts = { ทั้งหมด: patients.length, มีโรคประจำตัว: diseaseCount }
    PLATOON_CHOICES.forEach(pl => {
      counts[pl] = patients.filter(p => p.platoon === pl).length
    })
    return counts
  }, [patients, diseaseCount])

  // บันทึกการนำเข้า
  const handleConfirmImport = async () => {
    if (parsedPreview.length === 0) return

    setIsSubmitting(true)
    try {
      let finalPatients = []
      if (importMode === 'replace') {
        finalPatients = parsedPreview
      } else {
        finalPatients = [...patients, ...parsedPreview]
      }

      const res = await savePatientsList(finalPatients, syncToSheet)
      setShowImportModal(false)
      setRawRows([])
      setPasteText('')
      setUploadedFileName('')
      
      let msg = `นำเข้ารายชื่อสำเร็จ ${parsedPreview.length} นาย`
      if (res.syncError) {
        msg += ' (บันทึกลงระบบแล้ว แต่การซิงค์ Google Sheet ขัดข้อง)'
      } else if (syncToSheet) {
        msg += ' และอัปเดต Google Sheet เรียบร้อย'
      }
      showToast(msg)
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // รีเซ็ตข้อมูลกลับค่าเริ่มต้น
  const handleReset = async () => {
    if (window.confirm('ต้องการคืนค่ารายชื่อกลับเป็นชุดเริ่มต้น 157 นาย (พัน.บร.ศบ.) หรือไม่?')) {
      await resetPatientsToDefault()
      showToast('คืนค่ารายชื่อเริ่มต้นเรียบร้อย')
    }
  }

  // ดาวน์โหลดแม่แบบ Excel (.xlsx) ตามแบบฟอร์มทางการ พัน.บร.ศบ.
  const handleDownloadExcelTemplate = () => {
    const sampleRows = [
      OFFICIAL_EXCEL_HEADERS,
      [
        'ANAศ001', 'พลฯ', 'สมชาย', 'ใจหาญ', 'พัน.บร.กบร.ศบบ.', 'หมวด 1', '',
        '1510101403511', '1 ม.ค. 2545', '123 หมู่ 1', 'เมือง', 'ลพบุรี',
        'สมบัติ', 'ใจหาญ', 'สมศรี', 'ใจหาญ', 'ม.6', 'พุทธ',
        65, 175, '', 1, '', '', 'ไม่มี',
        'Az', 'pz', '', '', '', '243316'
      ],
      [
        'ANAศ002', 'พลฯ', 'สมศักดิ์', 'รักชาติ', 'พัน.บร.กบร.ศบบ.', 'หมวด 1', '',
        '1510101403522', '15 ก.พ. 2545', '45 หมู่ 2', 'แม่ทา', 'ลำพูน',
        'ประสิทธิ์', 'รักชาติ', 'วิไล', 'รักชาติ', 'ปวช.', 'พุทธ',
        70, 180, '', '', 1, '', 'หอบหืด',
        'Sv', 'pz', '', '', '', '243418'
      ]
    ]

    const ws = XLSX.utils.aoa_to_sheet(sampleRows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'แบบฟอร์มนำเข้าทหารใหม่')
    XLSX.writeFile(wb, 'แบบฟอร์มการนำเข้าข้อมูลทหารใหม่_พัน.บร.ศบ.xlsx')
  }

  // ดาวน์โหลดแม่แบบ CSV
  const handleDownloadCsvTemplate = () => {
    const headers = ['รหัส', 'ยศ', 'ชื่อ', 'สกุล', 'หน่วย', 'หมวด', 'เลขบัตรประจำตัวประชาชน', 'โรคประจำตัว (ระบุโรค)', 'จังหวัด']
    const sampleRows = [
      ['ANAศ001', 'พลฯ', 'สมชาย', 'ใจหาญ', 'พัน.บร.กบร.ศบบ.', 'หมวด 1', '1510101403511', 'ไม่มี', 'ลพบุรี'],
      ['ANAศ002', 'พลฯ', 'สมศักดิ์', 'รักชาติ', 'พัน.บร.กบร.ศบบ.', 'หมวด 1', '1510101403522', 'หอบหืด', 'ลำพูน']
    ]
    const content = '\uFEFF' + [headers.join(','), ...sampleRows.map(r => r.map(c => `"${c}"`).join(','))].join('\r\n')
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'แม่แบบนำเข้าทหารใหม่.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // ส่งออกรายชื่อปัจจุบันเป็น Excel (.xlsx)
  const handleExportExcel = () => {
    const data = [
      OFFICIAL_EXCEL_HEADERS,
      ...patients.map((p, idx) => [
        p.code || `ANAศ${String(idx + 1).padStart(3, '0')}`,
        p.rank || 'พลฯ',
        p.firstName || '',
        p.lastName || '',
        p.unit || 'พัน.บร.กบร.ศบบ.',
        p.platoon || '',
        '',
        p.citizenId || '',
        '',
        '',
        '',
        p.province || '',
        '', '', '', '', '', '', '', '', '', '', '', '',
        p.disease || '',
        '', '', '', '', '', ''
      ])
    ]
    const ws = XLSX.utils.aoa_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'รายชื่อทหาร')
    XLSX.writeFile(wb, `รายชื่อทหาร_ผลัดปัจจุบัน_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  // ส่งออกเป็น CSV
  const handleExportCsv = () => {
    const headers = ['รหัส', 'เลขที่', 'ยศ', 'ชื่อ', 'นามสกุล', 'หมวด', 'หน่วย', 'โรคประจำตัว', 'เลขบัตรประชาชน', 'จังหวัด']
    const rows = patients.map(p => [
      `"${p.code || ''}"`,
      `"${p.number || ''}"`,
      `"${p.rank || 'พลฯ'}"`,
      `"${p.firstName || ''}"`,
      `"${p.lastName || ''}"`,
      `"${p.platoon || ''}"`,
      `"${p.unit || ''}"`,
      `"${p.disease || ''}"`,
      `"${p.citizenId || ''}"`,
      `"${p.province || ''}"`
    ])
    const content = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n')
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `รายชื่อทหาร_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => router.push('/')}
          title="กลับหน้าหลัก"
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={24} style={{ color: 'var(--green-600)' }} />
            <span>จัดการรายชื่อทหาร (ผลัดทหาร)</span>
          </div>
          <div className="page-subtitle">
            ยอดรวมในระบบ {patients.length} นาย {loading && '(กำลังเชื่อมต่อ Google Sheet...)'}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.6rem',
        marginBottom: '1.25rem',
      }}>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowImportModal(true)
            setRawRows([])
            setPasteText('')
            setUploadedFileName('')
          }}
          style={{ flex: 1, minWidth: '190px' }}
        >
          <Upload size={16} />
          <span>นำเข้ารายชื่อใหม่ (เปลี่ยนผลัด)</span>
        </button>

        <button
          className="btn btn-secondary"
          onClick={handleExportExcel}
          title="ส่งออกรายชื่อปัจจุบันเป็นไฟล์ Excel (.xlsx)"
        >
          <FileSpreadsheet size={16} />
          <span>ส่งออก Excel</span>
        </button>

        <button
          className="btn btn-secondary"
          onClick={handleExportCsv}
          title="ส่งออกรายชื่อปัจจุบันเป็นไฟล์ CSV"
        >
          <Download size={16} />
          <span>ส่งออก CSV</span>
        </button>

        <button
          className="btn btn-ghost"
          onClick={handleDownloadExcelTemplate}
          title="ดาวน์โหลดแม่แบบ Excel พัน.บร.ศบ. (31 คอลัมน์)"
        >
          <Download size={16} />
          <span>แม่แบบ Excel พัน.บร.ศบ.</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '0.75rem',
        marginBottom: '1.25rem'
      }}>
        <div className="card" style={{ padding: '0.75rem 1rem', background: 'var(--green-50)', border: '1px solid var(--green-200)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--green-800)', fontWeight: 600 }}>ยอดทหารทั้งหมด</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--green-700)', marginTop: '0.15rem' }}>
            {patients.length} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>นาย</span>
          </div>
        </div>

        {PLATOON_CHOICES.slice(0, 4).map(pl => (
          <div key={pl} className="card" style={{ padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 600 }}>{pl}</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--gray-800)', marginTop: '0.15rem' }}>
              {countsByPlatoon[pl] || 0} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--gray-400)' }}>นาย</span>
            </div>
          </div>
        ))}

        <div 
          className="card" 
          onClick={() => setSelectedPlatoon('มีโรคประจำตัว')}
          style={{ 
            padding: '0.75rem 1rem', 
            background: diseaseCount > 0 ? '#fef2f2' : 'white', 
            border: diseaseCount > 0 ? '1px solid #fecaca' : '1px solid var(--gray-200)',
            cursor: 'pointer'
          }}
          title="คลิกเพื่อดูกลุ่มทหารที่มีโรคประจำตัว"
        >
          <div style={{ fontSize: '0.75rem', color: diseaseCount > 0 ? '#b91c1c' : 'var(--gray-500)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <HeartPulse size={13} />
            <span>มีโรคประจำตัว</span>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: diseaseCount > 0 ? '#dc2626' : 'var(--gray-700)', marginTop: '0.15rem' }}>
            {diseaseCount} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>นาย</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Card */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-body" style={{ padding: '1rem' }}>
          {/* Search Input */}
          <div className="input-group" style={{ marginBottom: '0.85rem' }}>
            <Search size={16} className="input-icon" />
            <input
              type="text"
              className="form-control"
              placeholder="ค้นหาชื่อ, นามสกุล, เลขที่, รหัส ANA, หมวด, หรือโรคประจำตัว..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                style={{
                  position: 'absolute', right: '0.75rem', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', color: 'var(--gray-400)'
                }}
                onClick={() => setSearch('')}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Platoon Tabs */}
          <div style={{
            display: 'flex',
            gap: '0.4rem',
            overflowX: 'auto',
            paddingBottom: '0.25rem',
            scrollbarWidth: 'none',
          }}>
            {PLATOONS.map(pl => {
              const active = selectedPlatoon === pl
              const count = countsByPlatoon[pl] || 0
              const isDiseaseTab = pl === 'มีโรคประจำตัว'

              return (
                <button
                  key={pl}
                  onClick={() => setSelectedPlatoon(pl)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    border: active 
                      ? (isDiseaseTab ? '1.5px solid #dc2626' : '1.5px solid var(--green-600)') 
                      : '1px solid var(--gray-200)',
                    background: active 
                      ? (isDiseaseTab ? '#fef2f2' : 'var(--green-50)') 
                      : 'white',
                    color: active 
                      ? (isDiseaseTab ? '#b91c1c' : 'var(--green-700)') 
                      : 'var(--gray-600)',
                    fontSize: '0.8rem',
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isDiseaseTab && <HeartPulse size={12} />}
                  <span>{pl}</span>
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '10px',
                    background: active 
                      ? (isDiseaseTab ? '#fee2e2' : 'var(--green-200)') 
                      : 'var(--gray-100)',
                    color: active 
                      ? (isDiseaseTab ? '#991b1b' : 'var(--green-800)') 
                      : 'var(--gray-500)',
                  }}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Soldiers List / Table */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="card-title">รายชื่อทหาร</span>
            <span className="badge badge-green">แสดง {filteredPatients.length} นาย</span>
            {selectedPlatoon !== 'ทั้งหมด' && (
              <span className="badge badge-gray">หมวด: {selectedPlatoon}</span>
            )}
          </div>

          <button
            className="btn btn-ghost btn-sm"
            onClick={handleReset}
            style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}
            title="รีเซ็ตกลับเป็นข้อมูลเริ่มต้น 157 นาย (พัน.บร.ศบ.)"
          >
            <RefreshCw size={12} /> คืนค่าเริ่มต้น
          </button>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {filteredPatients.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem 1rem' }}>
              <Users size={40} style={{ color: 'var(--gray-300)', marginBottom: '0.5rem' }} />
              <h3>ไม่พบข้อมูลทหาร</h3>
              <p>ลองเปลี่ยนคำค้นหา หรือกดปุ่ม "นำเข้ารายชื่อใหม่" เพื่อนำเข้ารายชื่อทหารผลัดใหม่</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.875rem'
              }}>
                <thead>
                  <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)', color: 'var(--gray-600)' }}>
                    <th style={{ padding: '0.65rem 1rem', width: '85px' }}>เลขที่/รหัส</th>
                    <th style={{ padding: '0.65rem 0.75rem', width: '65px' }}>ยศ</th>
                    <th style={{ padding: '0.65rem 1rem' }}>ชื่อ - นามสกุล</th>
                    <th style={{ padding: '0.65rem 0.75rem', width: '100px' }}>หมวด</th>
                    <th style={{ padding: '0.65rem 0.75rem', width: '120px' }}>หน่วย</th>
                    <th style={{ padding: '0.65rem 1rem', width: '160px' }}>โรคประจำตัว</th>
                    <th style={{ padding: '0.65rem 1rem', width: '110px' }}>จังหวัด</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((p, idx) => {
                    const hasDisease = p.disease && p.disease !== '-'

                    return (
                      <tr
                        key={p.id || idx}
                        style={{
                          borderBottom: '1px solid var(--gray-100)',
                          background: hasDisease ? '#fffdfa' : (idx % 2 === 0 ? 'white' : '#fafafa'),
                          transition: 'background 0.15s'
                        }}
                      >
                        <td style={{ padding: '0.65rem 1rem' }}>
                          <div style={{ fontWeight: 700, color: 'var(--green-700)' }}>
                            {p.number || '-'}
                          </div>
                          {p.code && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', fontFamily: 'monospace' }}>
                              {p.code}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.65rem 0.75rem', color: 'var(--gray-600)' }}>
                          {p.rank || 'พลฯ'}
                        </td>
                        <td style={{ padding: '0.65rem 1rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--gray-900)' }}>
                            {p.firstName} {p.lastName}
                          </span>
                          {p.citizenId && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>
                              ปชช: {p.citizenId}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.65rem 0.75rem' }}>
                          <span style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            background: 'var(--green-50)',
                            border: '1px solid var(--green-200)',
                            color: 'var(--green-700)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            whiteSpace: 'nowrap'
                          }}>
                            {p.platoon || '-'}
                          </span>
                        </td>
                        <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                          {p.unit || '-'}
                        </td>
                        <td style={{ padding: '0.65rem 1rem' }}>
                          {hasDisease ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '4px',
                              background: '#fee2e2',
                              border: '1px solid #fecaca',
                              color: '#b91c1c',
                              fontSize: '0.78rem',
                              fontWeight: 700
                            }}>
                              <HeartPulse size={12} />
                              <span>{p.disease}</span>
                            </span>
                          ) : (
                            <span style={{ color: 'var(--gray-300)', fontSize: '0.8rem' }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: '0.65rem 1rem', fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                          {p.province || '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal นำเข้ารายชื่อใหม่ (เปลี่ยนผลัด) */}
      {showImportModal && (
        <div className="modal-overlay center" onClick={() => !isSubmitting && setShowImportModal(false)}>
          <div 
            className="modal" 
            style={{ maxHeight: '92vh', maxWidth: '780px', borderRadius: 'var(--radius-xl)' }} 
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <Upload size={20} style={{ color: 'var(--green-600)' }} />
              <h2 className="modal-title">นำเข้ารายชื่อทหารใหม่ (เปลี่ยนผลัด)</h2>
              <button 
                className="btn btn-ghost btn-icon btn-sm" 
                onClick={() => setShowImportModal(false)}
                disabled={isSubmitting}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* แถบคำแนะนำรูปแบบที่รองรับ */}
              <div style={{
                background: 'var(--green-50)',
                border: '1px solid var(--green-200)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                fontSize: '0.82rem',
                color: 'var(--green-900)',
                lineHeight: 1.5,
              }}>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileSpreadsheet size={16} />
                  <span>รองรับแบบฟอร์มการนำเข้าข้อมูลทหารใหม่ พัน.บร.ศบ. (Excel 31 คอลัมน์) โดยตรง</span>
                </div>
                <div>
                  อัปโหลดไฟล์ <code>.xlsx</code> / <code>.xls</code> / <code>.csv</code> หรือคัดลอกทั้งตารางจาก Excel มาวางได้ทันที ระบบจะจับคู่ รหัส, ยศ, ชื่อ, สกุล, โรคประจำตัว, เลขบัตร ปชช. ให้อัตโนมัติ
                </div>
              </div>

              {/* แท็บเลือกวิธีนำเข้า */}
              <div className="tabs" style={{ marginBottom: '1rem' }}>
                <button
                  className={`tab ${importTab === 'file' ? 'active' : ''}`}
                  onClick={() => setImportTab('file')}
                >
                  อัปโหลดไฟล์ Excel / CSV
                </button>
                <button
                  className={`tab ${importTab === 'paste' ? 'active' : ''}`}
                  onClick={() => setImportTab('paste')}
                >
                  วางตารางข้อความจาก Excel
                </button>
              </div>

              {importTab === 'file' ? (
                <div style={{
                  border: '2px dashed var(--gray-300)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                  background: uploadedFileName ? 'var(--green-50)' : 'var(--gray-50)',
                  marginBottom: '1rem',
                  transition: 'background 0.2s ease',
                }}>
                  <FileSpreadsheet size={42} style={{ color: uploadedFileName ? 'var(--green-600)' : 'var(--gray-400)', marginBottom: '0.5rem' }} />
                  
                  {uploadedFileName ? (
                    <div>
                      <p style={{ fontWeight: 700, color: 'var(--green-800)', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                        เลือกไฟล์: {uploadedFileName}
                      </p>
                      <p style={{ fontSize: '0.82rem', color: 'var(--green-700)', marginBottom: '1rem' }}>
                        ตรวจพบ {parsedPreview.length} รายชื่อเรียบร้อย
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontWeight: 700, color: 'var(--gray-700)', marginBottom: '0.25rem' }}>
                        เลือกไฟล์ Excel "แบบฟอร์มการนำเข้าข้อมูลทหารใหม่ พัน.บร.ศบ.xlsx"
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>
                        รองรับนามสกุล .xlsx, .xls, .csv, .tsv
                      </p>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".xlsx,.xls,.csv,.tsv,.txt"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />

                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={14} />
                      <span>{uploadedFileName ? 'เปลี่ยนไฟล์ใหม่' : 'เลือกไฟล์จากคอมพิวเตอร์'}</span>
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={handleDownloadExcelTemplate}
                      title="ดาวน์โหลดแม่แบบ Excel พัน.บร.ศบ."
                    >
                      <Download size={14} />
                      <span>ดาวน์โหลดแม่แบบ</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>วางข้อมูลที่คัดลอกจาก Excel ที่นี่:</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>เปิด Excel แล้วกด Ctrl+A, Ctrl+C นำมาวางได้เลย</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={6}
                    placeholder="วางข้อความที่มีหัวตาราง เช่น รหัส ยศ ชื่อ สกุล หน่วย หรือก็อปปี้คอลัมน์จาก Excel มาวางได้เลย..."
                    value={pasteText}
                    onChange={e => handlePasteChange(e.target.value)}
                    style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}
                    autoFocus
                  />
                </div>
              )}

              {/* แผงควบคุมการจัดหมวดทหาร (Platoon Strategy) */}
              <div style={{
                background: 'var(--gray-50)',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                border: '1px solid var(--gray-200)',
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--gray-800)', marginBottom: '0.5rem' }}>
                  การจัดทหารเข้าหมวด (เนื่องจากแบบฟอร์มรับเข้ามักจะยังไม่ระบุหมวด):
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <label className="checkbox-label" style={{ padding: 0 }}>
                    <input
                      type="radio"
                      name="platoonStrategy"
                      checked={platoonStrategy === 'auto'}
                      onChange={() => setPlatoonStrategy('auto')}
                    />
                    <div>
                      <strong style={{ color: 'var(--green-700)' }}>จัดเฉลี่ยเข้า หมวด 1 - 4 โดยอัตโนมัติ (แนะนำ)</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                        แบ่งทหารทุกคนกระจายเข้าหมวด 1 ถึง หมวด 4 เท่าๆ กัน (ประมาณ {Math.ceil(parsedPreview.length / 4 || 39)} นาย/หมวด)
                      </div>
                    </div>
                  </label>

                  <label className="checkbox-label" style={{ padding: 0 }}>
                    <input
                      type="radio"
                      name="platoonStrategy"
                      checked={platoonStrategy === 'keep'}
                      onChange={() => setPlatoonStrategy('keep')}
                    />
                    <div>
                      <span>ดึงจากข้อมูลในไฟล์ (ถ้ามีระบุไว้แล้ว)</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                        หากในไฟล์ไม่มีหมวด จะกำหนดเป็น {defaultFixedPlatoon} ให้อัตโนมัติ
                      </div>
                    </div>
                  </label>

                  <label className="checkbox-label" style={{ padding: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="radio"
                      name="platoonStrategy"
                      checked={platoonStrategy === 'fixed'}
                      onChange={() => setPlatoonStrategy('fixed')}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span>กำหนดทุกคนเป็น:</span>
                      <select
                        className="form-control"
                        style={{ width: '130px', padding: '0.2rem 0.5rem', height: 'auto', fontSize: '0.8rem' }}
                        value={defaultFixedPlatoon}
                        onChange={e => {
                          setDefaultFixedPlatoon(e.target.value)
                          setPlatoonStrategy('fixed')
                        }}
                      >
                        {PLATOON_CHOICES.map(pl => <option key={pl} value={pl}>{pl}</option>)}
                      </select>
                    </div>
                  </label>
                </div>
              </div>

              {/* การตั้งค่ารูปแบบการบันทึก */}
              <div style={{
                background: 'var(--gray-50)',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                border: '1px solid var(--gray-200)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--gray-800)' }}>
                  รูปแบบการบันทึกข้อมูล:
                </div>
                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                  <label className="checkbox-label" style={{ padding: 0 }}>
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                    />
                    <strong style={{ color: 'var(--green-700)' }}>แทนที่ทั้งหมด (เปลี่ยนผลัดใหม่)</strong>
                  </label>
                  <label className="checkbox-label" style={{ padding: 0 }}>
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                    />
                    <span>เพิ่มต่อท้ายรายชื่อเดิม</span>
                  </label>
                </div>

                <label className="checkbox-label" style={{ marginTop: '0.25rem', paddingTop: '0.4rem', borderTop: '1px solid var(--gray-200)' }}>
                  <input
                    type="checkbox"
                    checked={syncToSheet}
                    onChange={e => setSyncToSheet(e.target.checked)}
                  />
                  <span>ซิงค์รายชื่อไปยัง Google Sheet อัตโนมัติ (Google Apps Script)</span>
                </label>
              </div>

              {/* ตัวอย่างผลการแปลงข้อมูล (Preview Table) */}
              {parsedPreview.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--gray-800)' }}>
                      ตัวอย่างข้อมูลที่ตรวจพบ ({parsedPreview.length} นาย):
                    </strong>
                    <div style={{ display: 'flex', gap: '0.35rem', fontSize: '0.75rem' }}>
                      {PLATOON_CHOICES.slice(0, 4).map(pl => (
                        <span key={pl} style={{ padding: '0.15rem 0.4rem', background: 'var(--green-100)', color: 'var(--green-800)', borderRadius: '4px', fontWeight: 600 }}>
                          {pl}: {previewPlatoonCounts[pl] || 0}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    border: '1px solid var(--gray-200)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'white'
                  }}>
                    <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--gray-100)', color: 'var(--gray-600)', position: 'sticky', top: 0 }}>
                          <th style={{ padding: '0.4rem 0.6rem' }}>รหัส / เลขที่</th>
                          <th style={{ padding: '0.4rem 0.6rem' }}>ยศ</th>
                          <th style={{ padding: '0.4rem 0.6rem' }}>ชื่อ - นามสกุล</th>
                          <th style={{ padding: '0.4rem 0.6rem' }}>หมวด</th>
                          <th style={{ padding: '0.4rem 0.6rem' }}>โรคประจำตัว</th>
                          <th style={{ padding: '0.4rem 0.6rem' }}>จังหวัด</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedPreview.slice(0, 20).map((p, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                            <td style={{ padding: '0.35rem 0.6rem', color: 'var(--green-700)', fontWeight: 600 }}>
                              {p.code || p.number}
                            </td>
                            <td style={{ padding: '0.35rem 0.6rem' }}>{p.rank}</td>
                            <td style={{ padding: '0.35rem 0.6rem', fontWeight: 600 }}>
                              {p.firstName} {p.lastName}
                            </td>
                            <td style={{ padding: '0.35rem 0.6rem' }}>
                              <span style={{ padding: '0.1rem 0.35rem', background: 'var(--green-50)', borderRadius: '3px', color: 'var(--green-700)', fontWeight: 600 }}>
                                {p.platoon}
                              </span>
                            </td>
                            <td style={{ padding: '0.35rem 0.6rem' }}>
                              {p.disease ? (
                                <span style={{ color: '#b91c1c', fontWeight: 600, background: '#fee2e2', padding: '0.05rem 0.35rem', borderRadius: '3px' }}>
                                  {p.disease}
                                </span>
                              ) : '-'}
                            </td>
                            <td style={{ padding: '0.35rem 0.6rem', color: 'var(--gray-500)' }}>{p.province || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedPreview.length > 20 && (
                      <div style={{ textAlign: 'center', padding: '0.4rem', fontSize: '0.75rem', color: 'var(--gray-500)', background: 'var(--gray-50)' }}>
                        ...และอีก {parsedPreview.length - 20} นาย (ระบบจะนำเข้าทั้งหมด {parsedPreview.length} นาย)
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ปุ่มยืนยัน / ยกเลิก */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => setShowImportModal(false)}
                  disabled={isSubmitting}
                  style={{ flex: 1 }}
                >
                  ยกเลิก
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleConfirmImport}
                  disabled={isSubmitting || parsedPreview.length === 0}
                  style={{ flex: 2 }}
                >
                  {isSubmitting ? (
                    <><RefreshCw size={16} className="spinner" /> กำลังบันทึกข้อมูล...</>
                  ) : (
                    <><CheckCircle size={16} /> ยืนยันนำเข้า {parsedPreview.length} รายชื่อ</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toast && (
        <div className="toast toast-green" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <CheckCircle size={16} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}
