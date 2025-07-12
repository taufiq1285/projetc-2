# AUTHENTICATION FLOW DOCUMENTATION

## 🔐 AUTHENTICATION ARCHITECTURE

### **Tech Stack Integration**
- **Supabase Auth** - Primary authentication provider
- **Zustand Store** - Client-side auth state management  
- **React Hooks** - Component-level auth integration
- **RLS Policies** - Database-level security
- **RBAC System** - Role-based access control

### **Authentication Flow Overview**
```
User Login → Supabase Auth → Auth Store → Permission Store → UI Updates
     ↓              ↓             ↓              ↓              ↓
 Credentials → JWT Session → User State → Load Permissions → Route Access
```

## 📋 AUTHENTICATION PATTERNS

### **1. Login Flow**
```typescript
// User initiates login
const handleLogin = async (email: string, password: string) => {
  // 1. Use auth store action
  const { success, error } = await login(email, password)
  
  if (success) {
    // 2. Auto-triggered by auth store:
    //    - User profile loads
    //    - Permissions load
    //    - UI updates
    //    - Route redirects
    navigate('/dashboard')
  } else {
    // 3. Handle error
    notify.error('Login Failed', error || 'Please check credentials')
  }
}
```

### **2. Session Management**
```typescript
// Auto-session restoration on app load
useEffect(() => {
  const checkSession = async () => {
    const isValid = await checkSession()
    if (!isValid) {
      // Session expired - redirect to login
      navigate('/login')
    }
  }
  
  checkSession()
}, [])

// Session expiry monitoring
useEffect(() => {
  const interval = setInterval(() => {
    checkSession()
  }, 60000) // Check every minute
  
  return () => clearInterval(interval)
}, [])
```

### **3. Protected Routes**
```typescript
// Route protection with auth + permissions
const ProtectedRoute = ({ children, requiredRole, requiredPermission }) => {
  const { isAuthenticated, user } = useAuth()
  const { hasPermission } = usePermissions()
  const [allowed, setAllowed] = useState(false)
  
  useEffect(() => {
    const checkAccess = async () => {
      if (!isAuthenticated) {
        setAllowed(false)
        return
      }
      
      if (requiredRole && user?.role !== requiredRole) {
        setAllowed(false)
        return
      }
      
      if (requiredPermission) {
        const permitted = await hasPermission(
          requiredPermission.resource, 
          requiredPermission.action
        )
        setAllowed(permitted)
        return
      }
      
      setAllowed(true)
    }
    
    checkAccess()
  }, [isAuthenticated, user, requiredRole, requiredPermission])
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }
  
  if (!allowed) {
    return <AccessDenied />
  }
  
  return children
}
```

## 🔄 STATE MANAGEMENT INTEGRATION

### **Auth Store → Permission Store Flow**
```typescript
// When user logs in, auth store triggers permission loading
useAuthStore.subscribe(
  (state) => state.user,
  (newUser) => {
    if (newUser?.id) {
      // Auto-load user permissions
      usePermissionStore.getState().loadUserPermissions(newUser.id)
      // Auto-load user profile
      useUserStore.getState().loadProfile(newUser.id)
    } else {
      // Clear all user data on logout
      usePermissionStore.getState().clearCache()
      useUserStore.getState().clearUserData()
    }
  }
)
```

### **Cross-Store Communication**
```typescript
// Permission checks use auth store data
const checkPermission = async (resource: string, action: string) => {
  const user = useAuthStore.getState().user
  if (!user?.id) {
    return { allowed: false, reason: 'User not authenticated' }
  }
  
  return await PermissionService.hasPermission(user.id, resource, action)
}

// Profile updates sync with auth store
const updateProfile = async (updates: Partial<UserProfile>) => {
  const success = await userStore.updateProfile(updates)
  
  if (success && updates.role) {
    // Update auth store with new role
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
}
```

## 🛡️ SECURITY PATTERNS

### **1. Token Management**
```typescript
// Automatic token refresh
const setupTokenRefresh = () => {
  const { data: authListener } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully')
      }
      
      if (event === 'SIGNED_OUT') {
        // Clear all stores
        useAuthStore.getState().clearAuth()
        usePermissionStore.getState().clearCache()
        useUserStore.getState().clearUserData()
      }
    }
  )
  
  return authListener
}
```

### **2. Permission Caching**
```typescript
// Efficient permission caching
const cachedPermissionCheck = async (resource: string, action: string) => {
  const cacheKey = `${user.id}:${resource}:${action}`
  
  // Check cache first
  const cached = getCacheEntry(cacheKey)
  if (cached) {
    return cached
  }
  
  // Fetch from server
  const result = await PermissionService.hasPermission(user.id, resource, action)
  
  // Cache with TTL
  setCacheEntry(cacheKey, result, 10 * 60 * 1000) // 10 minutes
  
  return result
}
```

### **3. RLS Integration**
```typescript
// Database queries automatically use RLS
const getUserData = async () => {
  // RLS policies ensure user only sees their own data
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .single()
  
  // No additional filtering needed - RLS handles it
  return { data, error }
}

// Permission-based queries
const getInventoryData = async () => {
  const hasPermission = await checkPermission('inventory', 'read')
  
  if (!hasPermission) {
    throw new Error('Insufficient permissions')
  }
  
  // RLS will further filter based on lab assignments
  const { data, error } = await supabase
    .from('inventaris_alat')
    .select('*')
  
  return { data, error }
}
```

## 🎯 COMPONENT USAGE PATTERNS

### **1. Hook-Based Auth Checks**
```typescript
// Simple auth check
const Dashboard = () => {
  const { isAuthenticated, user } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }
  
  return <div>Welcome, {user?.name}!</div>
}

// Permission-based rendering
const InventorySection = () => {
  const { allowed, loading } = usePermissionCheck('inventory', 'read')
  
  if (loading) return <Spinner />
  if (!allowed) return <AccessDenied />
  
  return <InventoryTable />
}
```

### **2. Role-Based Components**
```typescript
// Component visibility based on role
const AdminPanel = () => {
  const { user } = useAuth()
  
  if (user?.role !== 'admin') {
    return null
  }
  
  return <AdminDashboard />
}

// Multi-role access
const LabManagement = () => {
  const { user } = useAuth()
  const allowedRoles = ['admin', 'laboran']
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <AccessDenied />
  }
  
  return <LabDashboard />
}
```

### **3. Conditional Actions**
```typescript
// Action buttons based on permissions
const InventoryItem = ({ item }) => {
  const { hasPermission } = usePermissions()
  const [canEdit, setCanEdit] = useState(false)
  const [canDelete, setCanDelete] = useState(false)
  
  useEffect(() => {
    const checkPermissions = async () => {
      const editAllowed = await hasPermission('inventory', 'update')
      const deleteAllowed = await hasPermission('inventory', 'delete')
      
      setCanEdit(editAllowed)
      setCanDelete(deleteAllowed)
    }
    
    checkPermissions()
  }, [hasPermission])
  
  return (
    <div>
      <h3>{item.name}</h3>
      {canEdit && <Button onClick={handleEdit}>Edit</Button>}
      {canDelete && <Button onClick={handleDelete}>Delete</Button>}
    </div>
  )
}
```

## 📊 PERFORMANCE OPTIMIZATION

### **1. Permission Batching**
```typescript
// Batch permission checks for better performance
const checkMultiplePermissions = async (checks: PermissionCheck[]) => {
  const results = await Promise.all(
    checks.map(({ resource, action, context }) =>
      hasPermission(resource, action, context)
    )
  )
  
  return checks.map((check, index) => ({
    ...check,
    allowed: results[index]
  }))
}
```

### **2. Cache Optimization**
```typescript
// Smart cache invalidation
const invalidateUserCache = (userId: string) => {
  // Clear permission cache
  usePermissionStore.getState().clearUserCache(userId)
  
  // Clear profile cache
  useUserStore.getState().clearProfileCache()
  
  // Reload critical data
  usePermissionStore.getState().loadUserPermissions(userId)
  useUserStore.getState().loadProfile(userId)
}
```

### **3. Lazy Loading**
```typescript
// Lazy load permissions only when needed
const usePermissionOnDemand = (resource: string, action: string) => {
  const [result, setResult] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  
  const checkPermission = useCallback(async () => {
    if (result !== null) return result
    
    setLoading(true)
    const allowed = await hasPermission(resource, action)
    setResult(allowed)
    setLoading(false)
    
    return allowed
  }, [resource, action, result])
  
  return { result, loading, checkPermission }
}
```

## 🚨 ERROR HANDLING

### **1. Auth Errors**
```typescript
const handleAuthError = (error: any) => {
  switch (error.code) {
    case 'invalid_credentials':
      notify.error('Login Failed', 'Invalid email or password')
      break
    case 'email_not_confirmed':
      notify.warning('Email Verification', 'Please check your email for verification link')
      break
    case 'session_expired':
      notify.info('Session Expired', 'Please log in again')
      useAuthStore.getState().logout()
      break
    default:
      notify.error('Authentication Error', error.message || 'An error occurred')
  }
}
```

### **2. Permission Errors**
```typescript
const handlePermissionError = (error: any, resource: string, action: string) => {
  console.error(`Permission check failed: ${resource}:${action}`, error)
  
  // Fallback to deny access
  return { allowed: false, reason: 'Permission check failed' }
}
```

## ✅ BEST PRACTICES

### **DO:**
- ✅ Always check authentication before permission checks
- ✅ Use caching for frequent permission checks
- ✅ Implement proper error boundaries
- ✅ Clear sensitive data on logout
- ✅ Use RLS policies as the primary security layer
- ✅ Batch permission checks when possible
- ✅ Implement session expiry monitoring

### **DON'T:**
- ❌ Rely only on client-side auth checks
- ❌ Store sensitive data in local storage
- ❌ Skip permission checks for "admin" users
- ❌ Cache sensitive data too long
- ❌ Ignore auth state changes
- ❌ Block UI for permission checks
- ❌ Hardcode roles or permissions

## 🔄 INTEGRATION CHECKLIST

- [ ] Auth store connected to Supabase auth
- [ ] Permission store synced with auth changes
- [ ] User store loading profiles automatically
- [ ] Protected routes implemented
- [ ] Permission guards on components
- [ ] RLS policies active on all tables
- [ ] Session management working
- [ ] Error handling comprehensive
- [ ] Performance optimizations in place
- [ ] Cache invalidation working correctly