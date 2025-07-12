# API PATTERNS & CONVENTIONS - DAY 3 COMPLETE UPDATE

## 🗄️ DATABASE SCHEMA OVERVIEW (14 Tables Created)

### **Core Authentication & RBAC (4 tables)**
```sql
users               -- User accounts with role-based access
permissions         -- Granular permission definitions  
role_permissions    -- Role-to-permission mapping
user_permissions    -- Direct user permission overrides
```

### **Lab & Academic Management (6 tables)**
```sql
lab_rooms           -- 9 laboratories + 1 depot (10 total)
mata_kuliah         -- Course definitions with lab assignments
jadwal_praktikum    -- Practice schedules and sessions
presensi           -- Student attendance tracking
materi_praktikum   -- Course materials and resources
penilaian          -- Student grading system
```

### **Inventory Management (2 tables)**
```sql
inventaris_alat     -- Equipment inventory with quantities
peminjaman_alat     -- Equipment loan requests and tracking
```

### **Student Academic (2 tables)**
```sql
laporan_mahasiswa   -- Student report submissions
audit_logs          -- System activity tracking
```

## 🔧 ESTABLISHED API PATTERNS

### **1. Supabase Client Configuration**
```typescript
// Environment-based configuration
const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)
```

### **2. Generic CRUD Pattern**
```typescript
// Standardized CRUD operations
const crudPattern = {
  create: (table, data) => dbService.create(table, data),
  read: (table, filters, options) => dbService.read(table, filters, options),
  update: (table, id, data) => dbService.update(table, id, data),
  delete: (table, id) => dbService.delete(table, id),
  getById: (table, id) => dbService.getById(table, id),
  exists: (table, filters) => dbService.exists(table, filters),
  count: (table, filters) => dbService.count(table, filters)
}

// Usage example
const { data: newUser, error } = await dbService.create('users', {
  email: 'student@example.com',
  name: 'New Student', 
  role: 'mahasiswa',
  student_id: 'STD001'
})
```

### **3. Business Logic Patterns**
```typescript
// Role-specific data access
const roleBasedAccess = {
  // Admin: Full access to all data
  admin: () => dbService.read('users', { is_active: true }),
  
  // Dosen: Own courses and enrolled students
  dosen: (dosenId) => akbidDb.courses.getByDosen(dosenId),
  
  // Laboran: Equipment and loan management
  laboran: (labId) => akbidDb.inventory.getByLab(labId),
  
  // Mahasiswa: Own data only
  mahasiswa: (studentId) => akbidDb.reports.getByStudent(studentId)
}

// Equipment management workflow
const equipmentWorkflow = {
  async requestLoan(data) {
    // 1. Check availability
    const { data: equipment } = await akbidDb.inventory.getById(data.inventaris_id)
    if (equipment.jumlah_tersedia < data.jumlah_dipinjam) {
      throw new Error('Not enough equipment available')
    }
    
    // 2. Create loan request
    const { data: loan } = await dbService.create('peminjaman_alat', {
      ...data,
      status: 'pending'
    })
    
    return loan
  },
  
  async approveLoan(loanId, laboranId) {
    return akbidDb.loans.approve(loanId, laboranId, 'Approved by laboran')
  }
}
```

### **4. Query Optimization Patterns**
```typescript
// Efficient data fetching with joins
const optimizedQueries = {
  // Get courses with related data in single query
  getCoursesWithDetails: () => supabase
    .from('mata_kuliah')
    .select(`
      id, kode, nama, sks, semester,
      users(name),
      lab_rooms(name, capacity),
      jadwal_praktikum(hari, jam_mulai, jam_selesai)
    `)
    .eq('is_active', true),
  
  // Get loans with equipment and user info
  getLoansWithDetails: () => supabase
    .from('peminjaman_alat')
    .select(`
      id, status, tanggal_pinjam, jumlah_dipinjam,
      inventaris_alat(nama_alat, kode_alat),
      users!peminjam_id(name, student_id),
      mata_kuliah(nama)
    `)
    .eq('status', 'pending')
}
```

## 🛡️ ROW LEVEL SECURITY (RLS) PATTERNS

### **Authentication-based Policies**
```sql
-- Users can only access their own data
CREATE POLICY "users_own_data" ON users
FOR SELECT USING (auth.uid() = id);

-- Role-based access control
CREATE POLICY "admin_full_access" ON users
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```

### **Resource-based Policies**
```sql
-- Dosen can see students in their courses
CREATE POLICY "dosen_see_enrolled_students" ON users
FOR SELECT USING (
  role = 'dosen' OR 
  (role = 'mahasiswa' AND id IN (
    SELECT DISTINCT mahasiswa_id FROM presensi p
    JOIN jadwal_praktikum j ON p.jadwal_id = j.id  
    WHERE j.dosen_id = auth.uid()
  ))
);

-- Laboran can manage equipment in assigned labs
CREATE POLICY "laboran_manage_inventory" ON inventaris_alat
FOR ALL USING (
  auth.jwt() ->> 'role' IN ('admin', 'laboran')
);

-- Students can only see their own reports
CREATE POLICY "student_own_reports" ON laporan_mahasiswa
FOR SELECT USING (mahasiswa_id = auth.uid());
```

## 🚨 ERROR HANDLING PATTERNS

### **Consistent Error Response Structure**
```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  code?: string
}

// Error mapping for common Supabase errors
const errorMap = {
  '23505': 'Data already exists (duplicate entry)',
  '23503': 'Referenced record not found',
  '42501': 'Insufficient permissions',
  'PGRST301': 'Access denied by RLS policy',
  '08006': 'Database connection failed'
}

// Standardized error handler
const handleSupabaseError = (error: any): string => {
  return errorMap[error.code] || error.message || 'Unknown error occurred'
}

// API wrapper with consistent error handling
const apiWrapper = async <T>(
  operation: () => Promise<{ data: T; error: any }>
): Promise<ApiResponse<T>> => {
  try {
    const { data, error } = await operation()
    
    if (error) {
      return {
        success: false,
        error: handleSupabaseError(error),
        code: error.code
      }
    }
    
    return {
      success: true,
      data,
      message: 'Operation successful'
    }
  } catch (error) {
    return {
      success: false,
      error: 'Unexpected error occurred',
      code: 'UNKNOWN_ERROR'
    }
  }
}
```

### **Validation Patterns**
```typescript
// Input validation with proper error messages
const validateLoanRequest = (data: any) => {
  const errors: string[] = []
  
  if (!data.inventaris_id) errors.push('Equipment ID is required')
  if (!data.keperluan) errors.push('Purpose is required')
  if (data.jumlah_dipinjam <= 0) errors.push('Quantity must be greater than 0')
  if (!data.tanggal_pinjam) errors.push('Loan date is required')
  if (!data.tanggal_kembali_rencana) errors.push('Return date is required')
  
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`)
  }
}

// Usage in API operations
const createLoanRequest = async (data: any) => {
  return apiWrapper(async () => {
    validateLoanRequest(data)
    return dbService.create('peminjaman_alat', data)
  })
}
```

## 📊 COMPLEX QUERY PATTERNS

### **Analytics & Reporting**
```typescript
// Lab utilization report
const getLabUtilization = async (startDate: string, endDate: string) => {
  const { data, error } = await supabase
    .from('jadwal_praktikum')
    .select(`
      lab_rooms(name, capacity),
      mata_kuliah(nama),
      hari,
      jam_mulai,
      jam_selesai,
      presensi(count)
    `)
    .gte('tanggal_mulai', startDate)
    .lte('tanggal_selesai', endDate)
    .eq('is_active', true)
  
  return { data, error }
}

// Equipment usage statistics
const getEquipmentStats = async () => {
  const { data, error } = await supabase
    .from('inventaris_alat')
    .select(`
      nama_alat,
      kategori,
      jumlah_total,
      jumlah_tersedia,
      jumlah_dipinjam,
      lab_rooms(name),
      peminjaman_alat(count)
    `)
  
  return { data, error }
}

// Student performance analytics
const getStudentPerformance = async (mahasiswa_id: string) => {
  const { data, error } = await supabase
    .from('penilaian')
    .select(`
      nilai_akhir,
      grade,
      semester,
      mata_kuliah(nama, sks),
      presensi(count),
      laporan_mahasiswa(count)
    `)
    .eq('mahasiswa_id', mahasiswa_id)
    .order('semester')
  
  return { data, error }
}
```

### **Search & Filter Patterns**
```typescript
// Multi-field search
const searchEquipment = async (searchTerm: string, filters: any = {}) => {
  let query = supabase
    .from('inventaris_alat')
    .select(`
      id, kode_alat, nama_alat, kategori, status,
      lab_rooms(name)
    `)
    .or(`nama_alat.ilike.%${searchTerm}%,kode_alat.ilike.%${searchTerm}%,kategori.ilike.%${searchTerm}%`)
  
  // Apply additional filters
  if (filters.lab_room_id) query = query.eq('lab_room_id', filters.lab_room_id)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.kategori) query = query.eq('kategori', filters.kategori)
  
  return query.order('nama_alat').limit(50)
}

// Advanced filtering with date ranges
const filterLoans = async (filters: {
  status?: string
  date_from?: string
  date_to?: string
  lab_id?: string
}) => {
  let query = supabase
    .from('peminjaman_alat')
    .select(`
      id, status, tanggal_pinjam, tanggal_kembali_rencana,
      inventaris_alat(nama_alat, lab_room_id),
      users(name, role)
    `)
  
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.date_from) query = query.gte('tanggal_pinjam', filters.date_from)
  if (filters.date_to) query = query.lte('tanggal_pinjam', filters.date_to)
  if (filters.lab_id) query = query.eq('inventaris_alat.lab_room_id', filters.lab_id)
  
  return query.order('tanggal_pinjam', { ascending: false })
}
```

## 🔄 REAL-TIME PATTERNS

### **Live Updates for Critical Operations**
```typescript
// Real-time inventory updates
const subscribeToInventoryChanges = (callback: (payload: any) => void) => {
  return supabase
    .channel('inventory_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'inventaris_alat' },
      (payload) => {
        console.log('Inventory changed:', payload)
        callback(payload)
      }
    )
    .subscribe()
}

// Real-time loan status updates
const subscribeToLoanUpdates = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('loan_updates')
    .on('postgres_changes',
      { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'peminjaman_alat',
        filter: `peminjam_id=eq.${userId}`
      },
      (payload) => {
        if (payload.new.status !== payload.old.status) {
          callback({
            type: 'status_change',
            loan_id: payload.new.id,
            old_status: payload.old.status,
            new_status: payload.new.status
          })
        }
      }
    )
    .subscribe()
}

// Real-time notifications
const subscribeToNotifications = (userId: string) => {
  return supabase
    .channel('user_notifications')
    .on('postgres_changes',
      {
        event: 'INSERT',
        schema: 'public', 
        table: 'audit_logs',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        // Show toast notification
        showNotification(payload.new.description)
      }
    )
    .subscribe()
}
```

## 🧪 TESTING PATTERNS

### **Database Test Utilities**
```typescript
// Connection health check
const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('lab_rooms')
      .select('count')
      .limit(1)
    
    return !error
  } catch {
    return false
  }
}

// Table accessibility test
const testTableAccess = async (tableName: string): Promise<boolean> => {
  try {
    const { count, error } = await dbService.count(tableName as any)
    return !error
  } catch {
    return false
  }
}

// CRUD operation test
const testCrudOperations = async (): Promise<boolean> => {
  try {
    // Test CREATE
    const { data: created, error: createError } = await dbService.create('lab_rooms', {
      name: 'Test Lab',
      code: 'TEST01',
      type: 'laboratory',
      capacity: 20
    })
    
    if (createError || !created) return false
    
    // Test READ
    const { data: read, error: readError } = await dbService.getById('lab_rooms', created.id)
    if (readError || !read) return false
    
    // Test UPDATE
    const { data: updated, error: updateError } = await dbService.update('lab_rooms', created.id, {
      capacity: 25
    })
    if (updateError || !updated) return false
    
    // Test DELETE
    const { data: deleted, error: deleteError } = await dbService.delete('lab_rooms', created.id)
    if (deleteError || !deleted) return false
    
    return true
  } catch {
    return false
  }
}
```

## 📚 DATABASE SCHEMA DECISIONS

### **Design Rationale**

**1. User Role Enum (`user_role`)**
```sql
CREATE TYPE user_role AS ENUM ('admin', 'dosen', 'laboran', 'mahasiswa');
```
- **Decision:** Fixed role hierarchy for RBAC implementation
- **Rationale:** Prevents typos, ensures data consistency, enables role-based policies

**2. Equipment Status Tracking**
```sql
jumlah_total INTEGER NOT NULL DEFAULT 1,
jumlah_tersedia INTEGER NOT NULL DEFAULT 1, 
jumlah_dipinjam INTEGER DEFAULT 0,
jumlah_maintenance INTEGER DEFAULT 0,
CONSTRAINT valid_jumlah CHECK (jumlah_tersedia + jumlah_dipinjam + jumlah_maintenance = jumlah_total)
```
- **Decision:** Separate columns for each equipment state
- **Rationale:** Real-time availability tracking, prevents double-booking, audit trail

**3. Audit Trail Implementation**
```sql
old_values JSONB,
new_values JSONB,
ip_address INET,
user_agent TEXT
```
- **Decision:** JSONB for flexible audit data storage
- **Rationale:** Complete change tracking, security compliance, debugging support

**4. Flexible Permission System**
```sql
permissions (resource, action)
role_permissions (role, permission_id)
user_permissions (user_id, permission_id, expires_at)
```
- **Decision:** Three-tier permission system
- **Rationale:** Role-based default + individual overrides + temporary permissions

## ✅ IMPLEMENTATION CHECKLIST

### **Database Setup** ✅
- [x] 14 tables created with proper relationships
- [x] RLS policies implemented for all tables
- [x] Seed data inserted (lab rooms, permissions)
- [x] Audit triggers configured

### **API Patterns** ✅
- [x] Generic CRUD operations established
- [x] Business logic patterns documented
- [x] Error handling standardized  
- [x] Real-time subscriptions configured

### **Testing Infrastructure** ✅
- [x] Connection tests implemented
- [x] CRUD operation tests ready
- [x] Table access verification
- [x] Health check utilities

## 🎯 READY FOR IMPLEMENTATION

**All API patterns established and documented!**
**Database schema complete with 14 tables!**
**Error handling and testing patterns ready!**

**Next:** Test first API call and commit changes according to roadmap.