import React, { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { canRoleAccess } from '@/types/roles'
import { LoadingState } from '@/components/common/LoadingState'
import { UnauthorizedPage } from '@/pages/shared/UnauthorizedPage'
import type { UserRole } from '@/types'

interface RoleGuardProps {
  requiredRole: UserRole
  children: ReactNode
  fallback?: ReactNode
  exact?: boolean // if true, only exact role allowed, no hierarchy
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  requiredRole,
  children,
  fallback,
  exact = false
}) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingState message="Checking role access..." />
  }

  if (!user) {
    return (
      <UnauthorizedPage 
        message="Authentication required"
        requiredPermissions={[`Role: ${requiredRole}`]}
      />
    )
  }

  // Handle case where user.role might be undefined
  if (!user.role) {
    return (
      <UnauthorizedPage 
        message="User role not assigned"
        requiredPermissions={[`Role: ${requiredRole}`]}
      />
    )
  }

  const hasAccess = exact 
    ? user.role === requiredRole
    : canRoleAccess(user.role, requiredRole)

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    return (
      <UnauthorizedPage 
        message={`This feature requires ${exact ? 'exactly' : 'at least'} ${requiredRole} role`}
        requiredPermissions={[`Role: ${requiredRole} ${exact ? '(exact)' : '(or higher)'}`]}
      />
    )
  }

  return <>{children}</>
}

// Multi-role guard
interface MultiRoleGuardProps {
  allowedRoles: UserRole[]
  children: ReactNode
  fallback?: ReactNode
}

export const MultiRoleGuard: React.FC<MultiRoleGuardProps> = ({
  allowedRoles,
  children,
  fallback
}) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingState message="Checking role access..." />
  }

  if (!user || !user.role || !allowedRoles.includes(user.role)) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    return (
      <UnauthorizedPage 
        message="Your role is not authorized for this feature"
        requiredPermissions={allowedRoles.map(role => `Role: ${role}`)}
      />
    )
  }

  return <>{children}</>
}