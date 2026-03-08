'use client'

import React, { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface SimpleAdminProtectedRouteProps {
  children: React.ReactNode
}

export const SimpleAdminProtectedRoute: React.FC<SimpleAdminProtectedRouteProps> = ({ 
  children 
}) => {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log('SimpleAdminProtectedRoute - loading:', loading, 'user:', !!user)
    
    // Only check if user exists, don't check admin role for now
    if (!loading && !user) {
      console.log('No user, redirecting to home')
      router.push('/home')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return <>{children}</>
}
