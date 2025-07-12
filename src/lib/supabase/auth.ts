import { supabase } from './client'

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupData extends LoginCredentials {
  name: string
  role: 'admin' | 'dosen' | 'laboran' | 'mahasiswa'
  employee_id?: string
  student_id?: string
}

export const authService = {
  // Sign in with email and password
  async signIn(credentials: LoginCredentials) {
    const { data, error } = await supabase.auth.signInWithPassword(credentials)
    return { data, error }
  },

  // Sign up new user
  async signUp(userData: SignupData) {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          role: userData.role,
          employee_id: userData.employee_id,
          student_id: userData.student_id
        }
      }
    })
    return { data, error }
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // Get current session
  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  // Listen to auth changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  },

  // Reset password
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email)
    return { data, error }
  },

  // Update password
  async updatePassword(password: string) {
    const { data, error } = await supabase.auth.updateUser({ password })
    return { data, error }
  }
}