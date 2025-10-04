'use client'

import React from 'react'

interface NoAuthRouteProps {
  children: React.ReactNode
}

export const NoAuthRoute: React.FC<NoAuthRouteProps> = ({ 
  children 
}) => {
  // No authentication checks at all - just render the children
  return <>{children}</>
}
