// Basic Supabase Database Types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'admin' | 'dosen' | 'laboran' | 'mahasiswa'
          avatar_url?: string
          phone?: string
          address?: string
          is_active: boolean
          created_at: string
          updated_at: string
          employee_id?: string
          student_id?: string
          department?: string
          semester?: number
        }
        Insert: {
          id?: string
          email: string
          name: string
          role?: 'admin' | 'dosen' | 'laboran' | 'mahasiswa'
          avatar_url?: string
          phone?: string
          address?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          employee_id?: string
          student_id?: string
          department?: string
          semester?: number
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'admin' | 'dosen' | 'laboran' | 'mahasiswa'
          avatar_url?: string
          phone?: string
          address?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          employee_id?: string
          student_id?: string
          department?: string
          semester?: number
        }
      }
      lab_rooms: {
        Row: {
          id: string
          name: string
          code: string
          type: 'laboratory' | 'depot'
          capacity: number
          description?: string
          location?: string
          facilities?: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          type: 'laboratory' | 'depot'
          capacity?: number
          description?: string
          location?: string
          facilities?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          type?: 'laboratory' | 'depot'
          capacity?: number
          description?: string
          location?: string
          facilities?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      permissions: {
        Row: {
          id: string
          resource: string
          action: 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export'
          description?: string
          created_at: string
        }
        Insert: {
          id?: string
          resource: string
          action: 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export'
          description?: string
          created_at?: string
        }
        Update: {
          id?: string
          resource?: string
          action?: 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export'
          description?: string
          created_at?: string
        }
      }
      role_permissions: {
        Row: {
          id: string
          role: 'admin' | 'dosen' | 'laboran' | 'mahasiswa'
          permission_id: string
          created_at: string
        }
        Insert: {
          id?: string
          role: 'admin' | 'dosen' | 'laboran' | 'mahasiswa'
          permission_id: string
          created_at?: string
        }
        Update: {
          id?: string
          role?: 'admin' | 'dosen' | 'laboran' | 'mahasiswa'
          permission_id?: string
          created_at?: string
        }
      }
      user_permissions: {
        Row: {
          id: string
          user_id: string
          permission_id: string
          granted_by?: string
          granted_at: string
          expires_at?: string
        }
        Insert: {
          id?: string
          user_id: string
          permission_id: string
          granted_by?: string
          granted_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          permission_id?: string
          granted_by?: string
          granted_at?: string
          expires_at?: string
        }
      }
      mata_kuliah: {
        Row: {
          id: string
          kode: string
          nama: string
          sks: number
          semester: number
          deskripsi?: string
          tujuan_pembelajaran?: string[]
          dosen_id?: string
          lab_room_id?: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          kode: string
          nama: string
          sks?: number
          semester: number
          deskripsi?: string
          tujuan_pembelajaran?: string[]
          dosen_id?: string
          lab_room_id?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          kode?: string
          nama?: string
          sks?: number
          semester?: number
          deskripsi?: string
          tujuan_pembelajaran?: string[]
          dosen_id?: string
          lab_room_id?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      jadwal_praktikum: {
        Row: {
          id: string
          mata_kuliah_id: string
          lab_room_id?: string
          dosen_id?: string
          hari: string
          jam_mulai: string
          jam_selesai: string
          tanggal_mulai: string
          tanggal_selesai: string
          pertemuan_ke: number
          topik?: string
          materi?: string
          kapasitas: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          mata_kuliah_id: string
          lab_room_id?: string
          dosen_id?: string
          hari: string
          jam_mulai: string
          jam_selesai: string
          tanggal_mulai: string
          tanggal_selesai: string
          pertemuan_ke?: number
          topik?: string
          materi?: string
          kapasitas?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          mata_kuliah_id?: string
          lab_room_id?: string
          dosen_id?: string
          hari?: string
          jam_mulai?: string
          jam_selesai?: string
          tanggal_mulai?: string
          tanggal_selesai?: string
          pertemuan_ke?: number
          topik?: string
          materi?: string
          kapasitas?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      inventaris_alat: {
        Row: {
          id: string
          kode_alat: string
          nama_alat: string
          kategori: string
          merk?: string
          model?: string
          spesifikasi?: string
          lab_room_id?: string
          lokasi_detail?: string
          status: 'available' | 'in_use' | 'maintenance' | 'broken' | 'retired'
          kondisi: string
          jumlah_total: number
          jumlah_tersedia: number
          jumlah_dipinjam: number
          jumlah_maintenance: number
          tanggal_pembelian?: string
          harga_satuan?: number
          supplier?: string
          garansi_sampai?: string
          terakhir_maintenance?: string
          jadwal_maintenance_berikutnya?: string
          foto_url?: string
          manual_url?: string
          catatan?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          kode_alat: string
          nama_alat: string
          kategori: string
          merk?: string
          model?: string
          spesifikasi?: string
          lab_room_id?: string
          lokasi_detail?: string
          status?: 'available' | 'in_use' | 'maintenance' | 'broken' | 'retired'
          kondisi?: string
          jumlah_total?: number
          jumlah_tersedia?: number
          jumlah_dipinjam?: number
          jumlah_maintenance?: number
          tanggal_pembelian?: string
          harga_satuan?: number
          supplier?: string
          garansi_sampai?: string
          terakhir_maintenance?: string
          jadwal_maintenance_berikutnya?: string
          foto_url?: string
          manual_url?: string
          catatan?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          kode_alat?: string
          nama_alat?: string
          kategori?: string
          merk?: string
          model?: string
          spesifikasi?: string
          lab_room_id?: string
          lokasi_detail?: string
          status?: 'available' | 'in_use' | 'maintenance' | 'broken' | 'retired'
          kondisi?: string
          jumlah_total?: number
          jumlah_tersedia?: number
          jumlah_dipinjam?: number
          jumlah_maintenance?: number
          tanggal_pembelian?: string
          harga_satuan?: number
          supplier?: string
          garansi_sampai?: string
          terakhir_maintenance?: string
          jadwal_maintenance_berikutnya?: string
          foto_url?: string
          manual_url?: string
          catatan?: string
          created_at?: string
          updated_at?: string
        }
      }
      peminjaman_alat: {
        Row: {
          id: string
          peminjam_id: string
          inventaris_id: string
          dosen_id?: string
          mata_kuliah_id?: string
          jumlah_dipinjam: number
          keperluan: string
          tanggal_pinjam: string
          tanggal_kembali_rencana: string
          tanggal_kembali_aktual?: string
          status: 'pending' | 'approved' | 'rejected' | 'returned' | 'overdue'
          disetujui_oleh?: string
          tanggal_persetujuan?: string
          catatan_persetujuan?: string
          kondisi_saat_kembali?: string
          catatan_pengembalian?: string
          denda: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          peminjam_id: string
          inventaris_id: string
          dosen_id?: string
          mata_kuliah_id?: string
          jumlah_dipinjam?: number
          keperluan: string
          tanggal_pinjam: string
          tanggal_kembali_rencana: string
          tanggal_kembali_aktual?: string
          status?: 'pending' | 'approved' | 'rejected' | 'returned' | 'overdue'
          disetujui_oleh?: string
          tanggal_persetujuan?: string
          catatan_persetujuan?: string
          kondisi_saat_kembali?: string
          catatan_pengembalian?: string
          denda?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          peminjam_id?: string
          inventaris_id?: string
          dosen_id?: string
          mata_kuliah_id?: string
          jumlah_dipinjam?: number
          keperluan?: string
          tanggal_pinjam?: string
          tanggal_kembali_rencana?: string
          tanggal_kembali_aktual?: string
          status?: 'pending' | 'approved' | 'rejected' | 'returned' | 'overdue'
          disetujui_oleh?: string
          tanggal_persetujuan?: string
          catatan_persetujuan?: string
          kondisi_saat_kembali?: string
          catatan_pengembalian?: string
          denda?: number
          created_at?: string
          updated_at?: string
        }
      }
      presensi: {
        Row: {
          id: string
          jadwal_id: string
          mahasiswa_id: string
          tanggal_praktikum: string
          jam_masuk?: string
          jam_keluar?: string
          status_kehadiran: string
          verified_by?: string
          verification_method?: string
          catatan?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          jadwal_id: string
          mahasiswa_id: string
          tanggal_praktikum: string
          jam_masuk?: string
          jam_keluar?: string
          status_kehadiran?: string
          verified_by?: string
          verification_method?: string
          catatan?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          jadwal_id?: string
          mahasiswa_id?: string
          tanggal_praktikum?: string
          jam_masuk?: string
          jam_keluar?: string
          status_kehadiran?: string
          verified_by?: string
          verification_method?: string
          catatan?: string
          created_at?: string
          updated_at?: string
        }
      }
      materi_praktikum: {
        Row: {
          id: string
          mata_kuliah_id: string
          dosen_id?: string
          judul: string
          deskripsi?: string
          pertemuan_ke?: number
          tujuan_pembelajaran?: string[]
          langkah_praktikum?: string
          file_modul_url?: string
          file_panduan_url?: string
          video_url?: string
          is_published: boolean
          publish_date?: string
          deadline_laporan?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          mata_kuliah_id: string
          dosen_id?: string
          judul: string
          deskripsi?: string
          pertemuan_ke?: number
          tujuan_pembelajaran?: string[]
          langkah_praktikum?: string
          file_modul_url?: string
          file_panduan_url?: string
          video_url?: string
          is_published?: boolean
          publish_date?: string
          deadline_laporan?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          mata_kuliah_id?: string
          dosen_id?: string
          judul?: string
          deskripsi?: string
          pertemuan_ke?: number
          tujuan_pembelajaran?: string[]
          langkah_praktikum?: string
          file_modul_url?: string
          file_panduan_url?: string
          video_url?: string
          is_published?: boolean
          publish_date?: string
          deadline_laporan?: string
          created_at?: string
          updated_at?: string
        }
      }
      laporan_mahasiswa: {
        Row: {
          id: string
          mahasiswa_id: string
          mata_kuliah_id: string
          materi_id?: string
          jadwal_id?: string
          judul: string
          isi_laporan?: string
          file_laporan_url?: string
          tanggal_submit: string
          status: string
          submitted_at?: string
          feedback?: string
          reviewed_by?: string
          reviewed_at?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          mahasiswa_id: string
          mata_kuliah_id: string
          materi_id?: string
          jadwal_id?: string
          judul: string
          isi_laporan?: string
          file_laporan_url?: string
          tanggal_submit?: string
          status?: string
          submitted_at?: string
          feedback?: string
          reviewed_by?: string
          reviewed_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          mahasiswa_id?: string
          mata_kuliah_id?: string
          materi_id?: string
          jadwal_id?: string
          judul?: string
          isi_laporan?: string
          file_laporan_url?: string
          tanggal_submit?: string
          status?: string
          submitted_at?: string
          feedback?: string
          reviewed_by?: string
          reviewed_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      penilaian: {
        Row: {
          id: string
          mahasiswa_id: string
          mata_kuliah_id: string
          dosen_id?: string
          nilai_presensi: number
          nilai_praktikum: number
          nilai_laporan: number
          nilai_ujian: number
          nilai_akhir?: number
          grade?: string
          semester?: string
          tahun_akademik?: string
          catatan?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          mahasiswa_id: string
          mata_kuliah_id: string
          dosen_id?: string
          nilai_presensi?: number
          nilai_praktikum?: number
          nilai_laporan?: number
          nilai_ujian?: number
          nilai_akhir?: number
          grade?: string
          semester?: string
          tahun_akademik?: string
          catatan?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          mahasiswa_id?: string
          mata_kuliah_id?: string
          dosen_id?: string
          nilai_presensi?: number
          nilai_praktikum?: number
          nilai_laporan?: number
          nilai_ujian?: number
          nilai_akhir?: number
          grade?: string
          semester?: string
          tahun_akademik?: string
          catatan?: string
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id?: string
          action: string
          resource_type: string
          resource_id?: string
          description?: string
          old_values?: any
          new_values?: any
          ip_address?: string
          user_agent?: string
          session_id?: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          action: string
          resource_type: string
          resource_id?: string
          description?: string
          old_values?: any
          new_values?: any
          ip_address?: string
          user_agent?: string
          session_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          resource_type?: string
          resource_id?: string
          description?: string
          old_values?: any
          new_values?: any
          ip_address?: string
          user_agent?: string
          session_id?: string
          created_at?: string
        }
      }
    }
  }
}