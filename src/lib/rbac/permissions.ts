import { supabase } from '@/lib/supabase/client'
import { dbService } from '@/lib/supabase/database'
import type { 
  PermissionContext, 
  PermissionResult, 
  UserRole 
} from '@/types'
import { getRolePermissions } from '@/types/roles'

// User type interface for internal use
interface UserData {
  id: string
  role: UserRole
  email: string
  name: string
  is_active: boolean
}

export class PermissionService {
  // Cache for permissions to avoid repeated DB calls
  private static permissionCache = new Map<string, any[]>()
  private static userPermissionCache = new Map<string, string[]>()

  /**
   * Check if user has specific permission
   */
  static async hasPermission(
    userId: string,
    resource: string,
    action: string,
    context?: PermissionContext
  ): Promise<PermissionResult> {
    try {
      // Get user data with proper typing
      const { data: user, error: userError } = await dbService.getById('users', userId)
      if (userError || !user) {
        return { allowed: false, reason: 'User not found' }
      }

      // Type assertion to ensure user has role property
      const userData = user as unknown as UserData

      // Admin always has access
      if (userData.role === 'admin') {
        return { allowed: true, reason: 'Admin access' }
      }

      // Check role-based permissions
      const rolePermissions = getRolePermissions(userData.role)
      const requiredPermission = `${resource}:${action}`

      // Check if role has this permission
      if (rolePermissions.includes(requiredPermission) || rolePermissions.includes('*')) {
        // Additional context checks
        const contextCheck = await this.checkPermissionContext(userData, resource, action, context)
        return contextCheck
      }

      // Check direct user permissions
      const userPermissions = await this.getUserDirectPermissions(userId)
      if (userPermissions.includes(requiredPermission)) {
        const contextCheck = await this.checkPermissionContext(userData, resource, action, context)
        return contextCheck
      }

      return {
        allowed: false,
        reason: `Missing permission: ${requiredPermission}`,
        required_permissions: [requiredPermission]
      }

    } catch (error) {
      console.error('Permission check error:', error)
      return { allowed: false, reason: 'Permission check failed' }
    }
  }

  /**
   * Check context-specific permissions (ownership, lab assignment, etc.)
   */
  private static async checkPermissionContext(
    user: UserData,
    resource: string,
    _action: string,
    context?: PermissionContext
  ): Promise<PermissionResult> {
    // Ownership checks
    if (context?.resource_id) {
      const ownershipCheck = await this.checkOwnership(user, resource, context.resource_id)
      if (!ownershipCheck.allowed) {
        return ownershipCheck
      }
    }

    // Lab assignment checks for laboran
    if (user.role === 'laboran' && (resource === 'inventory' || resource === 'loans')) {
      const labCheck = await this.checkLabAccess(user.id, context)
      if (!labCheck.allowed) {
        return labCheck
      }
    }

    // Course enrollment checks for mahasiswa
    if (user.role === 'mahasiswa' && (resource === 'courses' || resource === 'grades')) {
      const enrollmentCheck = await this.checkCourseEnrollment(user.id, context)
      if (!enrollmentCheck.allowed) {
        return enrollmentCheck
      }
    }

    return { allowed: true, context }
  }

  /**
   * Check if user owns the resource
   */
  private static async checkOwnership(
    user: UserData,
    resource: string,
    resourceId: string
  ): Promise<PermissionResult> {
    try {
      // Define ownership field mapping
      const ownershipFields: Record<string, string> = {
        'reports': 'mahasiswa_id',
        'loans': 'peminjam_id',
        'grades': 'mahasiswa_id',
        'attendance': 'mahasiswa_id'
      }

      const ownerField = ownershipFields[resource]
      if (!ownerField) {
        return { allowed: true } // No ownership check needed
      }

      // Map resource to table name
      const tableMap: Record<string, string> = {
        'reports': 'laporan_mahasiswa',
        'loans': 'peminjaman_alat',
        'grades': 'penilaian',
        'attendance': 'presensi'
      }

      const tableName = tableMap[resource] || resource

      const { data: resourceData, error } = await dbService.getById(tableName as any, resourceId)
      if (error || !resourceData) {
        return { allowed: false, reason: 'Resource not found' }
      }

      const isOwner = (resourceData as any)[ownerField] === user.id
      return {
        allowed: isOwner,
        reason: isOwner ? 'Resource owner' : 'Not resource owner'
      }

    } catch (error) {
      return { allowed: false, reason: 'Ownership check failed' }
    }
  }

  /**
   * Check lab access for laboran
   */
  private static async checkLabAccess(
    _userId: string,
    _context?: PermissionContext
  ): Promise<PermissionResult> {
    // For now, allow all laboran to access all labs
    // In future, implement lab assignment system
    return { allowed: true, reason: 'Laboran lab access' }
  }

  /**
   * Check course enrollment for mahasiswa
   */
  private static async checkCourseEnrollment(
    userId: string,
    context?: PermissionContext
  ): Promise<PermissionResult> {
    if (!context?.additional_context?.course_id) {
      return { allowed: true } // No specific course check
    }

    try {
      // Check if student is enrolled in the course (via schedules/attendance)
      const { data: enrollment, error } = await supabase
        .from('presensi')
        .select('id')
        .eq('mahasiswa_id', userId)
        .limit(1)

      if (error) {
        return { allowed: false, reason: 'Enrollment check failed' }
      }

      return {
        allowed: enrollment && enrollment.length > 0,
        reason: enrollment?.length ? 'Student enrolled' : 'Student not enrolled'
      }
    } catch (error) {
      return { allowed: false, reason: 'Enrollment check failed' }
    }
  }

  /**
   * Get user's direct permissions (not role-based)
   */
  private static async getUserDirectPermissions(userId: string): Promise<string[]> {
    const cacheKey = `user_permissions_${userId}`
    
    if (this.userPermissionCache.has(cacheKey)) {
      return this.userPermissionCache.get(cacheKey)!
    }

    try {
      const { data: userPermissions, error } = await supabase
        .from('user_permissions')
        .select(`
          permissions(resource, action)
        `)
        .eq('user_id', userId)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)

      if (error || !userPermissions) {
        return []
      }

      const permissions = userPermissions
        .filter((up: any) => up.permissions)
        .map((up: any) => `${up.permissions.resource}:${up.permissions.action}`)

      // Cache for 5 minutes
      this.userPermissionCache.set(cacheKey, permissions)
      setTimeout(() => this.userPermissionCache.delete(cacheKey), 5 * 60 * 1000)

      return permissions
    } catch (error) {
      console.error('Error fetching user permissions:', error)
      return []
    }
  }

  /**
   * Check multiple permissions at once
   */
  static async hasAnyPermission(
    userId: string,
    permissions: Array<{ resource: string; action: string }>,
    context?: PermissionContext
  ): Promise<PermissionResult> {
    for (const perm of permissions) {
      const result = await this.hasPermission(userId, perm.resource, perm.action, context)
      if (result.allowed) {
        return result
      }
    }

    return {
      allowed: false,
      reason: 'None of the required permissions found',
      required_permissions: permissions.map(p => `${p.resource}:${p.action}`)
    }
  }

  /**
   * Check all permissions
   */
  static async hasAllPermissions(
    userId: string,
    permissions: Array<{ resource: string; action: string }>,
    context?: PermissionContext
  ): Promise<PermissionResult> {
    const results = await Promise.all(
      permissions.map(perm => this.hasPermission(userId, perm.resource, perm.action, context))
    )

    interface FailedPermission {
      result: PermissionResult
      permission: { resource: string; action: string }
    }

    const failedPermissions: FailedPermission[] = results
      .map((result, index) => ({ result, permission: permissions[index] }))
      .filter(({ result }) => !result.allowed)

    if (failedPermissions.length > 0) {
      return {
        allowed: false,
        reason: `Missing permissions: ${failedPermissions.map(fp => `${fp.permission.resource}:${fp.permission.action}`).join(', ')}`,
        required_permissions: failedPermissions.map(fp => `${fp.permission.resource}:${fp.permission.action}`)
      }
    }

    return { allowed: true, reason: 'All permissions granted' }
  }

  /**
   * Clear permission cache
   */
  static clearCache(userId?: string) {
    if (userId) {
      this.userPermissionCache.delete(`user_permissions_${userId}`)
    } else {
      this.userPermissionCache.clear()
      this.permissionCache.clear()
    }
  }
}

// Export convenience functions
export const hasPermission = PermissionService.hasPermission.bind(PermissionService)
export const hasAnyPermission = PermissionService.hasAnyPermission.bind(PermissionService)
export const hasAllPermissions = PermissionService.hasAllPermissions.bind(PermissionService)