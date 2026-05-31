import { createContext, useContext } from 'react'

// Context สำหรับส่ง syncStatus จาก CalendarView/EntryPage ไปที่ Layout
// ใช้ SyncProvider ครอบ component ที่ใช้ useRecords
export const SyncContext = createContext('synced')

export function useSyncStatus() {
  return useContext(SyncContext)
}
