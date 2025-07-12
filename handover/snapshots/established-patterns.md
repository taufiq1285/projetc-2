markdown# ESTABLISHED PATTERNS - WEEK 1

## 🏗️ ARCHITECTURE PATTERNS

### **Project Structure**
src/
├── components/     # Reusable UI components
├── pages/         # Route-specific pages
├── hooks/         # Custom React hooks
├── store/         # Zustand state stores
├── lib/           # Utility libraries
├── types/         # TypeScript definitions
└── database/      # Supabase schemas

### **Naming Conventions**
- **Components:** PascalCase (`UserCard.tsx`)
- **Files:** camelCase (`userService.ts`)
- **Folders:** kebab-case (`user-management/`)
- **Constants:** UPPER_SNAKE_CASE (`API_ENDPOINTS`)

## 🎨 STYLING PATTERNS

### **Tailwind CSS 3 - Mobile First**
```typescript
// Responsive component example
const ResponsiveCard = () => (
  <div className="
    p-4 text-sm          // Mobile default
    md:p-6 md:text-base  // Tablet
    lg:p-8 lg:text-lg    // Desktop
    xl:p-10 xl:text-xl   // Large desktop
  ">
    Content
  </div>
)
Component Variants (CVA Pattern)
typescriptimport { cva } from "class-variance-authority"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
  }
)
🔄 STATE MANAGEMENT PATTERNS
Zustand Store Pattern
typescriptinterface StoreState {
  // State
  data: DataType[]
  loading: boolean
  error: string | null
  
  // Actions
  fetchData: () => Promise<void>
  updateItem: (id: string, data: Partial<DataType>) => Promise<void>
  clearError: () => void
}

export const useStore = create<StoreState>((set, get) => ({
  data: [],
  loading: false,
  error: null,
  
  fetchData: async () => {
    set({ loading: true, error: null })
    try {
      const data = await api.getData()
      set({ data, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },
  
  updateItem: async (id, updates) => {
    // Optimistic update
    const currentData = get().data
    set({ 
      data: currentData.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    })
    
    try {
      await api.updateItem(id, updates)
    } catch (error) {
      // Revert on error
      set({ data: currentData, error: error.message })
    }
  },
  
  clearError: () => set({ error: null })
}))
React Query Integration
typescript// Server state with React Query
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAll(),
    gcTime: 5 * 60 * 1000, // 5 minutes
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}
🔐 RBAC PATTERNS
Permission Checking
typescript// Hook-based permission checking
export const usePermissions = () => {
  const { permissions } = usePermissionStore()
  
  const hasPermission = useCallback((permission: string) => {
    return permissions.includes(permission)
  }, [permissions])
  
  const hasAnyPermission = useCallback((perms: string[]) => {
    return perms.some(perm => permissions.includes(perm))
  }, [permissions])
  
  return { hasPermission, hasAnyPermission }
}

// Component usage
const SecretButton = () => {
  const { hasPermission } = usePermissions()
  
  if (!hasPermission('admin:users:delete')) {
    return null
  }
  
  return <button>Delete User</button>
}
Route Protection
typescript// Route guard component
const ProtectedRoute = ({ 
  children, 
  permission, 
  role 
}: ProtectedRouteProps) => {
  const { hasPermission } = usePermissions()
  const { user } = useAuthStore()
  
  if (permission && !hasPermission(permission)) {
    return <AccessDenied />
  }
  
  if (role && user?.role !== role) {
    return <AccessDenied />
  }
  
  return children
}
🔌 API PATTERNS
Supabase Service Pattern
typescriptclass UserService {
  async getAll() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw new Error(error.message)
    return data
  }
  
  async create(userData: CreateUserData) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    return data
  }
  
  async update(id: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    return data
  }
}

export const userService = new UserService()
📱 PWA PATTERNS
Installation Logic
typescript// PWA install hook
export const usePWAInstall = () => {
  const [canInstall, setCanInstall] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setInstallPrompt(e)
      setCanInstall(true)
    }
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])
  
  const install = async () => {
    if (!installPrompt) return false
    
    installPrompt.prompt()
    const result = await installPrompt.userChoice
    
    if (result.outcome === 'accepted') {
      setCanInstall(false)
      setInstallPrompt(null)
    }
    
    return result.outcome === 'accepted'
  }
  
  return { canInstall, install }
}
🧪 TESTING PATTERNS
Component Testing
typescript// Component test pattern
describe('UserCard', () => {
  it('renders user information correctly', () => {
    const user = { id: '1', name: 'John Doe', email: 'john@example.com' }
    
    render(<UserCard user={user} />)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })
  
  it('handles delete action with proper permissions', async () => {
    const mockDelete = jest.fn()
    const user = { id: '1', name: 'John Doe' }
    
    // Mock permission hook
    jest.mocked(usePermissions).mockReturnValue({
      hasPermission: jest.fn().mockReturnValue(true)
    })
    
    render(<UserCard user={user} onDelete={mockDelete} />)
    
    await user.click(screen.getByRole('button', { name: /delete/i }))
    
    expect(mockDelete).toHaveBeenCalledWith('1')
  })
})
📊 ERROR HANDLING PATTERNS
Error Boundary Pattern
typescriptclass ErrorBoundary extends Component<PropsWithChildren, ErrorState> {
  constructor(props: PropsWithChildren) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  
  static getDerivedStateFromError(error: Error): ErrorState {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo)
    // Log to error reporting service
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }
    
    return this.props.children
  }
}
🔒 SECURITY PATTERNS
Environment Variables
typescript// Environment configuration
const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL!,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY!,
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || 'AKBID Lab System',
    environment: import.meta.env.MODE,
  }
} as const

// Type-safe environment access
if (!config.supabase.url || !config.supabase.anonKey) {
  throw new Error('Missing required environment variables')
}
Key Principles:

Mobile-First: All components responsive by default
Type-Safe: Strict TypeScript, no any types
Performance: Optimistic updates, efficient re-renders
Security: RBAC checks everywhere, RLS policies
Maintainable: Consistent patterns, clear abstractions


### 3. COMPLETED-FILES-LIST.txt
```text
WEEK 1 COMPLETED FILES - 47 FILES CREATED

📁 DOCUMENTATION (8 files)
✅ docs/PROJECT_STATE.md
✅ docs/COMPONENT_REGISTRY.md
✅ docs/API_PATTERNS.md
✅ docs/HANDOVER_TEMPLATE.md
✅ docs/DAILY_LOG.md
✅ FINAL DIRECTORY STRUCTURE.docx
✅ README.md
✅ .env.example

📁 PROJECT CONFIGURATION (7 files)
✅ package.json
✅ vite.config.ts
✅ tsconfig.json
✅ tailwind.config.js
✅ postcss.config.js
✅ .gitignore
✅ .env

📁 PWA FOUNDATION (6 files)
✅ public/manifest.json
✅ public/sw.js
✅ src/lib/pwa/install.ts
✅ src/lib/pwa/offline.ts
✅ src/lib/pwa/cache.ts
✅ src/lib/pwa/notifications.ts

📁 STATE MANAGEMENT (5 files)
✅ src/store/authStore.ts
✅ src/store/permissionStore.ts
✅ src/store/userStore.ts
✅ src/store/uiStore.ts
✅ src/store/notificationStore.ts

📁 DATABASE & API (7 files)
✅ src/lib/supabase.ts
✅ src/database/schema.sql
✅ src/database/seed.sql
✅ src/database/rls-policies.sql
✅ src/services/authService.ts
✅ src/services/userService.ts
✅ src/services/apiService.ts

📁 TYPESCRIPT DEFINITIONS (6 files)
✅ src/types/auth.ts
✅ src/types/user.ts
✅ src/types/database.ts
✅ src/types/api.ts
✅ src/types/rbac.ts
✅ src/types/pwa.ts

📁 UTILITIES & HOOKS (4 files)
✅ src/lib/utils.ts
✅ src/lib/constants.ts
✅ src/hooks/useAuth.ts
✅ src/hooks/usePermissions.ts

📁 SCRIPTS & AUTOMATION (4 files)
✅ scripts/daily-backup.sh
✅ scripts/state-update.sh
✅ handover/snapshots/known-issues.md
✅ .github/workflows/ci.yml

TOTAL: 47 FOUNDATION FILES COMPLETED
STATUS: READY FOR UI COMPONENT DEVELOPMENT
NEXT: Button, Input, Card, Modal, Alert components