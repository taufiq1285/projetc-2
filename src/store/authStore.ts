import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'
import type { UserRole } from '@/types'
import { authService } from '@/lib/supabase/auth'

export interface AuthUser extends User {
  role?: UserRole
  employee_id?: string
  student_id?: string
  lab_assignments?: string[]
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  sessionExpiry: number | null
}

interface AuthActions {
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSessionExpiry: (expiry: number | null) => void
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  clearAuth: () => void
  checkSession: () => Promise<boolean>
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      sessionExpiry: null,

      // Actions
      setUser: (user) => 
        set({ 
          user, 
          isAuthenticated: !!user,
          error: null 
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      setSessionExpiry: (sessionExpiry) => set({ sessionExpiry }),

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        
        try {
          const { data, error } = await authService.signIn({ email, password })
          
          if (error) {
            set({ error: error.message, isLoading: false })
            return { success: false, error: error.message }
          }

          if (data.user) {
            const authUser: AuthUser = {
              ...data.user,
              role: data.user.user_metadata?.role as UserRole,
              employee_id: data.user.user_metadata?.employee_id,
              student_id: data.user.user_metadata?.student_id,
              lab_assignments: data.user.user_metadata?.lab_assignments || []
            }

            set({ 
              user: authUser, 
              isAuthenticated: true, 
              isLoading: false,
              sessionExpiry: data.session?.expires_at ? new Date(data.session.expires_at).getTime() : null
            })
            
            return { success: true }
          }

          set({ isLoading: false })
          return { success: false, error: 'Login failed' }

        } catch (err) {
          const errorMessage = 'Login failed'
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage }
        }
      },

      logout: async () => {
        set({ isLoading: true })
        
        try {
          await authService.signOut()
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: null,
            sessionExpiry: null
          })
        } catch (err) {
          set({ error: 'Logout failed', isLoading: false })
        }
      },

      refreshUser: async () => {
        try {
          const { user, error } = await authService.getCurrentUser()
          
          if (error) {
            set({ error: error.message })
            return
          }

          if (user) {
            const authUser: AuthUser = {
              ...user,
              role: user.user_metadata?.role as UserRole,
              employee_id: user.user_metadata?.employee_id,
              student_id: user.user_metadata?.student_id,
              lab_assignments: user.user_metadata?.lab_assignments || []
            }

            set({ user: authUser, isAuthenticated: true, error: null })
          } else {
            set({ user: null, isAuthenticated: false })
          }
        } catch (err) {
          set({ error: 'Failed to refresh user' })
        }
      },

      clearAuth: () => 
        set({ 
          user: null, 
          isAuthenticated: false, 
          error: null,
          sessionExpiry: null
        }),

      checkSession: async () => {
        const { sessionExpiry } = get()
        
        if (sessionExpiry && Date.now() > sessionExpiry) {
          get().clearAuth()
          return false
        }

        try {
          const { session } = await authService.getCurrentSession()
          
          if (!session) {
            get().clearAuth()
            return false
          }

          return true
        } catch {
          get().clearAuth()
          return false
        }
      }
    }),
    {
      name: 'akbid-auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sessionExpiry: state.sessionExpiry
      })
    }
  )
)

// Selectors
export const useAuth = () => useAuthStore((state) => ({
  user: state.user,
  isAuthenticated: state.isAuthenticated,
  isLoading: state.isLoading,
  error: state.error
}))

export const useAuthActions = () => useAuthStore((state) => ({
  login: state.login,
  logout: state.logout,
  refreshUser: state.refreshUser,
  clearAuth: state.clearAuth,
  checkSession: state.checkSession
}))

// Auth guard helper
export const requireAuth = () => {
  const { isAuthenticated, user } = useAuth()
  return isAuthenticated && user
}

// Role check helper
export const hasRole = (requiredRole: UserRole) => {
  const { user } = useAuth()
  return user?.role === requiredRole
}

// Multi-role check helper
export const hasAnyRole = (roles: UserRole[]) => {
  const { user } = useAuth()
  return user?.role && roles.includes(user.role)
}