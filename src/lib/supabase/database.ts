import { supabase } from './client'

// Basic types for our operations
type TableName = 'users' | 'lab_rooms' | 'permissions' | 'role_permissions' | 'user_permissions' | 
                 'mata_kuliah' | 'jadwal_praktikum' | 'inventaris_alat' | 'peminjaman_alat' | 
                 'presensi' | 'materi_praktikum' | 'laporan_mahasiswa' | 'penilaian' | 'audit_logs'

// Interface for inventory equipment
interface InventarisAlat {
  id: string
  jumlah_total: number
  jumlah_tersedia: number
  jumlah_dipinjam: number
  jumlah_maintenance: number
  [key: string]: any
}

// Generic CRUD operations
export const dbService = {
  // Generic create
  async create(table: TableName, data: any) {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single()
    
    return { data: result, error }
  },

  // Generic read with filters
  async read(
    table: TableName,
    filters?: Record<string, any>,
    options?: {
      select?: string
      limit?: number
      offset?: number
      orderBy?: { column: string; ascending?: boolean }
    }
  ) {
    let query = supabase.from(table).select(options?.select || '*')
    
    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value)
        }
      })
    }
    
    // Apply ordering
    if (options?.orderBy) {
      query = query.order(options.orderBy.column, { 
        ascending: options.orderBy.ascending ?? true 
      })
    }
    
    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }
    
    const { data, error } = await query
    return { data, error }
  },

  // Generic update
  async update(table: TableName, id: string, data: any) {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    return { data: result, error }
  },

  // Generic delete
  async delete(table: TableName, id: string) {
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .select()
      .single()
    
    return { data, error }
  },

  // Get record by ID
  async getById(table: TableName, id: string, select?: string) {
    const { data, error } = await supabase
      .from(table)
      .select(select || '*')
      .eq('id', id)
      .single()
    
    return { data, error }
  },

  // Check if record exists
  async exists(table: TableName, filters: Record<string, any>) {
    const { data, error } = await supabase
      .from(table)
      .select('id')
      .match(filters)
      .limit(1)
    
    return { exists: data && data.length > 0, error }
  },

  // Count records
  async count(table: TableName, filters?: Record<string, any>) {
    let query = supabase.from(table).select('*', { count: 'exact', head: true })
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value)
        }
      })
    }
    
    const { count, error } = await query
    return { count, error }
  }
}

// Specific database operations for AKBID Lab System
export const akbidDb = {
  // Users operations
  users: {
    async getByRole(role: 'admin' | 'dosen' | 'laboran' | 'mahasiswa') {
      return dbService.read('users', { role, is_active: true }, {
        select: 'id, name, email, role, employee_id, student_id, department',
        orderBy: { column: 'name', ascending: true }
      })
    },
    
    async getByEmployeeId(employee_id: string) {
      return dbService.read('users', { employee_id }, {
        select: 'id, name, email, role, employee_id, department'
      })
    },
    
    async getByStudentId(student_id: string) {
      return dbService.read('users', { student_id }, {
        select: 'id, name, email, role, student_id, semester'
      })
    },

    async searchUsers(searchTerm: string) {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role')
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .eq('is_active', true)
        .limit(10)
      
      return { data, error }
    }
  },

  // Lab Rooms operations
  labs: {
    async getActive() {
      return dbService.read('lab_rooms', { is_active: true }, {
        orderBy: { column: 'code', ascending: true }
      })
    },
    
    async getByType(type: 'laboratory' | 'depot') {
      return dbService.read('lab_rooms', { type, is_active: true }, {
        orderBy: { column: 'name', ascending: true }
      })
    },

    async getLabsWithCapacity() {
      const { data, error } = await supabase
        .from('lab_rooms')
        .select('id, name, code, capacity, type, location')
        .eq('is_active', true)
        .eq('type', 'laboratory')
        .order('code')
      
      return { data, error }
    }
  },

  // Inventory operations
  inventory: {
    async getByLab(lab_room_id: string) {
      return dbService.read('inventaris_alat', { lab_room_id }, {
        select: 'id, kode_alat, nama_alat, kategori, status, jumlah_total, jumlah_tersedia',
        orderBy: { column: 'nama_alat', ascending: true }
      })
    },
    
    async getAvailable(lab_room_id?: string) {
      const filters: any = { status: 'available' }
      if (lab_room_id) filters.lab_room_id = lab_room_id
      
      return dbService.read('inventaris_alat', filters, {
        select: 'id, kode_alat, nama_alat, jumlah_tersedia, lab_rooms(name)',
        orderBy: { column: 'nama_alat', ascending: true }
      })
    },
    
    async updateQuantity(id: string, quantities: {
      jumlah_tersedia?: number
      jumlah_dipinjam?: number
      jumlah_maintenance?: number
    }) {
      try {
        // Get current equipment data with proper error handling
        const { data: current, error: fetchError } = await dbService.getById('inventaris_alat', id)
        
        if (fetchError) {
          throw new Error(`Failed to fetch equipment: ${fetchError.message}`)
        }
        
        if (!current) {
          throw new Error('Equipment not found')
        }
        
        // Type guard: Ensure current is the actual data object, not an error
        if (typeof current !== 'object' || !current || 'message' in current) {
          throw new Error('Invalid equipment data received')
        }
        
        // Type assertion to help TypeScript understand the structure
        const equipment = current as InventarisAlat
        
        // Ensure current data has required properties with proper type checking
        if (typeof equipment.jumlah_total !== 'number' || 
            typeof equipment.jumlah_tersedia !== 'number' || 
            typeof equipment.jumlah_dipinjam !== 'number' || 
            typeof equipment.jumlah_maintenance !== 'number') {
          throw new Error('Invalid equipment data structure - missing or invalid quantity fields')
        }
        
        const updatedQuantities = {
          jumlah_tersedia: quantities.jumlah_tersedia ?? equipment.jumlah_tersedia,
          jumlah_dipinjam: quantities.jumlah_dipinjam ?? equipment.jumlah_dipinjam,
          jumlah_maintenance: quantities.jumlah_maintenance ?? equipment.jumlah_maintenance
        }
        
        const total = updatedQuantities.jumlah_tersedia + 
                     updatedQuantities.jumlah_dipinjam + 
                     updatedQuantities.jumlah_maintenance
        
        if (total !== equipment.jumlah_total) {
          throw new Error(`Quantities must add up to total quantity (${equipment.jumlah_total})`)
        }
        
        return dbService.update('inventaris_alat', id, {
          ...updatedQuantities,
          updated_at: new Date().toISOString()
        })
        
      } catch (error) {
        return { 
          data: null, 
          error: { 
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            code: 'QUANTITY_UPDATE_ERROR'
          } 
        }
      }
    },

    async searchEquipment(searchTerm: string, lab_room_id?: string) {
      let query = supabase
        .from('inventaris_alat')
        .select('id, kode_alat, nama_alat, kategori, status, lab_rooms(name)')
        .or(`nama_alat.ilike.%${searchTerm}%,kode_alat.ilike.%${searchTerm}%`)
        .limit(20)
      
      if (lab_room_id) {
        query = query.eq('lab_room_id', lab_room_id)
      }
      
      const { data, error } = await query
      return { data, error }
    }
  },

  // Loans operations
  loans: {
    async getByUser(peminjam_id: string) {
      return dbService.read('peminjaman_alat', { peminjam_id }, {
        select: `
          id, status, tanggal_pinjam, tanggal_kembali_rencana, jumlah_dipinjam,
          inventaris_alat(nama_alat, kode_alat),
          users!peminjam_id(name),
          mata_kuliah(nama)
        `,
        orderBy: { column: 'created_at', ascending: false }
      })
    },
    
    async getByStatus(status: 'pending' | 'approved' | 'rejected' | 'returned' | 'overdue') {
      return dbService.read('peminjaman_alat', { status }, {
        select: `
          id, tanggal_pinjam, tanggal_kembali_rencana, jumlah_dipinjam,
          inventaris_alat(nama_alat, kode_alat),
          users!peminjam_id(name, student_id, employee_id),
          mata_kuliah(nama)
        `,
        orderBy: { column: 'created_at', ascending: false }
      })
    },
    
    async approve(id: string, laboran_id: string, catatan?: string) {
      return dbService.update('peminjaman_alat', id, {
        status: 'approved',
        disetujui_oleh: laboran_id,
        tanggal_persetujuan: new Date().toISOString(),
        catatan_persetujuan: catatan
      })
    },

    async reject(id: string, laboran_id: string, alasan: string) {
      return dbService.update('peminjaman_alat', id, {
        status: 'rejected',
        disetujui_oleh: laboran_id,
        tanggal_persetujuan: new Date().toISOString(),
        catatan_persetujuan: alasan
      })
    },

    async returnLoan(id: string, kondisi: string, catatan?: string) {
      return dbService.update('peminjaman_alat', id, {
        status: 'returned',
        tanggal_kembali_aktual: new Date().toISOString(),
        kondisi_saat_kembali: kondisi,
        catatan_pengembalian: catatan
      })
    }
  },

  // Courses operations
  courses: {
    async getByDosen(dosen_id: string) {
      return dbService.read('mata_kuliah', { dosen_id, is_active: true }, {
        select: 'id, kode, nama, sks, semester, lab_rooms(name)',
        orderBy: { column: 'semester', ascending: true }
      })
    },
    
    async getBySemester(semester: number) {
      return dbService.read('mata_kuliah', { semester, is_active: true }, {
        select: 'id, kode, nama, sks, users(name), lab_rooms(name)',
        orderBy: { column: 'kode', ascending: true }
      })
    },

    async getActiveCoursesWithSchedules() {
      const { data, error } = await supabase
        .from('mata_kuliah')
        .select(`
          id, kode, nama, sks, semester,
          users(name),
          lab_rooms(name),
          jadwal_praktikum(hari, jam_mulai, jam_selesai)
        `)
        .eq('is_active', true)
        .order('semester')
      
      return { data, error }
    }
  },

  // Schedules operations
  schedules: {
    async getByMataKuliah(mata_kuliah_id: string) {
      return dbService.read('jadwal_praktikum', { mata_kuliah_id, is_active: true }, {
        select: `
          id, hari, jam_mulai, jam_selesai, pertemuan_ke, topik,
          mata_kuliah(nama),
          lab_rooms(name),
          users(name)
        `,
        orderBy: { column: 'pertemuan_ke', ascending: true }
      })
    },
    
    async getByLab(lab_room_id: string) {
      return dbService.read('jadwal_praktikum', { lab_room_id, is_active: true }, {
        select: `
          id, hari, jam_mulai, jam_selesai, pertemuan_ke,
          mata_kuliah(nama, kode),
          users(name)
        `,
        orderBy: { column: 'hari', ascending: true }
      })
    },

    async getWeeklySchedule(lab_room_id?: string) {
      let query = supabase
        .from('jadwal_praktikum')
        .select(`
          id, hari, jam_mulai, jam_selesai,
          mata_kuliah(nama, kode),
          lab_rooms(name, code),
          users(name)
        `)
        .eq('is_active', true)
        .order('hari')
        .order('jam_mulai')
      
      if (lab_room_id) {
        query = query.eq('lab_room_id', lab_room_id)
      }
      
      const { data, error } = await query
      return { data, error }
    }
  },

  // Reports operations
  reports: {
    async getByStudent(mahasiswa_id: string) {
      return dbService.read('laporan_mahasiswa', { mahasiswa_id }, {
        select: `
          id, judul, status, tanggal_submit,
          mata_kuliah(nama, kode),
          materi_praktikum(judul)
        `,
        orderBy: { column: 'created_at', ascending: false }
      })
    },

    async getByMataKuliah(mata_kuliah_id: string) {
      return dbService.read('laporan_mahasiswa', { mata_kuliah_id }, {
        select: `
          id, judul, status, tanggal_submit,
          users(name, student_id),
          materi_praktikum(judul)
        `,
        orderBy: { column: 'tanggal_submit', ascending: false }
      })
    },

    async getPendingReviews(dosen_id: string) {
      const { data, error } = await supabase
        .from('laporan_mahasiswa')
        .select(`
          id, judul, tanggal_submit,
          users(name, student_id),
          mata_kuliah!inner(nama, dosen_id)
        `)
        .eq('status', 'submitted')
        .eq('mata_kuliah.dosen_id', dosen_id)
        .order('tanggal_submit')
      
      return { data, error }
    }
  },

  // Attendance operations
  attendance: {
    async getBySchedule(jadwal_id: string, tanggal?: string) {
      const filters: any = { jadwal_id }
      if (tanggal) filters.tanggal_praktikum = tanggal
      
      return dbService.read('presensi', filters, {
        select: `
          id, tanggal_praktikum, jam_masuk, jam_keluar, status_kehadiran,
          users(name, student_id)
        `,
        orderBy: { column: 'tanggal_praktikum', ascending: false }
      })
    },

    async getByStudent(mahasiswa_id: string) {
      return dbService.read('presensi', { mahasiswa_id }, {
        select: `
          id, tanggal_praktikum, status_kehadiran,
          jadwal_praktikum(mata_kuliah(nama))
        `,
        orderBy: { column: 'tanggal_praktikum', ascending: false }
      })
    },

    async markAttendance(data: {
      jadwal_id: string
      mahasiswa_id: string
      tanggal_praktikum: string
      status_kehadiran: string
      verified_by: string
    }) {
      return dbService.create('presensi', {
        ...data,
        jam_masuk: new Date().toTimeString().slice(0, 8),
        verification_method: 'manual'
      })
    }
  }
}

// Export default dbService and named export akbidDb
export default dbService