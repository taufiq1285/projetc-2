# HOOK USAGE PATTERNS

## 🎣 HOOK ARCHITECTURE

### **Hook Categories**
- **Authentication Hooks** - Auth state & actions
- **Permission Hooks** - RBAC & authorization
- **Data Hooks** - Database operations
- **UI Hooks** - Interface state & interactions
- **Utility Hooks** - Common patterns & helpers

### **Hook Hierarchy**
```
useAuth (existing) ──┐
                     ├── useAuthStore (new)
                     └── useAuthActions (new)

usePermissions (existing) ──┐
                            ├── usePermissionStore (new)
                            └── usePermissionCache (new)

useUser ──┐
          ├── useUserProfile (new)
          ├── useUserPreferences (new)
          └── useUserActions (new)
```

## 🔐 AUTHENTICATION HOOKS

### **1. useAuth (Existing Hook)**
```typescript
// Primary authentication hook - DO NOT MODIFY
import { useAuth } from '@/hooks/useAuth'

const LoginForm = () => {
  const { user, loading, error, login, logout } = useAuth()
  
  const handleLogin = async (email: string, password: string) => {
    await login(email, password)
  }
  
  if (loading) return <Spinner />
  if (error) return <Alert type="error">{error}</Alert>
  
  return user ? <Dashboard /> : <LoginFormUI onSubmit={handleLogin} />
}
```

### **2. useAuthStore (New Store Integration)**
```typescript
// Direct store access for advanced use cases
import { useAuthStore, useAuth, useAuthActions } from '@/store/authStore'

const AuthStatus = () => {
  // Use granular selectors
  const { isAuthenticated, isLoading } = useAuth()
  const { login, logout, checkSession } = useAuthActions()
  
  // Direct store access when needed
  const sessionExpiry = useAuthStore((state) => state.sessionExpiry)
  
  useEffect(() => {
    const checkSessionPeriodically = () => {
      setInterval(checkSession, 60000) // Every minute
    }
    
    if (isAuthenticated) {
      checkSessionPeriodically()
    }
  }, [isAuthenticated, checkSession])
  
  return (
    <div>
      Status: {isAuthenticated ? 'Logged In' : 'Logged Out'}
      {sessionExpiry && (
        <div>Session expires: {new Date(sessionExpiry).toLocaleString()}</div>
      )}
    </div>
  )
}
```

### **3. useAuthGuard (Pattern)**
```typescript
// Custom hook for auth protection
const useAuthGuard = (requiredRole?: UserRole) => {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    
    if (requiredRole && user?.role !== requiredRole) {
      navigate('/access-denied')
      return
    }
  }, [isAuthenticated, user, requiredRole, navigate])
  
  return {
    isAuthorized: isAuthenticated && (!requiredRole || user?.role === requiredRole),
    user,
    isLoading: false
  }
}

// Usage
const AdminPanel = () => {
  const { isAuthorized } = useAuthGuard('admin')
  
  if (!isAuthorized) return <Spinner />
  
  return <AdminDashboard />
}
```

## 🛡️ PERMISSION HOOKS

### **1. usePermissions (Existing Hook)**
```typescript
// Primary permission hook - DO NOT MODIFY
import { usePermissions } from '@/hooks/usePermissions'

const InventoryActions = ({ itemId }) => {
  const { hasPermission, isLoading } = usePermissions()
  const [canEdit, setCanEdit] = useState(false)
  const [canDelete, setCanDelete] = useState(false)
  
  useEffect(() => {
    const checkPermissions = async () => {
      const editAllowed = await hasPermission('inventory', 'update', { resource_id: itemId })
      const deleteAllowed = await hasPermission('inventory', 'delete', { resource_id: itemId })
      
      setCanEdit(editAllowed)
      setCanDelete(deleteAllowed)
    }
    
    checkPermissions()
  }, [hasPermission, itemId])
  
  if (isLoading) return <Spinner />
  
  return (
    <div>
      {canEdit && <Button onClick={handleEdit}>Edit</Button>}
      {canDelete && <Button onClick={handleDelete}>Delete</Button>}
    </div>
  )
}
```

### **2. usePermissionCheck (Existing Hook)**
```typescript
// Component-level permission checking - DO NOT MODIFY
import { usePermissionCheck } from '@/hooks/usePermissions'

const ConditionalButton = ({ resource, action, children, ...props }) => {
  const { allowed, loading } = usePermissionCheck(resource, action)
  
  if (loading) return <Skeleton className="h-8 w-20" />
  if (!allowed) return null
  
  return <Button {...props}>{children}</Button>
}

// Usage
<ConditionalButton resource="users" action="create">
  Add User
</ConditionalButton>
```

### **3. usePermissionCache (New Store Integration)**
```typescript
// Cache management for performance
import { usePermissionCache } from '@/store/permissionStore'

const PermissionDebugPanel = () => {
  const { getCacheStats, clearCache, refreshPermissions } = usePermissionCache()
  const stats = getCacheStats()
  
  return (
    <div className="p-4 border rounded">
      <h3>Permission Cache Stats</h3>
      <p>Cache Hits: {stats.hits}</p>
      <p>Cache Misses: {stats.misses}</p>
      <p>Hit Rate: {stats.hitRate.toFixed(2)}%</p>
      
      <div className="space-x-2 mt-4">
        <Button onClick={clearCache}>Clear Cache</Button>
        <Button onClick={refreshPermissions}>Refresh Permissions</Button>
      </div>
    </div>
  )
}
```

### **4. useRoleGuard (Pattern)**
```typescript
// Role-based access control hook
const useRoleGuard = (allowedRoles: UserRole[]) => {
  const { user } = useAuth()
  
  const hasRole = useMemo(() => {
    return user?.role && allowedRoles.includes(user.role)
  }, [user?.role, allowedRoles])
  
  const checkRole = useCallback((role: UserRole) => {
    return user?.role === role
  }, [user?.role])
  
  const hasAnyRole = useCallback((roles: UserRole[]) => {
    return user?.role && roles.includes(user.role)
  }, [user?.role])
  
  return {
    hasRole,
    checkRole,
    hasAnyRole,
    currentRole: user?.role,
    user
  }
}

// Usage
const LabSection = () => {
  const { hasRole } = useRoleGuard(['admin', 'laboran'])
  
  if (!hasRole) {
    return <AccessDenied />
  }
  
  return <LabManagement />
}
```

## 👤 USER PROFILE HOOKS

### **1. useUserProfile (New Store Integration)**
```typescript
import { useUserProfile, useUserActions } from '@/store/userStore'

const ProfileCard = () => {
  const { profile, isLoadingProfile, profileError } = useUserProfile()
  const { updateProfile } = useUserActions()
  
  const handleUpdateName = async (newName: string) => {
    const success = await updateProfile({ name: newName })
    if (success) {
      notify.success('Profile updated successfully')
    }
  }
  
  if (isLoadingProfile) return <ProfileSkeleton />
  if (profileError) return <Alert type="error">{profileError}</Alert>
  if (!profile) return <div>No profile data</div>
  
  return (
    <Card>
      <Avatar src={profile.avatar_url} alt={profile.name} />
      <h3>{profile.name}</h3>
      <p>{profile.email}</p>
      <Badge variant={profile.role}>{profile.role}</Badge>
      
      <Button onClick={() => handleUpdateName('New Name')}>
        Update Name
      </Button>
    </Card>
  )
}
```

### **2. useUserPreferences (New Store Integration)**
```typescript
import { useUserPreferences } from '@/store/userStore'

const SettingsPanel = () => {
  const { preferences, updatePreferences } = useUserPreferences()
  
  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updatePreferences({ theme })
  }
  
  const handleNotificationToggle = (type: keyof typeof preferences.notifications) => {
    updatePreferences({
      notifications: {
        ...preferences.notifications,
        [type]: !preferences.notifications[type]
      }
    })
  }
  
  return (
    <div className="space-y-4">
      <div>
        <label>Theme</label>
        <Select value={preferences.theme} onValueChange={handleThemeChange}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </Select>
      </div>
      
      <div>
        <label>
          <Checkbox 
            checked={preferences.notifications.email}
            onChange={() => handleNotificationToggle('email')}
          />
          Email Notifications
        </label>
      </div>
    </div>
  )
}
```

### **3. useUserDisplayInfo (Pattern)**
```typescript
// Derived user information hook
const useUserDisplayInfo = () => {
  const { profile } = useUserProfile()
  
  return useMemo(() => {
    if (!profile) return null
    
    return {
      displayName: profile.name || profile.email || 'Unknown User',
      initials: profile.name
        ?.split(' ')
        .map(word => word.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'U',
      avatar: profile.avatar_url,
      role: profile.role,
      roleLabel: {
        admin: 'Administrator',
        dosen: 'Lecturer',
        laboran: 'Lab Technician',
        mahasiswa: 'Student'
      }[profile.role] || profile.role,
      isActive: profile.is_active,
      lastSeen: profile.last_login ? 
        formatDistanceToNow(new Date(profile.last_login), { addSuffix: true }) : 
        'Never'
    }
  }, [profile])
}

// Usage
const UserAvatar = () => {
  const userInfo = useUserDisplayInfo()
  
  if (!userInfo) return <DefaultAvatar />
  
  return (
    <div className="flex items-center space-x-2">
      <Avatar 
        src={userInfo.avatar} 
        alt={userInfo.displayName}
        fallback={userInfo.initials}
      />
      <div>
        <p className="font-medium">{userInfo.displayName}</p>
        <p className="text-sm text-gray-500">{userInfo.roleLabel}</p>
      </div>
    </div>
  )
}
```

## 🎨 UI STATE HOOKS

### **1. useModal (New Store Integration)**
```typescript
import { useModal, showConfirmModal, showInfoModal } from '@/store/uiStore'

const DataTable = ({ items, onDelete }) => {
  const { openModal, closeModal } = useModal()
  
  const handleDelete = (item) => {
    const modalId = showConfirmModal(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"?`,
      async () => {
        await onDelete(item.id)
        notify.success('Item deleted successfully')
      }
    )
  }
  
  const handleDetails = (item) => {
    openModal({
      id: `details-${item.id}`,
      type: 'custom',
      title: 'Item Details',
      content: <ItemDetailsModal item={item} />,
      size: 'lg'
    })
  }
  
  return (
    <Table>
      {items.map(item => (
        <TableRow key={item.id}>
          <TableCell>{item.name}</TableCell>
          <TableCell>
            <Button onClick={() => handleDetails(item)}>View</Button>
            <Button variant="destructive" onClick={() => handleDelete(item)}>
              Delete
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </Table>
  )
}
```

### **2. useLoading (New Store Integration)**
```typescript
import { useLoading, withLoading } from '@/store/uiStore'

const DataManager = () => {
  const { globalLoading, addLoadingState, removeLoadingState } = useLoading()
  const [data, setData] = useState([])
  
  const fetchData = async () => {
    const operation = async () => {
      const response = await api.getData()
      setData(response.data)
      return response.data
    }
    
    // Use utility function for loading management
    await withLoading('fetch-data', operation, 'Loading data...')
  }
  
  const saveData = async (item) => {
    addLoadingState('save-item', { 
      message: 'Saving item...',
      progress: 0
    })
    
    try {
      // Simulate progress updates
      for (let i = 0; i <= 100; i += 20) {
        updateLoadingState('save-item', { progress: i })
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      await api.saveItem(item)
      notify.success('Item saved successfully')
      
    } finally {
      removeLoadingState('save-item')
    }
  }
  
  return (
    <div>
      {globalLoading && <GlobalSpinner />}
      <Button onClick={fetchData}>Load Data</Button>
      {/* Component content */}
    </div>
  )
}
```

### **3. useTheme (New Store Integration)**
```typescript
import { useTheme } from '@/store/uiStore'

const ThemeToggle = () => {
  const { theme, setTheme, toggleTheme } = useTheme()
  
  return (
    <Button 
      onClick={toggleTheme}
      variant="ghost"
      size="sm"
    >
      {theme === 'dark' ? (
        <SunIcon className="h-4 w-4" />
      ) : (
        <MoonIcon className="h-4 w-4" />
      )}
    </Button>
  )
}

const AppRoot = () => {
  const { theme } = useTheme()
  
  useEffect(() => {
    document.documentElement.className = theme
  }, [theme])
  
  return (
    <div className={`app-root theme-${theme}`}>
      {/* App content */}
    </div>
  )
}
```

## 🔔 NOTIFICATION HOOKS

### **1. useNotifications (New Store Integration)**
```typescript
import { useNotifications, useNotificationActions, notify } from '@/store/notificationStore'

const NotificationCenter = () => {
  const { notifications, unreadCount, isVisible } = useNotifications()
  const { markAsRead, clearNotification, toggleVisible } = useNotificationActions()
  
  return (
    <div className="relative">
      <Button onClick={toggleVisible} className="relative">
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2">
            {unreadCount}
          </Badge>
        )}
      </Button>
      
      {isVisible && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-white border rounded-lg shadow-lg">
          {notifications.length === 0 ? (
            <p className="p-4 text-gray-500">No notifications</p>
          ) : (
            notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={() => markAsRead(notification.id)}
                onClose={() => clearNotification(notification.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

// Usage throughout the app
const SaveButton = () => {
  const handleSave = async () => {
    try {
      await saveData()
      notify.success('Saved Successfully', 'Your changes have been saved.')
    } catch (error) {
      notify.error('Save Failed', error.message)
    }
  }
  
  return <Button onClick={handleSave}>Save</Button>
}
```

## 🔧 UTILITY HOOKS

### **1. useAsync (Pattern)**
```typescript
// Generic async operation hook
const useAsync = <T>(
  asyncFn: () => Promise<T>,
  dependencies: any[] = []
) => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await asyncFn()
      setData(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, dependencies)
  
  useEffect(() => {
    execute()
  }, [execute])
  
  return { data, loading, error, refetch: execute }
}

// Usage
const UserList = () => {
  const { data: users, loading, error, refetch } = useAsync(
    () => api.getUsers(),
    []
  )
  
  if (loading) return <Spinner />
  if (error) return <Alert type="error">{error}</Alert>
  
  return (
    <div>
      <Button onClick={refetch}>Refresh</Button>
      {users?.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  )
}
```

### **2. useDebounce (Pattern)**
```typescript
// Debounced value hook
const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])
  
  return debouncedValue
}

// Usage in search
const SearchInput = ({ onSearch }) => {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 500)
  
  useEffect(() => {
    if (debouncedQuery) {
      onSearch(debouncedQuery)
    }
  }, [debouncedQuery, onSearch])
  
  return (
    <Input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  )
}
```

### **3. useLocalStorage (Pattern)**
```typescript
// Local storage hook with type safety
const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })
  
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }
  
  return [storedValue, setValue]
}

// Usage
const UserDashboard = () => {
  const [dashboardLayout, setDashboardLayout] = useLocalStorage('dashboard-layout', 'grid')
  
  return (
    <div>
      <Button onClick={() => setDashboardLayout('list')}>List View</Button>
      <Button onClick={() => setDashboardLayout('grid')}>Grid View</Button>
      <DashboardContent layout={dashboardLayout} />
    </div>
  )
}
```

## 🎯 COMPONENT INTEGRATION PATTERNS

### **1. Compound Hook Pattern**
```typescript
// Combine multiple hooks for complex components
const useUserManagement = () => {
  const auth = useAuth()
  const permissions = usePermissions()
  const userProfile = useUserProfile()
  const notifications = useNotificationActions()
  
  const canManageUsers = permissions.hasPermission('users', 'manage')
  const canViewProfiles = permissions.hasPermission('users', 'read')
  
  const handleUserAction = async (action: string, userId: string) => {
    const hasPermission = await permissions.hasPermission('users', action)
    
    if (!hasPermission) {
      notifications.showError('Access Denied', 'You do not have permission to perform this action')
      return false
    }
    
    // Perform action
    return true
  }
  
  return {
    currentUser: auth.user,
    userProfile: userProfile.profile,
    canManageUsers,
    canViewProfiles,
    handleUserAction,
    isLoading: auth.loading || userProfile.isLoadingProfile,
    error: auth.error || userProfile.profileError
  }
}

// Usage
const UserManagementPage = () => {
  const {
    currentUser,
    canManageUsers,
    handleUserAction,
    isLoading,
    error
  } = useUserManagement()
  
  if (isLoading) return <PageSpinner />
  if (error) return <ErrorPage error={error} />
  if (!canManageUsers) return <AccessDenied />
  
  return <UserManagementUI onUserAction={handleUserAction} />
}
```

### **2. Hook Composition Pattern**
```typescript
// Compose hooks for feature-specific functionality
const useInventoryFeatures = () => {
  const permissions = usePermissions()
  const loading = useLoading()
  const notifications = useNotificationActions()
  
  const withInventoryPermission = async (
    action: string,
    operation: () => Promise<void>,
    resourceId?: string
  ) => {
    const hasPermission = await permissions.hasPermission('inventory', action, {
      resource_id: resourceId
    })
    
    if (!hasPermission) {
      notifications.showError('Access Denied', `You cannot ${action} inventory items`)
      return false
    }
    
    await withLoading(`inventory-${action}`, operation)
    return true
  }
  
  const createItem = (data: any) => withInventoryPermission(
    'create',
    () => api.createInventoryItem(data)
  )
  
  const updateItem = (id: string, data: any) => withInventoryPermission(
    'update',
    () => api.updateInventoryItem(id, data),
    id
  )
  
  const deleteItem = (id: string) => withInventoryPermission(
    'delete',
    () => api.deleteInventoryItem(id),
    id
  )
  
  return { createItem, updateItem, deleteItem }
}
```

## ✅ HOOK BEST PRACTICES

### **DO:**
- ✅ Use existing hooks (useAuth, usePermissions) without modification
- ✅ Create granular selectors to prevent unnecessary re-renders
- ✅ Implement proper error handling in custom hooks
- ✅ Use TypeScript for type safety
- ✅ Memoize expensive computations
- ✅ Clean up effects and subscriptions
- ✅ Follow naming conventions (use prefix)
- ✅ Compose hooks for complex functionality

### **DON'T:**
- ❌ Modify existing working hooks
- ❌ Create hooks that violate Rules of Hooks
- ❌ Put all logic in a single hook
- ❌ Ignore performance implications
- ❌ Skip error boundaries for hook errors
- ❌ Create circular dependencies between hooks
- ❌ Forget to handle loading states
- ❌ Use hooks conditionally

## 🧪 HOOK TESTING PATTERNS

### **1. Custom Hook Testing**
```typescript
import { renderHook, act } from '@testing-library/react'
import { useAsync } from '@/hooks/useAsync'

describe('useAsync', () => {
  it('should handle successful async operation', async () => {
    const mockAsyncFn = vi.fn().mockResolvedValue('success')
    
    const { result } = renderHook(() => useAsync(mockAsyncFn))
    
    expect(result.current.loading).toBe(true)
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    
    expect(result.current.loading).toBe(false)
    expect(result.current.data).toBe('success')
    expect(result.current.error).toBe(null)
  })
})
```

### **2. Hook Integration Testing**
```typescript
const TestComponent = () => {
  const auth = useAuth()
  const permissions = usePermissions()
  
  return (
    <div>
      <div data-testid="auth-status">
        {auth.isAuthenticated ? 'authenticated' : 'unauthenticated'}
      </div>
      <div data-testid="user-role">{auth.user?.role}</div>
    </div>
  )
}

describe('Hook Integration', () => {
  it('should work together correctly', () => {
    // Set up store state
    useAuthStore.setState({
      user: mockUser,
      isAuthenticated: true
    })
    
    render(<TestComponent />)
    
    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
    expect(screen.getByTestId('user-role')).toHaveTextContent('admin')
  })
})
```

## 📋 HOOK USAGE CHECKLIST

- [ ] Existing hooks (useAuth, usePermissions) preserved
- [ ] New store hooks implemented correctly
- [ ] Granular selectors prevent unnecessary re-renders
- [ ] Error handling implemented consistently
- [ ] Loading states managed properly
- [ ] TypeScript types are correct
- [ ] Performance optimizations in place
- [ ] Custom hooks follow Rules of Hooks
- [ ] Testing patterns established
- [ ] Documentation updated