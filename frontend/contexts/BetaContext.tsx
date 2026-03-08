'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface BetaUser {
  id: string
  name: string
  email: string
}

interface BetaContextType {
  isBetaMode: boolean
  betaUser: BetaUser | null
  enableBetaMode: () => void
  disableBetaMode: () => void
  setBetaUser: (user: BetaUser) => void
}

const BetaContext = createContext<BetaContextType | undefined>(undefined)

export const useBeta = () => {
  const context = useContext(BetaContext)
  if (context === undefined) {
    throw new Error('useBeta must be used within a BetaProvider')
  }
  return context
}

export const BetaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBetaMode, setIsBetaMode] = useState(false)
  const [betaUser, setBetaUser] = useState<BetaUser | null>(null)

  useEffect(() => {
    // Check if beta mode is enabled in session storage
    const betaMode = sessionStorage.getItem('betaMode')
    const betaUserData = sessionStorage.getItem('betaUser')
    
    if (betaMode === 'true') {
      setIsBetaMode(true)
      if (betaUserData) {
        setBetaUser(JSON.parse(betaUserData))
      }
    }
  }, [])

  const enableBetaMode = () => {
    setIsBetaMode(true)
    sessionStorage.setItem('betaMode', 'true')
  }

  const disableBetaMode = () => {
    setIsBetaMode(false)
    setBetaUser(null)
    sessionStorage.removeItem('betaMode')
    sessionStorage.removeItem('betaUser')
  }

  const handleSetBetaUser = (user: BetaUser) => {
    setBetaUser(user)
    sessionStorage.setItem('betaUser', JSON.stringify(user))
  }

  const value = {
    isBetaMode,
    betaUser,
    enableBetaMode,
    disableBetaMode,
    setBetaUser: handleSetBetaUser
  }

  return (
    <BetaContext.Provider value={value}>
      {children}
    </BetaContext.Provider>
  )
}
