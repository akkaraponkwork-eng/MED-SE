import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Layout from './components/Layout'
import CalendarView from './pages/CalendarView'
import EntryPage from './pages/EntryPage'
import CalendarPage from './pages/CalendarPage'

const AUTH_KEY = 'med_auth_user'

function getTodayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function App() {
  const [user, setUser] = useState(() => localStorage.getItem(AUTH_KEY) || null)

  const handleLogin = (username) => {
    localStorage.setItem(AUTH_KEY, username)
    setUser(username)
  }

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY)
    setUser(null)
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <BrowserRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<CalendarView />} />
          <Route path="/today" element={<Navigate to={`/entry/${getTodayStr()}`} replace />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/entry/:date" element={<EntryPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
