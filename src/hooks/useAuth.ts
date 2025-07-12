import { useState, useEffect } from 'react'
import { authService } from '@/lib/supabase/auth'
import type { User } from '@supabase/supabase-js'
import type { UserRole } from '@/types'

interface AuthUser extends User {
  role?: UserRole
}

interface UseAuthReturn {
  user: AuthUser | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { session, error } = await authService.getCurrentSession()
        if (error) {
          setError(error.message)
        } else if (session?.user) {
          setUser(session.user as AuthUser)
        }
      } catch (err) {
        setError('Failed to get session')
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user as AuthUser)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await authService.signIn({ email, password })
      if (error) {
        setError(error.message)
      } else if (data.user) {
        setUser(data.user as AuthUser)
      }
    } catch (err) {
      setError('Login failed')
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      const { error } = await authService.signOut()
      if (error) {
        setError(error.message)
      } else {
        setUser(null)
      }
    } catch (err) {
      setError('Logout failed')
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    try {
      const { user: currentUser, error } = await authService.getCurrentUser()
      if (error) {
        setError(error.message)
      } else {
        setUser(currentUser as AuthUser)
      }
    } catch (err) {
      setError('Failed to refresh user')
    }
  }

  return {
    user,
    loading,
    error,
    login,
    logout,
    refreshUser
  }
}