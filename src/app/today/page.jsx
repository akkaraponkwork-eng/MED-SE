'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TodayPage() {
  const router = useRouter()
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    router.replace(`/entry/${today}`)
  }, [router])
  return null
}

