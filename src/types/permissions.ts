// Import UserRole instead of declaring it
import type { UserRole } from './roles'

// Core permission types
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export'
export type PermissionResource = 
  | 'users' | 'labs' | 'inventory' | 'loans' | 'courses' 
  | 'schedules' | 'reports' | 'grades' | 'attendance' | 'materials'

export interface Permission {
  id: string
  resource: PermissionResource
  action: PermissionAction
  description?: string
  created_at: string
}

export interface UserPermission {
  id: string
  user_id: string
  permission_id: string
  granted_by?: string
  granted_at: string
  expires_at?: string
}

export interface RolePermission {
  id: string
  role: UserRole
  permission_id: string
  created_at: string
}

// Permission checking context
export interface PermissionContext {
  user_id: string
  resource?: string
  resource_id?: string
  additional_context?: Record<string, any>
}

// Permission check result
export interface PermissionResult {
  allowed: boolean
  reason?: string
  required_permissions?: string[]
  context?: PermissionContext
}