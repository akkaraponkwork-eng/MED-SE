'use client'

import { useState, useEffect } from 'react'
import Login from '@/components/Login'
import Layout from '@/components/Layout'
import { RecordsProvider } from '@/hooks/recordsContext'

const AUTH_KEY = 'med_auth_user'

export default function AppShell({ children }) {
  const [user, setUser] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(AUTH_KEY)
    if (saved) setUser(saved)
    setMounted(true)
  }, [])

  const handleLogin = (username) => {
    localStorage.setItem(AUTH_KEY, username)
    setUser(username)
  }

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY)
    setUser(null)
  }

  if (!mounted) {
    return null
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <RecordsProvider>
      <Layout user={user} onLogout={handleLogout}>
        {children}
      </Layout>
    </RecordsProvider>
  )
}
