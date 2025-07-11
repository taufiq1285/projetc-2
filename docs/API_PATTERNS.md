## 📝 API_PATTERNS.md Template

```markdown
# API PATTERNS & CONVENTIONS

## Supabase Integration Patterns

### Authentication
```typescript
// Pattern for auth operations
const authPattern = {
  login: async (credentials) => supabase.auth.signInWithPassword(credentials),
  logout: async () => supabase.auth.signOut(),
  getUser: () => supabase.auth.getUser()
}
Database Operations
typescript// CRUD Pattern
const crudPattern = {
  create: (table, data) => supabase.from(table).insert(data),
  read: (table, filters) => supabase.from(table).select('*').match(filters),
  update: (table, id, data) => supabase.from(table).update(data).eq('id', id),
  delete: (table, id) => supabase.from(table).delete().eq('id', id)
}
RBAC Patterns
typescript// Permission checking pattern
const rbacPattern = {
  hasPermission: (user, resource, action) => {
    return user.permissions.some(p => 
      p.resource === resource && p.actions.includes(action)
    )
  },
  hasRole: (user, role) => user.roles.includes(role),
  canAccess: (user, resource) => checkResourceAccess(user, resource)
}
File Upload Patterns
typescript// File handling pattern
const filePattern = {
  upload: async (file, bucket, path) => {
    return supabase.storage.from(bucket).upload(path, file)
  },
  download: async (bucket, path) => {
    return supabase.storage.from(bucket).download(path)
  }
}
Error Handling Patterns
typescript// Consistent error handling
const errorPattern = {
  handleSupabaseError: (error) => {
    if (error.code === 'PGRST301') return 'Unauthorized'
    if (error.code === '23505') return 'Duplicate entry'
    return error.message
  }
}
React Query Integration
typescript// Query pattern
const queryPattern = {
  useGet: (key, fetcher) => useQuery({ queryKey: key, queryFn: fetcher }),
  usePost: (mutationFn) => useMutation({ mutationFn }),
  useInvalidate: (key) => queryClient.invalidateQueries({ queryKey: key })
}

---