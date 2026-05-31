// ===== Google Apps Script API Service =====
// แก้ไข SCRIPT_URL ด้วย URL จาก Google Apps Script ที่ deploy แล้ว
const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || ''

const TIMEOUT_MS = 15000  // 15 วินาที
const MAX_RETRIES = 2     // retry สูงสุด 2 รอบ

// fetch พร้อม timeout
function fetchWithTimeout(url, options, ms) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer))
}

// fetch พร้อม retry
async function apiFetch(action, payload = {}) {
  if (!SCRIPT_URL) {
    throw new Error('SCRIPT_URL ยังไม่ได้ตั้งค่า กรุณาดูไฟล์ .env')
  }

  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action, ...payload }),
  }

  let lastErr
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(SCRIPT_URL, options, TIMEOUT_MS)
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`)
      return await res.json()
    } catch (err) {
      lastErr = err
      const isTimeout = err.name === 'AbortError'
      const isRetryable = isTimeout || err.message.includes('Failed to fetch') || err.message.startsWith('HTTP error: 5')
      if (!isRetryable || attempt === MAX_RETRIES) break
      // รอก่อน retry: 1s, 2s
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
      console.warn(`API retry ${attempt + 1}/${MAX_RETRIES} for action: ${action}`)
    }
  }

  console.error('API Error after retries:', lastErr)
  throw lastErr
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
