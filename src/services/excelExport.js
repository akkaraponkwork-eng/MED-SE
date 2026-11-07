import * as XLSX from 'xlsx'

const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

function formatThaiDate(dateStr) {
  if (!dateStr) return ''
  if (/^\d{4}-\d{2}-\d{2}/.test(String(dateStr))) {
    const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number)
    if (m >= 1 && m <= 12) {
      return `${d} ${THAI_MONTHS_SHORT[m - 1]} ${(y + 543).toString().slice(-2)}`
    }
  }
  return String(dateStr)
}

function cleanPlatoon(platoon) {
  if (!platoon) return ''
  const s = String(platoon).trim()
  const match = s.match(/\d+/)
  if (match) return `หมวด ${match[0]}`
  if (!s.startsWith('หมวด')) return `หมวด ${s}`
  return s
}

/**
 * ส่งออกไฟล์ Excel แบบหลายแผ่นงาน (Multi-sheet)
 * Sheet 1: ประวัติการส่งป่วย
 * Sheet 2: รายชื่อทหารผลัดปัจจุบัน
 * Sheet 3: สรุปสถิติ
 */
export function exportComprehensiveExcel({
  records = [],
  patients = [],
  filename = 'รายงานส่งป่วย_พัน.บร.ศบ.xlsx',
  filterInfo = {}
}) {
  const wb = XLSX.utils.book_new()

  // ===== Sheet 1: ประวัติการส่งป่วย =====
  const recordsHeaders = [
    'ลำดับ',
    'วันที่ส่งตรวจ',
    'วันที่ (ไทย)',
    'รหัสทหาร',
    'ยศ',
    'ชื่อ',
    'นามสกุล',
    'หมวด',
    'เลขที่',
    'หน่วย',
    'โรคประจำตัว',
    'ส่งป่วยที่',
    'อาการ',
    'ผลการตรวจ',
    'การรักษา / ยาที่ได้รับ',
    'สถานะกลับ',
    'เวลากลับ',
    'การนัดตรวจต่อ',
    'หมายเหตุ'
  ]

  const recordsRows = [recordsHeaders]

  // จัดเรียงบันทึกตามวันที่ (ล่าสุดขึ้นก่อน)
  const sortedRecords = [...records].sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  sortedRecords.forEach((entry, idx) => {
    if (!entry) return
    const p = entry.patient || {}
    let apptInfo = 'ไม่มีนัดต่อ'
    if (!entry.noAppointment) {
      if (entry.appointmentDate) {
        apptInfo = `นัดวันที่ ${formatThaiDate(entry.appointmentDate)}${entry.appointmentTime ? ' เวลา ' + entry.appointmentTime + ' น.' : ''}`
      } else if (p.appointmentText || entry.appointmentText) {
        apptInfo = p.appointmentText || entry.appointmentText
        if (p.isEveryday) apptInfo += ' (ต่อเนื่องทุกวัน)'
      }
    }

    recordsRows.push([
      idx + 1,
      entry.date || '',
      formatThaiDate(entry.date),
      p.code || '',
      p.rank || 'พลฯ',
      p.firstName || '',
      p.lastName || '',
      cleanPlatoon(p.platoon),
      p.number || '',
      p.unit || 'พัน.บร.กบร.ศบบ.',
      p.disease || '',
      entry.destination || 'ตร.ศบบ.',
      entry.symptoms || '',
      entry.examResult || '',
      entry.treatment || '',
      entry.returned ? 'กลับแล้ว' : 'ยังไม่กลับ',
      entry.returnTime || '',
      apptInfo,
      entry.notes || ''
    ])
  })

  const wsRecords = XLSX.utils.aoa_to_sheet(recordsRows)

  // กำหนดความกว้างคอลัมน์ใน Sheet 1
  wsRecords['!cols'] = [
    { wch: 6 },  // ลำดับ
    { wch: 13 }, // วันที่
    { wch: 13 }, // วันที่ (ไทย)
    { wch: 11 }, // รหัส
    { wch: 8 },  // ยศ
    { wch: 15 }, // ชื่อ
    { wch: 16 }, // สกุล
    { wch: 10 }, // หมวด
    { wch: 8 },  // เลขที่
    { wch: 16 }, // หน่วย
    { wch: 16 }, // โรคประจำตัว
    { wch: 12 }, // ส่งป่วยที่
    { wch: 25 }, // อาการ
    { wch: 25 }, // ผลตรวจ
    { wch: 35 }, // การรักษา
    { wch: 11 }, // สถานะกลับ
    { wch: 10 }, // เวลากลับ
    { wch: 25 }, // นัดต่อ
    { wch: 20 }, // หมายเหตุ
  ]

  XLSX.utils.book_append_sheet(wb, wsRecords, 'ประวัติการส่งป่วย')

  // ===== Sheet 2: รายชื่อทหารผลัดปัจจุบัน =====
  const soldiersHeaders = [
    'รหัส',
    'ยศ',
    'ชื่อ',
    'นามสกุล',
    'หมวด',
    'เลขที่',
    'หน่วย',
    'โรคประจำตัว',
    'เลขบัตรประจำตัวประชาชน',
    'จังหวัด'
  ]

  const soldiersRows = [soldiersHeaders]

  patients.forEach((p, idx) => {
    if (!p) return
    soldiersRows.push([
      p.code || `ANAศ${String(idx + 1).padStart(3, '0')}`,
      p.rank || 'พลฯ',
      p.firstName || '',
      p.lastName || '',
      cleanPlatoon(p.platoon),
      p.number || String(idx + 1),
      p.unit || 'พัน.บร.กบร.ศบบ.',
      p.disease || '',
      p.citizenId || '',
      p.province || ''
    ])
  })

  const wsSoldiers = XLSX.utils.aoa_to_sheet(soldiersRows)
  wsSoldiers['!cols'] = [
    { wch: 12 }, // รหัส
    { wch: 8 },  // ยศ
    { wch: 15 }, // ชื่อ
    { wch: 16 }, // นามสกุล
    { wch: 10 }, // หมวด
    { wch: 8 },  // เลขที่
    { wch: 18 }, // หน่วย
    { wch: 20 }, // โรคประจำตัว
    { wch: 18 }, // เลขบัตร ปชช.
    { wch: 15 }, // จังหวัด
  ]

  XLSX.utils.book_append_sheet(wb, wsSoldiers, 'รายชื่อทหารผลัดปัจจุบัน')

  // ===== Sheet 3: สรุปสถิติ =====
  const totalRecords = records.length
  const destCounts = { 'ตร.ศบบ.': 0, 'รพ. อปร.ฯ': 0, 'อื่นๆ': 0 }
  const returnedCount = records.filter(r => r.returned).length
  const notReturnedCount = totalRecords - returnedCount
  const apptCount = records.filter(r => !r.noAppointment && (r.appointmentDate || r.patient?.appointmentText || r.appointmentText)).length

  const platoonCounts = { 'หมวด 1': 0, 'หมวด 2': 0, 'หมวด 3': 0, 'หมวด 4': 0, 'หมวด 5': 0, 'อื่นๆ': 0 }

  records.forEach(r => {
    const dest = r.destination || 'ตร.ศบบ.'
    if (destCounts[dest] !== undefined) destCounts[dest]++
    else destCounts['อื่นๆ']++

    const pl = cleanPlatoon(r.patient?.platoon)
    if (platoonCounts[pl] !== undefined) platoonCounts[pl]++
    else platoonCounts['อื่นๆ']++
  })

  const diseasePatientsCount = patients.filter(p => p.disease && p.disease !== '-').length

  const summaryRows = [
    ['สรุปข้อมูลสถิติการส่งป่วย - พัน.บร.กบร.ศบบ.'],
    ['ช่วงข้อมูลที่ส่งออก:', filterInfo.dateLabel || 'ทั้งหมด'],
    ['วันที่ส่งออกไฟล์:', new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })],
    [''],
    ['ภาพรวมการส่งป่วย', 'จำนวน (ครั้ง)'],
    ['ยอดการส่งป่วยทั้งหมด', totalRecords],
    ['ตรวจเสร็จสิ้นแล้ว (กลับหน่วยแล้ว)', returnedCount],
    ['ยังไม่กลับจากสถานพยาบาล', notReturnedCount],
    ['มีนัดตรวจรักษาต่อ', apptCount],
    [''],
    ['จำแนกตามสถานพยาบาลที่ส่งตรวจ', 'จำนวน (ครั้ง)'],
    ['ตร.ศบบ. (ตอนพยาบาล ศบบ.)', destCounts['ตร.ศบบ.']],
    ['รพ. อปร.ฯ (โรงพยาบาลอานันทมหิดล)', destCounts['รพ. อปร.ฯ']],
    ['สถานพยาบาลอื่นๆ', destCounts['อื่นๆ']],
    [''],
    ['จำแนกยอดการส่งป่วยตามหมวด', 'จำนวน (ครั้ง)'],
    ['หมวด 1', platoonCounts['หมวด 1']],
    ['หมวด 2', platoonCounts['หมวด 2']],
    ['หมวด 3', platoonCounts['หมวด 3']],
    ['หมวด 4', platoonCounts['หมวด 4']],
    ['หมวดอื่นๆ', platoonCounts['อื่นๆ'] + (platoonCounts['หมวด 5'] || 0)],
    [''],
    ['ข้อมูลกำลังพลในระบบ (Master List)', 'จำนวน (นาย)'],
    ['ยอดทหารทั้งหมดในผลัด', patients.length],
    ['ทหารที่มีโรคประจำตัว (เฝ้าระวังพิเศษ)', diseasePatientsCount]
  ]

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
  wsSummary['!cols'] = [
    { wch: 38 },
    { wch: 18 }
  ]

  XLSX.utils.book_append_sheet(wb, wsSummary, 'สรุปสถิติ')

  // เขียนไฟล์และดาวน์โหลด
  const finalFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  XLSX.writeFile(wb, finalFilename)
}

