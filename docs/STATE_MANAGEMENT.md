# STATE MANAGEMENT PATTERNS

## 🏗️ ARCHITECTURE OVERVIEW

### **State Management Stack**
- **Zustand** - Primary state management (5 stores)
- **React Query v5** - Server state & caching
- **React Context** - Component-specific state
- **Local State** - Component-level useState/useReducer
- **Supabase** - Database state & real-time updates

### **Store Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Auth Store    │    │Permission Store │    │   User Store    │
│                 │◄──►│                 │◄──►│                 │
│ • User session  │    │ • RBAC state    │    │ • Profile data  │
│ • Login/logout  │    │ • Permissions   │    │ • Preferences   │
│ • Session check │    │ • Role cache    │    │ • Profile cache │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                        ▲                        ▲
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐
│    UI Store     │    │Notification     │
│                 │    │Store            │
│ • Theme/layout  │    │                 │
│ • Modals/loading│    │ • Alerts/toasts │
│ • Navigation    │    │ • Preferences   │
│ • Screen size   │    │ • History       │
└─────────────────┘    └─────────────────┘
```

## 📦 STORE PATTERNS

### **1. Store Structure Pattern**
```typescript
// Standard store structure
interface StoreState {
  // Data
  data: DataType[]
  currentItem: DataType | null
  
  // Loading states
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  
  // Error states
  error: string | null
  
  // Cache & metadata
  cache: Map<string, DataType>
  lastUpdate: number | null
}

interface StoreActions {
  // CRUD operations
  fetchData: () => Promise<void>
  createItem: (data: CreateData) => Promise<boolean>
  updateItem: (id: string, data: UpdateData) => Promise<boolean>
  deleteItem: (id: string) => Promise<boolean>
  
  // State setters
  setCurrentItem: (item: DataType | null) => void
  setError: (error: string | null) => void
  clearCache: () => void
  
  // Cache management
  getCachedItem: (id: string) => DataType | null
  setCachedItem: (item: DataType) => void
}
```

### **2. Persistence Pattern**
```typescript
// Persistent store with selective serialization
export const useDataStore = create<DataStore>()(
  persist(
    (set, get) => ({
      // Store implementation
    }),
    {
      name: 'akbid-data-storage',
      // Only persist specific fields
      partialize: (state) => ({
        preferences: state.preferences,
        cache: Array.from(state.cache.entries()),
        lastUpdate: state.lastUpdate
      }),
      // Handle Map serialization
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.cache)) {
          state.cache = new Map(state.cache)
        }
      }
    }
  )
)
```

### **3. Cross-Store Subscription Pattern**
```typescript
// Auto-sync between stores
useAuthStore.subscribe(
  (state) => state.user,
  (newUser, previousUser) => {
    if (newUser?.id !== previousUser?.id) {
      // User changed - clear related stores
      usePermissionStore.getState().clearCache()
      useUserStore.getState().clearUserData()
      
      if (newUser?.id) {
        // Load new user data
        usePermissionStore.getState().loadUserPermissions(newUser.id)
        useUserStore.getState().loadProfile(newUser.id)
      }
    }
  }
)
```

## 🎯 SELECTOR PATTERNS

### **1. Granular Selectors**
```typescript
// Specific selectors to prevent unnecessary re-renders
export const useAuthState = () => useAuthStore((state) => ({
  isAuthenticated: state.isAuthenticated,
  isLoading: state.isLoading
}))

export const useCurrentUser = () => useAuthStore((state) => state.user)

export const useAuthActions = () => useAuthStore((state) => ({
  login: state.login,
  logout: state.logout,
  refreshUser: state.refreshUser
}))
```

### **2. Computed Selectors**
```typescript
// Memoized computed values
export const useUserDisplayInfo = () => useUserStore((state) => 
  useMemo(() => {
    if (!state.profile) return null
    
    return {
      displayName: state.profile.name || state.profile.email,
      initials: state.profile.name
        ?.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase() || 'U',
      avatar: state.profile.avatar_url,
      role: state.profile.role
    }
  }, [state.profile])
)
```

### **3. Conditional Selectors**
```typescript
// Selectors with conditions
export const usePermissionState = (resource?: string, action?: string) => 
  usePermissionStore((state) => {
    if (!resource || !action) {
      return { 
        isLoading: state.isCheckingPermissions,
        error: state.error 
      }
    }
    
    const cacheKey = `${resource}:${action}`
    const cached = state.getCacheEntry(cacheKey)
    
    return {
      allowed: cached?.allowed,
      isLoading: state.loadingPermissions.has(cacheKey),
      error: state.error
    }
  })
```

## 🔄 ASYNC PATTERNS

### **1. Optimistic Updates**
```typescript
const updateProfile = async (updates: Partial<UserProfile>) => {
  const currentProfile = get().profile
  if (!currentProfile) return false
  
  // Optimistic update
  const optimisticProfile = { ...currentProfile, ...updates }
  set({ profile: optimisticProfile })
  
  try {
    const { data, error } = await dbService.update('users', currentProfile.id, updates)
    
    if (error) {
      // Revert on error
      set({ profile: currentProfile, error: error.message })
      return false
    }
    
    // Confirm update
    set({ profile: data, error: null })
    return true
    
  } catch (err) {
    // Revert on error
    set({ profile: currentProfile, error: 'Update failed' })
    return false
  }
}
```

### **2. Loading State Management**
```typescript
const withLoadingState = async <T>(
  operation: () => Promise<T>,
  loadingKey: keyof LoadingStates
): Promise<T> => {
  set({ [loadingKey]: true, error: null })
  
  try {
    const result = await operation()
    set({ [loadingKey]: false })
    return result
  } catch (error) {
    set({ 
      [loadingKey]: false, 
      error: error instanceof Error ? error.message : 'Operation failed' 
    })
    throw error
  }
}

// Usage
const fetchData = () => withLoadingState(
  () => dbService.getAll('users'),
  'isLoading'
)
```

### **3. Retry Pattern**
```typescript
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries) {
        throw lastError
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }
  
  throw lastError!
}
```

## 📡 REAL-TIME PATTERNS

### **1. Supabase Realtime Integration**
```typescript
const subscribeToChanges = (tableName: string) => {
  const channel = supabase
    .channel(`${tableName}_changes`)
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: tableName 
      },
      (payload) => {
        handleRealtimeUpdate(payload)
      }
    )
    .subscribe()
  
  return () => channel.unsubscribe()
}

const handleRealtimeUpdate = (payload: any) => {
  const { eventType, new: newRecord, old: oldRecord } = payload
  
  switch (eventType) {
    case 'INSERT':
      // Add new record to store
      addToCache(newRecord)
      break
    case 'UPDATE':
      // Update existing record
      updateInCache(newRecord)
      break
    case 'DELETE':
      // Remove from cache
      removeFromCache(oldRecord.id)
      break
  }
}
```

### **2. Store Synchronization**
```typescript
// Keep stores in sync with real-time updates
const syncStoresWithRealtime = () => {
  // User updates affect multiple stores
  supabase
    .channel('user_changes')
    .on('postgres_changes', { event: 'UPDATE', table: 'users' }, (payload) => {
      const updatedUser = payload.new
      
      // Update auth store if current user
      const currentUser = useAuthStore.getState().user
      if (currentUser?.id === updatedUser.id) {
        useAuthStore.getState().setUser({
          ...currentUser,
          ...updatedUser
        })
      }
      
      // Update user store
      useUserStore.getState().cacheProfile(updatedUser)
      
      // Clear permission cache for user
      usePermissionStore.getState().clearUserCache(updatedUser.id)
    })
    .subscribe()
}
```

## 🎨 UI STATE PATTERNS

### **1. Modal Management**
```typescript
// Centralized modal management
const openConfirmModal = (
  title: string,
  message: string,
  onConfirm: () => void
) => {
  const modalId = `confirm-${Date.now()}`
  
  useUIStore.getState().openModal({
    id: modalId,
    type: 'confirm',
    title,
    content: message,
    onConfirm: () => {
      onConfirm()
      useUIStore.getState().closeModal(modalId)
    },
    onCancel: () => {
      useUIStore.getState().closeModal(modalId)
    }
  })
}

// Usage in components
const handleDelete = () => {
  openConfirmModal(
    'Delete Item',
    'Are you sure you want to delete this item?',
    async () => {
      await deleteItem(item.id)
      notify.success('Item deleted successfully')
    }
  )
}
```

### **2. Loading Coordination**
```typescript
// Coordinate loading states across components
const useCoordinatedLoading = (operationId: string) => {
  const { addLoadingState, removeLoadingState, loadingStates } = useLoading()
  
  const startLoading = (message?: string) => {
    addLoadingState(operationId, { message })
  }
  
  const stopLoading = () => {
    removeLoadingState(operationId)
  }
  
  const isLoading = loadingStates.has(operationId)
  
  return { startLoading, stopLoading, isLoading }
}

// Usage
const SaveButton = () => {
  const { startLoading, stopLoading, isLoading } = useCoordinatedLoading('save-profile')
  
  const handleSave = async () => {
    startLoading('Saving profile...')
    try {
      await saveProfile()
      notify.success('Profile saved')
    } finally {
      stopLoading()
    }
  }
  
  return (
    <Button onClick={handleSave} disabled={isLoading}>
      {isLoading ? 'Saving...' : 'Save'}
    </Button>
  )
}
```

## 📊 PERFORMANCE PATTERNS

### **1. Memoization**
```typescript
// Memoize expensive computations
export const useUserStats = () => useUserStore((state) => 
  useMemo(() => {
    if (!state.profile) return null
    
    return {
      completedCourses: state.profile.course_assignments?.length || 0,
      labAssignments: state.profile.lab_assignments?.length || 0,
      lastActivity: state.profile.last_login ? 
        formatDistanceToNow(new Date(state.profile.last_login)) : 
        'Never'
    }
  }, [
    state.profile?.course_assignments,
    state.profile?.lab_assignments,
    state.profile?.last_login
  ])
)
```

### **2. Batch Updates**
```typescript
// Batch multiple state updates
const batchUpdateProfile = (updates: ProfileUpdate[]) => {
  const currentProfile = get().profile
  if (!currentProfile) return
  
  // Apply all updates in single state change
  const updatedProfile = updates.reduce(
    (profile, update) => ({ ...profile, ...update }),
    currentProfile
  )
  
  set({ profile: updatedProfile })
}
```

### **3. Selective Re-renders**
```typescript
// Prevent unnecessary re-renders
const UserCard = React.memo(() => {
  // Only re-render when specific fields change
  const userInfo = useUserStore(
    (state) => ({
      name: state.profile?.name,
      avatar: state.profile?.avatar_url,
      role: state.profile?.role
    }),
    shallow // Use shallow comparison
  )
  
  return <div>{/* User card content */}</div>
})
```

## 🧪 TESTING PATTERNS

### **1. Store Testing**
```typescript
// Test store actions
describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState(initialState)
  })
  
  it('should login successfully', async () => {
    const { login } = useAuthStore.getState()
    
    // Mock Supabase response
    vi.mocked(authService.signIn).mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null
    })
    
    const result = await login('test@example.com', 'password')
    
    expect(result.success).toBe(true)
    expect(useAuthStore.getState().user).toEqual(mockUser)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })
})
```

### **2. Component Testing with Stores**
```typescript
// Test components that use stores
const renderWithStores = (component: React.ReactElement) => {
  return render(
    <QueryClient client={queryClient}>
      {component}
    </QueryClient>
  )
}

describe('UserProfile', () => {
  it('should display user info', () => {
    // Set up store state
    useUserStore.setState({
      profile: mockProfile,
      isLoading: false,
      error: null
    })
    
    renderWithStores(<UserProfile />)
    
    expect(screen.getByText(mockProfile.name)).toBeInTheDocument()
  })
})
```

## ✅ BEST PRACTICES

### **DO:**
- ✅ Use granular selectors to prevent unnecessary re-renders
- ✅ Implement proper error boundaries for stores
- ✅ Use optimistic updates for better UX
- ✅ Cache frequently accessed data
- ✅ Implement retry logic for network operations
- ✅ Use TypeScript for type safety
- ✅ Persist only necessary data
- ✅ Clean up subscriptions properly

### **DON'T:**
- ❌ Put all state in a single large store
- ❌ Subscribe to entire store in components
- ❌ Forget to handle loading and error states
- ❌ Store sensitive data in persisted state
- ❌ Ignore performance implications of large state objects
- ❌ Skip error handling in async operations
- ❌ Create circular dependencies between stores

## 🔧 DEBUGGING PATTERNS

### **1. Store DevTools**
```typescript
// Enable Zustand devtools
export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Store implementation
      }),
      { name: 'auth-storage' }
    ),
    { name: 'AuthStore' }
  )
)
```

### **2. State Logging**
```typescript
// Log state changes in development
if (process.env.NODE_ENV === 'development') {
  useAuthStore.subscribe(
    (state) => state,
    (state, previousState) => {
      console.log('Auth state changed:', {
        previous: previousState,
        current: state
      })
    }
  )
}
```

### **3. Performance Monitoring**
```typescript
// Monitor store performance
const performanceLogger = (storeName: string) => (
  config: StateCreator<any>
) => (set: any, get: any, api: any) => {
  const start = performance.now()
  const result = config(
    (...args) => {
      console.log(`${storeName} set took:`, performance.now() - start, 'ms')
      return set(...args)
    },
    get,
    api
  )
  return result
}

export const useDataStore = create(
  performanceLogger('DataStore')(
    persist(
      (set, get) => ({
        // Store implementation
      }),
      { name: 'data-storage' }
    )
  )
)
```

## 📋 STORE INTEGRATION CHECKLIST

- [ ] All stores follow consistent patterns
- [ ] Cross-store subscriptions working
- [ ] Persistence configured correctly
- [ ] Error handling implemented
- [ ] Loading states managed
- [ ] Performance optimized
- [ ] Real-time updates working
- [ ] DevTools enabled
- [ ] Testing setup complete
- [ ] Documentation updated