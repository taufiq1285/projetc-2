// Role hierarchy and definitions
export type UserRole = 'admin' | 'dosen' | 'laboran' | 'mahasiswa'

export interface RoleDefinition {
  role: UserRole
  level: number // Hierarchy level (admin=4, dosen=3, laboran=2, mahasiswa=1)
  description: string
  inherits_from?: UserRole[]
  default_permissions: string[]
}

export const ROLE_HIERARCHY: Record<UserRole, RoleDefinition> = {
  admin: {
    role: 'admin',
    level: 4,
    description: 'System administrator with full access',
    default_permissions: ['*'] // All permissions
  },
  dosen: {
    role: 'dosen',
    level: 3,
    description: 'Course instructor with teaching and grading access',
    default_permissions: [
      'courses:read', 'courses:update', 'courses:create',
      'schedules:create', 'schedules:read', 'schedules:update',
      'students:read', 'grades:create', 'grades:read', 'grades:update',
      'reports:read', 'reports:approve', 'materials:create', 'materials:read', 'materials:update'
    ]
  },
  laboran: {
    role: 'laboran',
    level: 2,
    description: 'Laboratory technician with equipment and inventory access',
    default_permissions: [
      'inventory:create', 'inventory:read', 'inventory:update', 'inventory:delete',
      'loans:read', 'loans:approve', 'loans:update',
      'labs:read', 'labs:update'
    ]
  },
  mahasiswa: {
    role: 'mahasiswa',
    level: 1,
    description: 'Student with limited access to own data',
    default_permissions: [
      'courses:read', 'schedules:read', 'grades:read',
      'reports:create', 'reports:read', 'attendance:read',
      'materials:read'
    ]
  }
}

// Role checking utilities
export const canRoleAccess = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return ROLE_HIERARCHY[userRole].level >= ROLE_HIERARCHY[requiredRole].level
}

export const getRolePermissions = (role: UserRole): string[] => {
  const roleDef = ROLE_HIERARCHY[role]
  if (roleDef.default_permissions.includes('*')) {
    return ['*'] // Admin has all permissions
  }
  return roleDef.default_permissions
}