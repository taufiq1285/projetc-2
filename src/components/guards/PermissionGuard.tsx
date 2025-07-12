import React, { ReactNode } from 'react'
import { usePermissionCheck, usePermissions } from '@/hooks/usePermissions'
import { LoadingState } from '@/components/common/LoadingState'
import { UnauthorizedPage } from '@/pages/shared/UnauthorizedPage'
import type { PermissionContext } from '@/types'

interface PermissionGuardProps {
  resource: string
  action: string
  context?: PermissionContext
  children: ReactNode
  fallback?: ReactNode
  showLoading?: boolean
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  resource,
  action,
  context,
  children,
  fallback,
  showLoading = true
}) => {
  const { allowed, loading, result } = usePermissionCheck(resource, action, context)

  if (loading && showLoading) {
    return <LoadingState message="Checking permissions..." />
  }

  if (!allowed) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    return (
      <UnauthorizedPage 
        message={result?.reason || 'You do not have permission to access this resource'}
        requiredPermissions={result?.required_permissions}
      />
    )
  }

  return <>{children}</>
}

// Multi-permission guard
interface MultiPermissionGuardProps {
  permissions: Array<{ resource: string; action: string }>
  mode: 'any' | 'all' // require any permission or all permissions
  context?: PermissionContext
  children: ReactNode
  fallback?: ReactNode
}

export const MultiPermissionGuard: React.FC<MultiPermissionGuardProps> = ({
  permissions,
  mode,
  context,
  children,
  fallback
}) => {
  const { hasAnyPermission, hasAllPermissions } = usePermissions()
  const [allowed, setAllowed] = React.useState<boolean | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
/*************  ✨ Windsurf Command ⭐  *************/
  /**
   * Check multiple permissions at once
   * @param mode - Require any permission or all permissions
   * @param permissions - Array of permissions to check
   * @param context - Additional context for permission check
   * @returns Promise that resolves to boolean indicating if all permissions are allowed
   */
/*******  93ee0a30-3594-446f-9b0d-f7285c30814d  *******/    const checkPermissions = async () => {
      setLoading(true)
      try {
        const result = mode === 'any' 
          ? await hasAnyPermission(permissions, context)
          : await hasAllPermissions(permissions, context)
        setAllowed(result)
      } catch (error) {
        console.error('Multi-permission check error:', error)
        setAllowed(false)
      } finally {
        setLoading(false)
      }
    }

    checkPermissions()
  }, [permissions, mode, context, hasAnyPermission, hasAllPermissions])

  if (loading) {
    return <LoadingState message="Checking permissions..." />
  }

  if (!allowed) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    return (
      <UnauthorizedPage 
        message={`You need ${mode === 'any' ? 'one of these' : 'all of these'} permissions to access this resource`}
        requiredPermissions={permissions.map(p => `${p.resource}:${p.action}`)}
      />
    )
  }

  return <>{children}</>
}