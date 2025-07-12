// Export all existing types
export * from './auth'
export * from './user'
export * from './lab'
export * from './inventaris'
export * from './mataKuliah'
export * from './jadwal'
export * from './peminjaman'
export * from './presensi'
export * from './laporan'
export * from './api'
export * from './file'
export * from './audit'
export * from './common'
export * from './supabase'

// Export roles first (contains UserRole)
export * from './roles'

// Export permissions (UserRole will come from roles)
export type {
  PermissionAction,
  PermissionResource,
  Permission,
  UserPermission,
  RolePermission,
  PermissionContext,
  PermissionResult
} from './permissions'