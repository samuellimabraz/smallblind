import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'

interface User {
  id: string
  username: string
  email: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      // Verify token validity
      axios.get('/api/auth/me')
        .then(response => {
          setUser(response.data.user)
        })
        .catch(() => {
          localStorage.removeItem('token')
          delete axios.defaults.headers.common['Authorization']
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password })
      const { token, user: userData } = response.data
      
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(userData)
    } catch (error) {
      throw new Error('Invalid credentials')
    }
  }

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/register', { username, email, password })
      const { token, user: userData } = response.data
      
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(userData)
    } catch (error) {
      throw new Error('Registration failed')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
  }

  const value = {
    user,
    login,
    register,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}