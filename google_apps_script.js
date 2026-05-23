// ===================================================
// Google Apps Script - วางโค้ดนี้ใน Google Apps Script
// ===================================================
// วิธีใช้:
// 1. เปิด Google Sheet ของคุณ
// 2. ไปที่ Extensions > Apps Script
// 3. วางโค้ดนี้ลงไป (แทนที่โค้ดเดิม)
// 4. กด Deploy > New deployment > Web App
//    - Execute as: Me
//    - Who has access: Anyone
// 5. คัดลอก Web App URL มาใส่ใน .env ของโปรเจกต์นี้
//    VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/xxx/exec

const SHEET_PATIENTS = 'รายชื่อ'  // ชื่อ Sheet รายชื่อ (ปรับตามชีทของคุณ)
const SHEET_RECORDS = 'บันทึก'    // ชื่อ Sheet บันทึกการส่งป่วย

// โครงสร้างคอลัมน์ Sheet บันทึก (14 คอลัมน์):
// 1:id | 2:date | 3:patient | 4:symptoms | 5:examResult | 6:treatment
// 7:appointmentDate | 8:appointmentTime | 9:notes | 10:noAppointment
// 11:destination | 12:returned | 13:returnTime | 14:returnNotes

function doPost(e) {
  const data = JSON.parse(e.postData.contents)
  let result = {}

  try {
    switch (data.action) {
      case 'getPatients':
        result = { data: getPatients() }
        break
      case 'getRecords':
        result = { data: getRecords() }
        break
      case 'getRecordsByDate':
        result = { data: getRecordsByDate(data.date) }
        break
      case 'addRecord':
        result = addRecord(data.record)
        break
      case 'updateRecord':
        result = updateRecord(data.record)
        break
      case 'deleteRecord':
        result = deleteRecord(data.id)
        break
      case 'getDates':
        result = { data: getDates() }
        break
      default:
        result = { error: 'Unknown action' }
    }
  } catch (err) {
    result = { error: err.message }
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON)
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', message: 'Web Med API is running v2' }))
    .setMimeType(ContentService.MimeType.JSON)
}

// ดึงรายชื่อผู้ป่วย
// โครงสร้าง Sheet: ยศ | ชื่อ | นามสกุล | หมวด | เลขที่
function getPatients() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = ss.getSheetByName(SHEET_PATIENTS)
  if (!sheet) return []

  const rows = sheet.getDataRange().getValues()
  const patients = []

  for (let i = 1; i < rows.length; i++) {
    const [rank, firstName, lastName, platoon, number] = rows[i]
    if (!firstName) continue
    patients.push({
      id: `p${i}`,
      rank: rank || 'พลฯ',
      firstName: String(firstName),
      lastName: String(lastName || ''),
      platoon: String(platoon || ''),
      number: String(number || ''),
    })
  }

  return patients
}

// แปลง Date object หรือ string ให้เป็น YYYY-MM-DD เสมอ
function formatDate(val) {
  if (!val) return ''
  if (val instanceof Date) {
    const y = val.getFullYear()
    const m = String(val.getMonth() + 1).padStart(2, '0')
    const d = String(val.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  const s = String(val).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  const d = new Date(s)
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear()
    const mo = String(d.getMonth() + 1).padStart(2, '0')
    const da = String(d.getDate()).padStart(2, '0')
    return `${y}-${mo}-${da}`
  }
  return s
}

// แปลง Date object หรือ string ให้เป็น HH:MM (24 ชม.) เสมอ
function formatTime(val) {
  if (!val) return ''
  if (val instanceof Date) {
    const h = String(val.getHours()).padStart(2, '0')
    const m = String(val.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  }
  const s = String(val).trim()
  if (/^\d{1,2}:\d{2}/.test(s)) {
    const [h, m] = s.split(':')
    return `${String(h).padStart(2, '0')}:${m.slice(0, 2)}`
  }
  return s
}

// ดึงบันทึกการส่งป่วยทั้งหมด (14 คอลัมน์)
function getRecords() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = ss.getSheetByName(SHEET_RECORDS)
  if (!sheet) {
    sheet = createRecordSheet(ss)
  }

  const rows = sheet.getDataRange().getValues()
  const records = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const [id, date, patientJson, symptoms, examResult, treatment,
      appointmentDate, appointmentTime, notes, noAppointment,
      destination, returned, returnTime, returnNotes] = row
    if (!id) continue
    let patient = {}
    try { patient = JSON.parse(patientJson) } catch { }

    records.push({
      id: String(id),
      date: formatDate(date),
      patient,
      symptoms: String(symptoms || ''),
      examResult: String(examResult || ''),
      treatment: String(treatment || ''),
      appointmentDate: formatDate(appointmentDate),
      appointmentTime: formatTime(appointmentTime),
      notes: String(notes || ''),
      noAppointment: noAppointment === true || noAppointment === 'TRUE',
      // fields ใหม่ (คอลัมน์ 11-14) — ถ้าเป็น row เก่ายังไม่มี จะ undefined → ใช้ default
      destination: String(destination || 'ตร.ศบบ.'),
      returned: returned === true || returned === 'TRUE',
      returnTime: formatTime(returnTime),
      returnNotes: String(returnNotes || ''),
    })
  }

  return records
}

function getRecordsByDate(date) {
  return getRecords().filter(r => r.date === date)
}

function addRecord(record) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = ss.getSheetByName(SHEET_RECORDS)
  if (!sheet) sheet = createRecordSheet(ss)

  sheet.appendRow([
    record.id,
    record.date,
    JSON.stringify(record.patient),
    record.symptoms || '',
    record.examResult || '',
    record.treatment || '',
    record.appointmentDate || '',
    record.appointmentTime || '',
    record.notes || '',
    record.noAppointment || false,
    record.destination || 'ตร.ศบบ.',
    record.returned || false,
    record.returnTime || '',
    record.returnNotes || '',
  ])

  return { success: true }
}

function updateRecord(record) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = ss.getSheetByName(SHEET_RECORDS)
  if (!sheet) return { error: 'Sheet not found' }

  const rows = sheet.getDataRange().getValues()
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(record.id)) {
      // อัปเดต 14 คอลัมน์ (backward compatible: ถ้า row เก่ามีแค่ 10 จะขยายให้)
      sheet.getRange(i + 1, 1, 1, 14).setValues([[
        record.id,
        record.date,
        JSON.stringify(record.patient),
        record.symptoms || '',
        record.examResult || '',
        record.treatment || '',
        record.appointmentDate || '',
        record.appointmentTime || '',
        record.notes || '',
        record.noAppointment || false,
        record.destination || 'ตร.ศบบ.',
        record.returned || false,
        record.returnTime || '',
        record.returnNotes || '',
      ]])
      return { success: true }
    }
  }
  return { error: 'Record not found' }
}

function deleteRecord(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = ss.getSheetByName(SHEET_RECORDS)
  if (!sheet) return { error: 'Sheet not found' }

  const rows = sheet.getDataRange().getValues()
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      sheet.deleteRow(i + 1)
      return { success: true }
    }
  }
  return { error: 'Record not found' }
}

function getDates() {
  const records = getRecords()
  const dates = [...new Set(records.map(r => r.date))]
  return dates
}

function createRecordSheet(ss) {
  const sheet = ss.insertSheet(SHEET_RECORDS)
  sheet.getRange(1, 1, 1, 14).setValues([[
    'id', 'date', 'patient', 'symptoms', 'examResult',
    'treatment', 'appointmentDate', 'appointmentTime', 'notes', 'noAppointment',
    'destination', 'returned', 'returnTime', 'returnNotes'
  ]])
  sheet.getRange(1, 1, 1, 14).setFontWeight('bold')
  sheet.setFrozenRows(1)
  return sheet
}
