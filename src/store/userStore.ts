import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserRole } from '@/types'
import { dbService } from '@/lib/supabase/database'
import { useAuthStore } from './authStore'

export interface UserProfile {
  id: string
  email: string
  name: string
  role: UserRole
  employee_id?: string
  student_id?: string
  avatar_url?: string
  phone?: string
  address?: string
  lab_assignments?: string[]
  course_assignments?: string[]
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: 'id' | 'en'
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  dashboard: {
    layout: 'grid' | 'list'
    widgets: string[]
  }
  privacy: {
    show_email: boolean
    show_phone: boolean
    show_status: boolean
  }
}

interface UserState {
  // Current user profile
  profile: UserProfile | null
  preferences: UserPreferences
  
  // Loading states
  isLoadingProfile: boolean
  isUpdatingProfile: boolean
  
  // Error states
  profileError: string | null
  
  // Cache
  profilesCache: Map<string, UserProfile>
  lastProfileUpdate: number | null
}

interface UserActions {
  // Profile management
  loadProfile: (userId?: string) => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>
  refreshProfile: () => Promise<void>
  
  // Preferences management
  updatePreferences: (updates: Partial<UserPreferences>) => void
  resetPreferences: () => void
  
  // Profile cache management
  getProfileFromCache: (userId: string) => UserProfile | null
  cacheProfile: (profile: UserProfile) => void
  clearProfileCache: () => void
  
  // Utility actions
  setProfile: (profile: UserProfile | null) => void
  setPreferences: (preferences: UserPreferences) => void
  clearUserData: () => void
  
  // Error management
  setProfileError: (error: string | null) => void
}

type UserStore = UserState & UserActions

const defaultPreferences: UserPreferences = {
  theme: 'system',
  language: 'id',
  notifications: {
    email: true,
    push: true,
    sms: false
  },
  dashboard: {
    layout: 'grid',
    widgets: ['schedule', 'inventory', 'reports', 'notifications']
  },
  privacy: {
    show_email: false,
    show_phone: false,
    show_status: true
  }
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      // State
      profile: null,
      preferences: defaultPreferences,
      isLoadingProfile: false,
      isUpdatingProfile: false,
      profileError: null,
      profilesCache: new Map(),
      lastProfileUpdate: null,

      // Actions
      loadProfile: async (userId?: string) => {
        const targetUserId = userId || useAuthStore.getState().user?.id
        if (!targetUserId) {
          set({ profileError: 'No user ID provided' })
          return
        }

        // Check cache first (for other users, not current user)
        if (userId && userId !== useAuthStore.getState().user?.id) {
          const cached = get().getProfileFromCache(userId)
          if (cached) {
            return
          }
        }

        set({ isLoadingProfile: true, profileError: null })

        try {
          const { data, error } = await dbService.getById('users', targetUserId)
          
          if (error) {
            set({ profileError: error.message, isLoadingProfile: false })
            return
          }

          if (data) {
            // Type assertion untuk data dari database
            const rawData = data as any
            
            const profile: UserProfile = {
              id: rawData.id || targetUserId,
              email: rawData.email || '',
              name: rawData.name || '',
              role: rawData.role || 'mahasiswa',
              employee_id: rawData.employee_id || undefined,
              student_id: rawData.student_id || undefined,
              avatar_url: rawData.avatar_url || undefined,
              phone: rawData.phone || undefined,
              address: rawData.address || undefined,
              lab_assignments: Array.isArray(rawData.lab_assignments) ? rawData.lab_assignments : [],
              course_assignments: Array.isArray(rawData.course_assignments) ? rawData.course_assignments : [],
              is_active: typeof rawData.is_active === 'boolean' ? rawData.is_active : true,
              last_login: rawData.last_login || undefined,
              created_at: rawData.created_at || new Date().toISOString(),
              updated_at: rawData.updated_at || new Date().toISOString()
            }

            // If loading current user's profile
            if (targetUserId === useAuthStore.getState().user?.id) {
              set({ 
                profile, 
                isLoadingProfile: false,
                lastProfileUpdate: Date.now()
              })
            } else {
              // Cache other users' profiles
              get().cacheProfile(profile)
            }
          }

          set({ isLoadingProfile: false })

        } catch (err) {
          set({ 
            profileError: err instanceof Error ? err.message : 'Failed to load profile',
            isLoadingProfile: false 
          })
        }
      },

      updateProfile: async (updates: Partial<UserProfile>): Promise<boolean> => {
        const currentProfile = get().profile
        if (!currentProfile) {
          set({ profileError: 'No profile to update' })
          return false
        }

        set({ isUpdatingProfile: true, profileError: null })

        try {
          const { data, error } = await dbService.update('users', currentProfile.id, {
            ...updates,
            updated_at: new Date().toISOString()
          })

          if (error) {
            set({ profileError: error.message, isUpdatingProfile: false })
            return false
          }

          if (data) {
            const updatedProfile: UserProfile = {
              ...currentProfile,
              ...updates,
              updated_at: new Date().toISOString()
            }

            set({ 
              profile: updatedProfile,
              isUpdatingProfile: false,
              lastProfileUpdate: Date.now()
            })

            // Update auth store if role changed
            if (updates.role) {
              const authUser = useAuthStore.getState().user
              if (authUser) {
                useAuthStore.getState().setUser({
                  ...authUser,
                  user_metadata: {
                    ...authUser.user_metadata,
                    role: updates.role
                  }
                })
              }
            }

            return true
          }

          set({ isUpdatingProfile: false })
          return false

        } catch (err) {
          set({ 
            profileError: err instanceof Error ? err.message : 'Failed to update profile',
            isUpdatingProfile: false 
          })
          return false
        }
      },

      refreshProfile: async () => {
        const userId = useAuthStore.getState().user?.id
        if (userId) {
          await get().loadProfile(userId)
        }
      },

      updatePreferences: (updates: Partial<UserPreferences>) => {
        const currentPreferences = get().preferences
        const newPreferences = { ...currentPreferences, ...updates }
        set({ preferences: newPreferences })
      },

      resetPreferences: () => {
        set({ preferences: defaultPreferences })
      },

      getProfileFromCache: (userId: string): UserProfile | null => {
        return get().profilesCache.get(userId) || null
      },

      cacheProfile: (profile: UserProfile) => {
        const cache = new Map(get().profilesCache)
        cache.set(profile.id, profile)
        set({ profilesCache: cache })
      },

      clearProfileCache: () => {
        set({ profilesCache: new Map() })
      },

      setProfile: (profile: UserProfile | null) => {
        set({ profile, lastProfileUpdate: profile ? Date.now() : null })
      },

      setPreferences: (preferences: UserPreferences) => {
        set({ preferences })
      },

      clearUserData: () => {
        set({
          profile: null,
          preferences: defaultPreferences,
          profileError: null,
          profilesCache: new Map(),
          lastProfileUpdate: null
        })
      },

      setProfileError: (profileError: string | null) => set({ profileError })
    }),
    {
      name: 'akbid-user-storage',
      partialize: (state) => ({
        preferences: state.preferences,
        profilesCache: Array.from(state.profilesCache.entries()),
        lastProfileUpdate: state.lastProfileUpdate
      }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.profilesCache)) {
          state.profilesCache = new Map(state.profilesCache as [string, UserProfile][])
        }
      }
    }
  )
)

// Selectors
export const useUserProfile = () => useUserStore((state) => ({
  profile: state.profile,
  isLoadingProfile: state.isLoadingProfile,
  isUpdatingProfile: state.isUpdatingProfile,
  profileError: state.profileError,
  lastProfileUpdate: state.lastProfileUpdate
}))

export const useUserPreferences = () => useUserStore((state) => ({
  preferences: state.preferences,
  updatePreferences: state.updatePreferences,
  resetPreferences: state.resetPreferences
}))

export const useUserActions = () => useUserStore((state) => ({
  loadProfile: state.loadProfile,
  updateProfile: state.updateProfile,
  refreshProfile: state.refreshProfile
}))

// Auto-load profile when user logs in
if (typeof window !== 'undefined') {
  let previousUserId: string | null = null
  
  useAuthStore.subscribe((state) => {
    const currentUserId = state.user?.id || null
    
    if (currentUserId !== previousUserId) {
      if (currentUserId) {
        useUserStore.getState().loadProfile(currentUserId)
      } else {
        useUserStore.getState().clearUserData()
      }
      
      previousUserId = currentUserId
    }
  })
}

// Helper functions
export const getUserDisplayName = (profile: UserProfile | null): string => {
  if (!profile) return 'Unknown User'
  return profile.name || profile.email || 'Unknown User'
}

export const getUserInitials = (profile: UserProfile | null): string => {
  if (!profile?.name) return 'U'
  return profile.name
    .split(' ')
    .map(word => word.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export const isProfileComplete = (profile: UserProfile | null): boolean => {
  if (!profile) return false
  return !!(profile.name && profile.email && profile.role)
}