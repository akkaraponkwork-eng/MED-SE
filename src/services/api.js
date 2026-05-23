// ===== Google Apps Script API Service =====
// แก้ไข SCRIPT_URL ด้วย URL จาก Google Apps Script ที่ deploy แล้ว
const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || ''

async function apiFetch(action, payload = {}) {
  if (!SCRIPT_URL) {
    throw new Error('SCRIPT_URL ยังไม่ได้ตั้งค่า กรุณาดูไฟล์ .env')
  }
  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action, ...payload }),
    })
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('API Error:', err)
    throw err
  }
}

// ดึงรายชื่อผู้ป่วย (Master List) จาก Google Sheet
export async function getPatientList() {
  const result = await apiFetch('getPatients')
  return result.data || []
}

// ดึงบันทึกการส่งป่วยทั้งหมด
export async function getAllRecords() {
  const result = await apiFetch('getRecords')
  return result.data || []
}

// ดึงบันทึกการส่งป่วยตามวันที่ (format: YYYY-MM-DD)
export async function getRecordsByDate(date) {
  const result = await apiFetch('getRecordsByDate', { date })
  return result.data || []
}

// เพิ่มบันทึกส่งป่วยใหม่
export async function addRecord(record) {
  return await apiFetch('addRecord', { record })
}

// อัปเดตบันทึกส่งป่วย
export async function updateRecord(record) {
  return await apiFetch('updateRecord', { record })
}

// ลบบันทึกส่งป่วย
export async function deleteRecord(id) {
  return await apiFetch('deleteRecord', { id })
}

// ดึงวันที่ที่มีบันทึก (สำหรับปฏิทิน)
export async function getDatesWithRecords() {
  const result = await apiFetch('getDates')
  return result.data || []
}
