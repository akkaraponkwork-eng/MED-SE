'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, Home, User, Calendar, WifiOff, RefreshCw, Building2, ClipboardList, Users, FileSpreadsheet } from 'lucide-react'
import { useSyncStatus } from '@/hooks/useSyncContext'
import ExportModal from '@/components/ExportModal'

export default function Layout({ children, user, onLogout }) {
  const pathname = usePathname()
  const syncStatus = useSyncStatus()
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportDefaultDate, setExportDefaultDate] = useState(null)

  // ดักฟังสัญญาณเปิดหน้าต่างส่งออก Excel จากหน้าอื่นๆ
  useEffect(() => {
    const handleOpenExport = (e) => {
      setExportDefaultDate(e.detail?.date || null)
      setShowExportModal(true)
    }
    window.addEventListener('open_export_modal', handleOpenExport)
    return () => window.removeEventListener('open_export_modal', handleOpenExport)
  }, [])

  const thaiDate = new Date().toLocaleDateString('th-TH', {
    weekday: 'short', day: 'numeric', month: 'short', year: '2-digit'
  })

  const handleLogout = () => {
    if (window.confirm('ต้องการออกจากระบบ?')) onLogout()
  }

  const handleForceUpdate = () => {
    if (window.confirm('ต้องการรีเฟรชเพื่ออัปเดตแอปให้เป็นเวอร์ชันล่าสุดหรือไม่? (สำหรับแก้ปัญหาแคชค้าง)')) {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          for (let reg of registrations) reg.unregister()
        })
      }
      if ('caches' in window) {
        caches.keys().then(keys => {
          Promise.all(keys.map(key => caches.delete(key)))
        })
      }
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }
  }

  return (
    <div className="layout">
      <nav className="navbar">
        <Link href="/" className="navbar-brand">
          <div className="navbar-brand-icon">
            <Building2 size={20} color="white" />
          </div>
          <span>MED-SE</span>
        </Link>

        <span className="navbar-date">{thaiDate}</span>

        <div className="navbar-spacer" />

        <div className="navbar-actions">
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => { setExportDefaultDate(null); setShowExportModal(true) }}
            title="ส่งออกข้อมูลเป็นไฟล์ Excel (Multi-Sheet)"
            style={{ color: 'var(--green-700)' }}
          >
            <FileSpreadsheet size={18} />
          </button>
          <Link href="/patients" className="btn btn-ghost btn-icon btn-sm" title="จัดการรายชื่อทหาร / เปลี่ยนผลัด" style={{ color: 'var(--green-700)' }}>
            <Users size={18} />
          </Link>
          <Link href="/calendar" className="btn btn-ghost btn-icon btn-sm" title="ปฏิทิน" style={{ color: 'var(--green-700)' }}>
            <Calendar size={18} />
          </Link>
          <div className="navbar-user">
            <User size={13} />
            {user}
          </div>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={handleForceUpdate}
            title="รีเฟรชแอป (อัปเดตเวอร์ชัน)"
            style={{ color: 'var(--green-700)' }}
          >
            <RefreshCw size={18} />
          </button>
          <button
            id="logout-btn"
            className="btn btn-ghost btn-icon btn-sm"
            onClick={handleLogout}
            title="ออกจากระบบ"
          >
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      {/* Sync Status Banner */}
      {syncStatus === 'offline' && (
        <div style={{
          background: '#fff7ed',
          borderBottom: '1px solid #fed7aa',
          padding: '0.35rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.78rem',
          color: '#c2410c',
          fontWeight: 600,
        }}>
          <WifiOff size={13} />
          ออฟไลน์ — ข้อมูลอาจไม่เป็นปัจจุบัน (ระบบใช้ข้อมูลจาก cache)
        </div>
      )}
      {syncStatus === 'syncing' && (
        <div style={{
          background: '#f0fdf4',
          borderBottom: '1px solid #bbf7d0',
          padding: '0.35rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.78rem',
          color: '#15803d',
          fontWeight: 600,
        }}>
          <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />
          กำลังซิงค์ข้อมูล...
        </div>
      )}

      <main className="main-content fade-in">
        {children}
      </main>

      {/* Mobile Bottom Bar */}
      <div style={{
        display: 'flex',
        borderTop: '1px solid var(--gray-100)',
        background: 'white',
        padding: '0.5rem 0',
        position: 'sticky',
        bottom: 0,
        zIndex: 90,
        boxShadow: '0 -2px 12px rgba(0,0,0,0.05)'
      }}
        className="mobile-bottom-bar"
      >
        <NavTab href="/" label="หน้าหลัก" icon={<Home size={20} />} active={pathname === '/'} />
        <NavTab href="/today" label="วันนี้" icon={<ClipboardList size={20} />} active={pathname === '/today' || pathname?.startsWith('/entry/')} />
        <NavTab href="/calendar" label="ปฏิทิน" icon={<Calendar size={20} />} active={pathname === '/calendar'} />
        <NavTab href="/patients" label="รายชื่อทหาร" icon={<Users size={20} />} active={pathname === '/patients'} />
        <button
          onClick={() => { setExportDefaultDate(null); setShowExportModal(true) }}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.2rem',
            padding: '0.4rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: showExportModal ? 'var(--green-600)' : 'var(--gray-400)',
            fontSize: '0.7rem',
            fontWeight: showExportModal ? 700 : 500,
            transition: 'color 0.2s',
          }}
        >
          <FileSpreadsheet size={20} />
          <span>ส่งออก</span>
        </button>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal 
          defaultDate={exportDefaultDate} 
          onClose={() => { setShowExportModal(false); setExportDefaultDate(null) }} 
        />
      )}

      <style>{`
        .mobile-bottom-bar { display: flex; }
        @media (min-width: 768px) { .mobile-bottom-bar { display: none; } }
      `}</style>
    </div>
  )
}

function NavTab({ href, label, icon, active }) {
  return (
    <Link
      href={href}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.2rem',
        padding: '0.4rem',
        textDecoration: 'none',
        color: active ? 'var(--green-600)' : 'var(--gray-400)',
        fontSize: '0.7rem',
        fontWeight: active ? 700 : 500,
        transition: 'color 0.2s',
      }}
    >
      {icon}
      {label}
    </Link>
  )
}
