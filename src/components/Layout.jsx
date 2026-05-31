import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogOut, Home, User, Calendar, WifiOff, RefreshCw } from 'lucide-react'
import { useSyncStatus } from '../hooks/useSyncContext'

export default function Layout({ children, user, onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()
  const syncStatus = useSyncStatus()

  const thaiDate = new Date().toLocaleDateString('th-TH', {
    weekday: 'short', day: 'numeric', month: 'short', year: '2-digit'
  })

  const handleLogout = () => {
    if (window.confirm('ต้องการออกจากระบบ?')) onLogout()
  }

  return (
    <div className="layout">
      <nav className="navbar">
        <Link to="/" className="navbar-brand">
          <div className="navbar-brand-icon">🏥</div>
          <span>MED-SE</span>
        </Link>

        <span className="navbar-date">{thaiDate}</span>

        <div className="navbar-spacer" />

        <div className="navbar-actions">
          <Link to="/calendar" className="btn btn-ghost btn-icon btn-sm" title="ปฏิทิน" style={{ color: 'var(--green-700)' }}>
            <Calendar size={18} />
          </Link>
          <div className="navbar-user">
            <User size={13} />
            {user}
          </div>
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
        <NavTab to="/" label="หน้าหลัก" icon={<Home size={20} />} active={location.pathname === '/'} />
        <NavTab to="/today" label="วันนี้" icon={<span style={{ fontSize: '1.1rem' }}>📋</span>} active={location.pathname === '/today'} />
        <NavTab to="/calendar" label="ปฏิทิน" icon={<Calendar size={20} />} active={location.pathname === '/calendar'} />
      </div>

      <style>{`
        .mobile-bottom-bar { display: flex; }
        @media (min-width: 768px) { .mobile-bottom-bar { display: none; } }
      `}</style>
    </div>
  )
}

function NavTab({ to, label, icon, active }) {
  return (
    <Link
      to={to}
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
