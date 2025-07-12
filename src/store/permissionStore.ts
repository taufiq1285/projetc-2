import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { PermissionResult, PermissionContext } from '@/types'
import { PermissionService } from '@/lib/rbac/permissions'
import { useAuthStore } from './authStore'

interface CachedPermission {
  result: PermissionResult
  timestamp: number
  ttl: number // Time to live in milliseconds
}

interface PermissionState {
  // Cache for permission results
  permissionCache: Map<string, CachedPermission>
  
  // Loading states
  loadingPermissions: Set<string>
  
  // Permission checking in progress
  isCheckingPermissions: boolean
  
  // Last error
  error: string | null
  
  // Cache statistics
  cacheHits: number
  cacheMisses: number
  
  // User's computed permissions (from RBAC)
  userPermissions: string[]
  rolePermissions: string[]
  effectivePermissions: string[]
}

interface PermissionActions {
  // Permission checking
  hasPermission: (resource: string, action: string, context?: PermissionContext) => Promise<boolean>
  checkPermission: (resource: string, action: string, context?: PermissionContext) => Promise<PermissionResult>
  hasAnyPermission: (permissions: Array<{resource: string, action: string}>, context?: PermissionContext) => Promise<boolean>
  hasAllPermissions: (permissions: Array<{resource: string, action: string}>, context?: PermissionContext) => Promise<boolean>
  
  // Cache management
  clearCache: () => void
  clearUserCache: (userId: string) => void
  setCacheEntry: (key: string, result: PermissionResult, ttl?: number) => void
  getCacheEntry: (key: string) => PermissionResult | null
  
  // Permission loading
  loadUserPermissions: (userId: string) => Promise<void>
  refreshPermissions: () => Promise<void>
  
  // State setters
  setError: (error: string | null) => void
  setCheckingPermissions: (checking: boolean) => void
  
  // Statistics
  incrementCacheHits: () => void
  incrementCacheMisses: () => void
  getCacheStats: () => { hits: number, misses: number, hitRate: number }
}

type PermissionStore = PermissionState & PermissionActions

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes default TTL
const PERMISSION_CACHE_TTL = 10 * 60 * 1000 // 10 minutes for permission results

export const usePermissionStore = create<PermissionStore>()(
  subscribeWithSelector((set, get) => ({
    // State
    permissionCache: new Map(),
    loadingPermissions: new Set(),
    isCheckingPermissions: false,
    error: null,
    cacheHits: 0,
    cacheMisses: 0,
    userPermissions: [],
    rolePermissions: [],
    effectivePermissions: [],

    // Actions
    hasPermission: async (resource: string, action: string, context?: PermissionContext): Promise<boolean> => {
      const result = await get().checkPermission(resource, action, context)
      return result.allowed
    },

    checkPermission: async (resource: string, action: string, context?: PermissionContext): Promise<PermissionResult> => {
      const user = useAuthStore.getState().user
      if (!user?.id) {
        return { allowed: false, reason: 'User not authenticated' }
      }

      // Create cache key
      const cacheKey = `${user.id}:${resource}:${action}:${JSON.stringify(context || {})}`
      
      // Check cache first
      const cached = get().getCacheEntry(cacheKey)
      if (cached) {
        get().incrementCacheHits()
        return cached
      }

      get().incrementCacheMisses()
      set({ isCheckingPermissions: true, error: null })

      try {
        const result = await PermissionService.hasPermission(user.id, resource, action, context)
        
        // Cache the result
        get().setCacheEntry(cacheKey, result, PERMISSION_CACHE_TTL)
        
        set({ isCheckingPermissions: false })
        return result

      } catch (error) {
        const errorResult: PermissionResult = { 
          allowed: false, 
          reason: `Permission check failed: ${error}` 
        }
        
        set({ 
          isCheckingPermissions: false, 
          error: error instanceof Error ? error.message : 'Permission check failed' 
        })
        
        return errorResult
      }
    },

    hasAnyPermission: async (permissions: Array<{resource: string, action: string}>, context?: PermissionContext): Promise<boolean> => {
      const user = useAuthStore.getState().user
      if (!user?.id) return false

      set({ isCheckingPermissions: true })

      try {
        const result = await PermissionService.hasAnyPermission(user.id, permissions, context)
        set({ isCheckingPermissions: false })
        return result.allowed
      } catch (error) {
        set({ isCheckingPermissions: false, error: error instanceof Error ? error.message : 'Permission check failed' })
        return false
      }
    },

    hasAllPermissions: async (permissions: Array<{resource: string, action: string}>, context?: PermissionContext): Promise<boolean> => {
      const user = useAuthStore.getState().user
      if (!user?.id) return false

      set({ isCheckingPermissions: true })

      try {
        const result = await PermissionService.hasAllPermissions(user.id, permissions, context)
        set({ isCheckingPermissions: false })
        return result.allowed
      } catch (error) {
        set({ isCheckingPermissions: false, error: error instanceof Error ? error.message : 'Permission check failed' })
        return false
      }
    },

    clearCache: () => {
      set({ 
        permissionCache: new Map(),
        cacheHits: 0,
        cacheMisses: 0 
      })
    },

    clearUserCache: (userId: string) => {
      const cache = get().permissionCache
      const newCache = new Map()
      
      for (const [key, value] of cache) {
        if (!key.startsWith(`${userId}:`)) {
          newCache.set(key, value)
        }
      }
      
      set({ permissionCache: newCache })
    },

    setCacheEntry: (key: string, result: PermissionResult, ttl: number = CACHE_TTL) => {
      const cache = new Map(get().permissionCache)
      cache.set(key, {
        result,
        timestamp: Date.now(),
        ttl
      })
      set({ permissionCache: cache })
    },

    getCacheEntry: (key: string): PermissionResult | null => {
      const cache = get().permissionCache
      const entry = cache.get(key)
      
      if (!entry) return null
      
      // Check if entry has expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        // Remove expired entry
        const newCache = new Map(cache)
        newCache.delete(key)
        set({ permissionCache: newCache })
        return null
      }
      
      return entry.result
    },

    loadUserPermissions: async (userId: string) => {
      set({ isCheckingPermissions: true, error: null })
      
      try {
        // Load user's direct permissions - ensure we always get an array
        let userPerms: string[] = []
        if (PermissionService.getUserPermissions) {
          const result = await PermissionService.getUserPermissions(userId)
          userPerms = Array.isArray(result) ? result : []
        }
        
        // Load role-based permissions - ensure we always get an array
        let rolePerms: string[] = []
        const user = useAuthStore.getState().user
        if (user?.role && PermissionService.getRolePermissions) {
          const result = await PermissionService.getRolePermissions(user.role)
          rolePerms = Array.isArray(result) ? result : []
        }
        
        // Combine all permissions
        const effective = [...new Set([...userPerms, ...rolePerms])]
        
        set({ 
          userPermissions: userPerms,
          rolePermissions: rolePerms,
          effectivePermissions: effective,
          isCheckingPermissions: false 
        })
        
      } catch (error) {
        set({ 
          isCheckingPermissions: false, 
          error: error instanceof Error ? error.message : 'Failed to load permissions' 
        })
      }
    },

    refreshPermissions: async () => {
      const user = useAuthStore.getState().user
      if (user?.id) {
        get().clearUserCache(user.id)
        await get().loadUserPermissions(user.id)
      }
    },

    setError: (error: string | null) => set({ error }),

    setCheckingPermissions: (isCheckingPermissions: boolean) => set({ isCheckingPermissions }),

    incrementCacheHits: () => set((state) => ({ cacheHits: state.cacheHits + 1 })),

    incrementCacheMisses: () => set((state) => ({ cacheMisses: state.cacheMisses + 1 })),

    getCacheStats: () => {
      const { cacheHits, cacheMisses } = get()
      const total = cacheHits + cacheMisses
      const hitRate = total > 0 ? (cacheHits / total) * 100 : 0
      return { hits: cacheHits, misses: cacheMisses, hitRate }
    }
  }))
)

// Selectors
export const usePermissions = () => usePermissionStore((state) => ({
  hasPermission: state.hasPermission,
  checkPermission: state.checkPermission,
  hasAnyPermission: state.hasAnyPermission,
  hasAllPermissions: state.hasAllPermissions,
  isCheckingPermissions: state.isCheckingPermissions,
  error: state.error
}))

export const usePermissionCache = () => usePermissionStore((state) => ({
  clearCache: state.clearCache,
  clearUserCache: state.clearUserCache,
  getCacheStats: state.getCacheStats,
  refreshPermissions: state.refreshPermissions
}))

export const useUserPermissions = () => usePermissionStore((state) => ({
  userPermissions: state.userPermissions,
  rolePermissions: state.rolePermissions,
  effectivePermissions: state.effectivePermissions,
  loadUserPermissions: state.loadUserPermissions
}))

// Auto-clear cache when user changes
if (typeof window !== 'undefined') {
  let previousUserId: string | null = null
  
  useAuthStore.subscribe((state) => {
    const currentUserId = state.user?.id || null
    
    if (currentUserId !== previousUserId) {
      // User changed - clear cache and reload permissions
      usePermissionStore.getState().clearCache()
      
      if (currentUserId) {
        usePermissionStore.getState().loadUserPermissions(currentUserId)
      }
      
      previousUserId = currentUserId
    }
  })
}

// Helper functions
export const withPermission = async (
  resource: string, 
  action: string, 
  callback: () => void | Promise<void>,
  context?: PermissionContext
) => {
  const hasPermission = usePermissionStore.getState().hasPermission
  const allowed = await hasPermission(resource, action, context)
  
  if (allowed) {
    await callback()
  } else {
    console.warn(`Permission denied: ${resource}:${action}`)
  }
}

export const requirePermission = (
  resource: string, 
  action: string, 
  context?: PermissionContext
) => {
  return usePermissionStore.getState().hasPermission(resource, action, context)
}