// ============================================
// context/AuthContext.jsx — Global Auth State
//
// This stores the logged-in user info globally.
// Any component can read: user, token, isLoggedIn
// Any component can call: login(), logout()
//
// Think of it as a global variable that
// every component in the app can access.
// ============================================

import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../utils/api'

// 1. Create the context (like creating an empty box)
const AuthContext = createContext()

// 2. Create the Provider (fills the box with data)
export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(localStorage.getItem('devshield_token'))
  const [loading, setLoading] = useState(true)

  // On app load, check if user was already logged in
  // (token stored in localStorage from previous session)
  useEffect(() => {
    const checkLoggedIn = async () => {
      const savedToken = localStorage.getItem('devshield_token')
      if (savedToken) {
        try {
          const res = await authAPI.getMe()
          setUser(res.data.user)
        } catch {
          // Token invalid or expired — clear everything
          localStorage.removeItem('devshield_token')
          localStorage.removeItem('devshield_user')
          setToken(null)
        }
      }
      setLoading(false)
    }
    checkLoggedIn()
  }, [])

  // Called after successful login
  const login = (userData, userToken) => {
    setUser(userData)
    setToken(userToken)
    localStorage.setItem('devshield_token', userToken)
    localStorage.setItem('devshield_user', JSON.stringify(userData))
  }

  // Called when user clicks logout
  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('devshield_token')
    localStorage.removeItem('devshield_user')
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isLoggedIn: !!token,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// 3. Custom hook — makes using this context easy
// Instead of: useContext(AuthContext)
// Just write: useAuth()
export const useAuth = () => useContext(AuthContext)
