import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { PermissionService } from '@/lib/rbac/permissions'
import type { PermissionContext, PermissionResult } from '@/types'

export interface UsePermissionsReturn {
  hasPermission: (resource: string, action: string, context?: PermissionContext) => Promise<boolean>
  checkPermission: (resource: string, action: string, context?: PermissionContext) => Promise<PermissionResult>
  hasAnyPermission: (permissions: Array<{ resource: string; action: string }>, context?: PermissionContext) => Promise<boolean>
  hasAllPermissions: (permissions: Array<{ resource: string; action: string }>, context?: PermissionContext) => Promise<boolean>
  isLoading: boolean
  clearCache: () => void
}

export const usePermissions = (): UsePermissionsReturn => {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const hasPermission = useCallback(async (
    resource: string,
    action: string,
    context?: PermissionContext
  ): Promise<boolean> => {
    if (!user?.id) return false

    setIsLoading(true)
    try {
      const result = await PermissionService.hasPermission(user.id, resource, action, context)
      return result.allowed
    } catch (error) {
      console.error('Permission check error:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  const checkPermission = useCallback(async (
    resource: string,
    action: string,
    context?: PermissionContext
  ): Promise<PermissionResult> => {
    if (!user?.id) {
      return { allowed: false, reason: 'User not authenticated' }
    }

    setIsLoading(true)
    try {
      return await PermissionService.hasPermission(user.id, resource, action, context)
    } catch (error) {
      console.error('Permission check error:', error)
      return { allowed: false, reason: 'Permission check failed' }
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  const hasAnyPermission = useCallback(async (
    permissions: Array<{ resource: string; action: string }>,
    context?: PermissionContext
  ): Promise<boolean> => {
    if (!user?.id) return false

    setIsLoading(true)
    try {
      const result = await PermissionService.hasAnyPermission(user.id, permissions, context)
      return result.allowed
    } catch (error) {
      console.error('Permission check error:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  const hasAllPermissions = useCallback(async (
    permissions: Array<{ resource: string; action: string }>,
    context?: PermissionContext
  ): Promise<boolean> => {
    if (!user?.id) return false

    setIsLoading(true)
    try {
      const result = await PermissionService.hasAllPermissions(user.id, permissions, context)
      return result.allowed
    } catch (error) {
      console.error('Permission check error:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  const clearCache = useCallback(() => {
    if (user?.id) {
      PermissionService.clearCache(user.id)
    }
  }, [user?.id])

  return {
    hasPermission,
    checkPermission,
    hasAnyPermission,
    hasAllPermissions,
    isLoading,
    clearCache
  }
}

// Component-level permission hook
export const usePermissionCheck = (
  resource: string,
  action: string,
  context?: PermissionContext
) => {
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<PermissionResult | null>(null)
  const { checkPermission } = usePermissions()

  useEffect(() => {
    const checkPerm = async () => {
      setLoading(true)
      try {
        const permResult = await checkPermission(resource, action, context)
        setResult(permResult)
        setAllowed(permResult.allowed)
      } catch (error) {
        console.error('Permission check error:', error)
        setAllowed(false)
        setResult({ allowed: false, reason: 'Check failed' })
      } finally {
        setLoading(false)
      }
    }

    checkPerm()
  }, [resource, action, context, checkPermission])

  return { allowed, loading, result }
}