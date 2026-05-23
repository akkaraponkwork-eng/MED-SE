# 🏥 ระบบบันทึกส่งป่วยประจำวัน — ตร.ศบบ.

ระบบ Web Application สำหรับบันทึกและจัดการรายชื่อผู้ป่วยส่งตัวประจำวัน พัฒนาด้วย React + Vite เชื่อมต่อกับ Google Sheets เป็นฐานข้อมูล รองรับการใช้งานทั้งบน **โทรศัพท์มือถือ** และ **คอมพิวเตอร์**

---

## ✨ ฟีเจอร์หลัก

| ฟีเจอร์ | รายละเอียด |
|---|---|
| 🔐 ระบบ Login | บังคับล็อกอินก่อนใช้งาน |
| 📅 ปฏิทิน | ดูวันที่มีบันทึก และสถิติรายเดือน |
| 👤 เพิ่มผู้ป่วย | ค้นหาจากรายชื่อ 156 คน หรือกรอกเอง |
| 📋 บันทึกรายวัน | อาการ, ผลการตรวจ, ยา, วันนัดต่อ |
| 📄 สร้างข้อความ | สร้าง + คัดลอกข้อความสรุปส่งได้ทันที |
| ☁️ Google Sheets | บันทึกข้อมูลลง Google Sheet อัตโนมัติ |
| 📱 Responsive | รองรับมือถือและคอมพิวเตอร์ |

---

## 🚀 วิธีเริ่มใช้งาน

### 1. ติดตั้ง Dependencies

```bash
npm install
```

### 2. เริ่ม Dev Server

```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่ **http://localhost:5173**

---

## ☁️ การเชื่อมต่อ Google Sheets (Backend)

> หากยังไม่ตั้งค่า ระบบจะใช้ **LocalStorage** เก็บข้อมูลชั่วคราวแทน

### ขั้นตอนที่ 1 — เปิด Apps Script

1. เปิด [Google Sheet ของคุณ](https://docs.google.com/spreadsheets/d/1-2hq5uTtA0D0klIo_sP9-qoYDlMuapDN/edit)
2. คลิก **Extensions (ส่วนขยาย)** → **Apps Script**

### ขั้นตอนที่ 2 — วางโค้ด

ลบโค้ดเดิมออกทั้งหมด แล้ววางโค้ดจากไฟล์ `google_apps_script.js` ลงไป

**แก้ไขชื่อ Sheet** ให้ตรงกับ Tab ใน Google Sheet ของคุณ:

```js
const SHEET_PATIENTS = 'รายชื่อ'  // Tab สำหรับรายชื่อทหาร (ถ้าใช้ข้อมูลจาก Sheet ไม่ต้องสร้าง)
const SHEET_RECORDS  = 'บันทึก'   // Tab สำหรับบันทึกส่งป่วย (ระบบจะสร้างให้อัตโนมัติ)
```

### ขั้นตอนที่ 3 — Deploy เป็น Web App

1. คลิก **Deploy** → **New deployment**
2. กด ⚙️ → เลือก **Web app**
3. ตั้งค่า:
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
4. กด **Deploy** → อนุญาตสิทธิ์
5. **คัดลอก URL** ที่ได้ เช่น:
   ```
   https://script.google.com/macros/s/AKfycbXXXXXXXX/exec
   ```

### ขั้นตอนที่ 4 — ใส่ URL ใน .env

แก้ไขไฟล์ `.env`:

```env
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/AKfycbXXXXXXXX/exec
```

> ⚠️ หลังแก้ไข `.env` ให้รีสตาร์ท dev server ด้วยคำสั่ง `npm run dev`

---

## 📁 โครงสร้างโปรเจกต์

```
web-med/
├── index.html                  # HTML หลัก + โหลดฟอนต์ภาษาไทย (Sarabun)
├── vite.config.js              # ตั้งค่า Vite
├── package.json                # Dependencies
├── .env                        # ตั้งค่า URL ของ Apps Script
├── google_apps_script.js       # โค้ดสำหรับวางใน Google Apps Script
└── src/
    ├── main.jsx                # Entry point
    ├── App.jsx                 # Routing + Auth state
    ├── index.css               # Design System (White/Green Theme)
    ├── pages/
    │   ├── Login.jsx           # หน้าเข้าสู่ระบบ
    │   ├── CalendarView.jsx    # หน้าหลัก (ปฏิทิน + สถิติ)
    │   └── EntryPage.jsx       # หน้าบันทึกผู้ป่วยรายวัน
    ├── components/
    │   ├── Layout.jsx          # Navbar + Mobile Bottom Bar
    │   ├── PatientForm.jsx     # Modal กรอกข้อมูลผู้ป่วย
    │   └── DailyReport.jsx     # สร้างและคัดลอกข้อความสรุป
    ├── hooks/
    │   └── useRecords.js       # จัดการข้อมูล (LocalStorage + Sync)
    └── services/
        └── api.js              # เชื่อมต่อ Google Apps Script API
```

---

## 🗂️ โครงสร้างข้อมูลใน Google Sheet

### Sheet `บันทึก` (สร้างอัตโนมัติ)

| คอลัมน์ | รายละเอียด |
|---|---|
| `id` | รหัสประจำรายการ |
| `date` | วันที่ (รูปแบบ YYYY-MM-DD) |
| `patient` | ข้อมูลผู้ป่วย (JSON) |
| `symptoms` | อาการ |
| `examResult` | ผลการตรวจ |
| `treatment` | การรักษา / ยาที่ได้รับ |
| `appointmentDate` | วันนัดต่อ |
| `appointmentTime` | เวลานัด |
| `notes` | หมายเหตุ / เพิ่มเติม |
| `noAppointment` | ไม่มีนัดต่อ (true/false) |

### Sheet `รายชื่อ` (สำหรับดึงรายชื่อแบบ Dynamic)

> ⚠️ ถ้าไม่ตั้งค่า Apps Script ระบบจะใช้รายชื่อที่ฝังอยู่ในโปรแกรม (156 คน)

| คอลัมน์ A | B | C | D | E | F |
|---|---|---|---|---|---|
| รหัส | ยศ | ชื่อ | สกุล | หน่วย | จังหวัด |

---

## 📄 รูปแบบข้อความสรุปรายวัน

ระบบจะสร้างข้อความในรูปแบบนี้อัตโนมัติ:

```
ส่งป่วยประจำวันที่ 23 พ.ค.69
🏠 ส่งป่วย ตร.ศบบ.
1.พลฯ ธีรภัทร แซ่ลี้ หมวด 4 เลขที่ 118
อาการ: เชื้อราที่หลัง
นัดต่อ 27 พ.ค. 69 เวลา 09:00

2.พลฯ บรรจง ตรีเนตร หมวด 4 เลขที่ 138
อาการ: ปวดหัว เหมือนจะเป็นไข้
การรักษา: -Special Mouth Wash 1ขวด
          -Bromhexine 8mg 20เม็ด
ไม่มีนัดต่อ
```

---

## 🔧 Tech Stack

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Vanilla CSS (White/Green Theme) |
| Routing | React Router v6 |
| Icons | Lucide React |
| Font | Sarabun (Google Fonts) |
| Backend | Google Apps Script (Web App) |
| Database | Google Sheets |
| Cache | LocalStorage |

---

## 📱 UI/UX

- **Mobile-First Design** — ใช้งานได้ดีบนมือถือ มี Bottom Navigation Bar
- **Desktop Friendly** — ปรับ Layout อัตโนมัติบนหน้าจอใหญ่
- **ธีมขาว-เขียว** — สะอาดตา เป็นระเบียบ
- **Glassmorphism Login** — หน้า Login สวยงาม มี Animation
- **Bottom Sheet Modal** — Popup แบบลื่นไหลบนมือถือ

---

## ⚠️ หมายเหตุ

- ข้อมูลจะถูกบันทึกใน **LocalStorage** ก่อนเสมอ แล้ว Sync ไป Google Sheet ในพื้นหลัง
- หาก Apps Script ไม่ตอบสนอง ข้อมูลจะยังคงอยู่ในเครื่องให้ใช้งานต่อได้
- **ล้าง LocalStorage** ได้ที่ Developer Tools (F12) → Application → Local Storage

---

*พัฒนาโดย Antigravity AI | สำหรับใช้งานภายใน ตร.ศบบ. เท่านั้น*
