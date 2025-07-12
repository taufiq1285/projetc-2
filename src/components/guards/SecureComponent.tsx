import React, { ReactNode } from 'react'
import { PermissionGuard } from '@/components/guards/PermissionGuard'
import { MultiRoleGuard, RoleGuard } from '@/components/guards/RoleGuard'
import type { UserRole, PermissionContext } from '@/types'

interface SecureComponentProps {
  // Permission-based security
  permission?: {
    resource: string
    action: string
    context?: PermissionContext
  }
  
  // Role-based security
  role?: {
    required: UserRole
    exact?: boolean
  }
  
  // Multiple roles
  roles?: UserRole[]
  
  children: ReactNode
  fallback?: ReactNode
  hideOnNoAccess?: boolean // if true, render nothing instead of unauthorized message
}

export const SecureComponent: React.FC<SecureComponentProps> = ({
  permission,
  role,
  roles,
  children,
  fallback,
  hideOnNoAccess = false
}) => {
  const noAccessFallback = hideOnNoAccess ? null : fallback

  // Permission-based guard
  if (permission) {
    return (
      <PermissionGuard
        resource={permission.resource}
        action={permission.action}
        context={permission.context}
        fallback={noAccessFallback}
        showLoading={!hideOnNoAccess}
      >
        {children}
      </PermissionGuard>
    )
  }

  // Single role guard
  if (role) {
    return (
      <RoleGuard
        requiredRole={role.required}
        exact={role.exact}
        fallback={noAccessFallback}
      >
        {children}
      </RoleGuard>
    )
  }

  // Multiple roles guard
  if (roles) {
    return (
      <MultiRoleGuard
        allowedRoles={roles}
        fallback={noAccessFallback}
      >
        {children}
      </MultiRoleGuard>
    )
  }

  // No security constraints
  return <>{children}</>
}

// Hook for conditional rendering based on permissions
export const useSecureRender = () => {
  const secureRender = (
    component: ReactNode,
    security: {
      permission?: { resource: string; action: string; context?: PermissionContext }
      role?: { required: UserRole; exact?: boolean }
      roles?: UserRole[]
    }
  ) => {
    return (
      <SecureComponent
        permission={security.permission}
        role={security.role}
        roles={security.roles}
        hideOnNoAccess={true}
      >
        {component}
      </SecureComponent>
    )
  }

  return { secureRender }
}