## 📁 **2. DOCUMENT FOLDER STRUCTURE RATIONALE**

Buat file baru: `docs/FOLDER_STRUCTURE.md`

```markdown
# FOLDER STRUCTURE RATIONALE

## 🎯 DESIGN PRINCIPLES

### 1. **Role-Based Organization**
Pages dibagi berdasarkan user roles (admin, dosen, laboran, mahasiswa) untuk:
- ✅ **Clear separation of concerns**
- ✅ **Easy RBAC implementation** 
- ✅ **Scalable permission management**
- ✅ **Team collaboration** (different devs per role)

### 2. **Component Type Separation**
Components dipisah berdasarkan fungsi untuk:
- ✅ **Reusability** (ui components dapat dipakai dimana saja)
- ✅ **Maintainability** (mudah find dan update)
- ✅ **Testing** (isolated testing per type)
- ✅ **Code organization** (logical grouping)

### 3. **Feature-Based Library Structure**
Lib folder diorganisir berdasarkan feature untuk:
- ✅ **Single responsibility** (setiap folder punya tujuan spesifik)
- ✅ **Easy imports** (clear path structure)
- ✅ **Scalability** (mudah tambah feature baru)
- ✅ **Team workflow** (multiple devs can work simultaneously)

## 📂 DETAILED RATIONALE

### **src/components/**
components/
├── ui/           # Reusable base components (Button, Input, etc.)
├── layout/       # App structure components (Header, Sidebar, etc.)
├── forms/        # Business logic forms (UserForm, etc.)
├── tables/       # Data display components (DataTable, etc.)
├── common/       # Shared utility components (FileUpload, etc.)
├── guards/       # RBAC protection components (AuthGuard, etc.)
└── charts/       # Data visualization components (BarChart, etc.)

**Rationale:**
- **UI:** Pure presentational, no business logic
- **Layout:** App structure, navigation logic
- **Forms:** Business rules, validation, API integration
- **Tables:** Data display, sorting, pagination
- **Common:** Shared functionality across roles
- **Guards:** Security, RBAC enforcement
- **Charts:** Analytics, reporting

### **src/pages/**
pages/
├── auth/         # Authentication pages (Login, etc.)
├── admin/        # Admin-only pages (UserManagement, etc.)
├── dosen/        # Dosen-only pages (JadwalPraktikum, etc.)
├── laboran/      # Laboran-only pages (InventarisAlat, etc.)
├── mahasiswa/    # Mahasiswa-only pages (JadwalView, etc.)
└── shared/       # Common pages (HomePage, 404, etc.)

**Rationale:**
- **Role separation:** Each folder matches user permissions
- **RBAC implementation:** Easy to implement route guards
- **Team collaboration:** Different teams can work on different roles
- **Code isolation:** Changes in one role don't affect others

### **src/lib/**
lib/
├── supabase/     # Database integration (client, auth, storage)
├── rbac/         # Role-based access control (permissions, policies)
├── utils/        # Helper functions (formatters, validators)
├── constants/    # App constants (routes, messages, config)
├── schemas/      # Validation schemas (Zod schemas)
├── api/          # API service layer (CRUD operations)
└── pwa/          # PWA functionality (offline, cache)

**Rationale:**
- **Separation of concerns:** Each folder has single responsibility
- **Reusability:** Utils can be imported anywhere
- **Type safety:** Schemas ensure data validation
- **API abstraction:** Clean separation between UI and data
- **PWA features:** Isolated offline functionality

### **src/hooks/**
hooks/
├── useAuth.ts          # Authentication logic
├── usePermissions.ts   # RBAC permissions
├── useForm.ts          # Form handling
├── useFileUpload.ts    # File operations
└── ...

**Rationale:**
- **Logic reuse:** Share stateful logic across components
- **Clean components:** Keep components focused on UI
- **Easy testing:** Test hooks independently
- **Custom abstractions:** Wrap complex libraries (React Query, etc.)

### **database/**
database/
├── migrations/   # Database schema changes (versioned)
├── policies/     # Row Level Security policies (RLS)
├── seeds/        # Initial data (roles, lab rooms, etc.)
└── functions/    # Database functions (triggers, etc.)

**Rationale:**
- **Version control:** Track database changes over time
- **Security:** RLS policies for data protection
- **Development:** Seed data for consistent dev environment
- **Performance:** Database functions for complex operations

## 🔄 SCALABILITY CONSIDERATIONS

### **Easy to Add New Features:**
- New role → Add folder to `pages/newrole/`
- New component type → Add folder to `components/newtype/`
- New utility → Add to appropriate `lib/` subfolder
- New API → Add to `lib/api/`

### **Team Collaboration:**
- **Frontend devs:** Work in `components/` and `pages/`
- **Backend devs:** Work in `database/` and `lib/api/`
- **DevOps:** Work in PWA and deployment configs
- **UI/UX:** Focus on `components/ui/` and layouts

### **Maintenance:**
- **Bug fixes:** Easy to locate (logical folder structure)
- **Feature updates:** Isolated in specific folders
- **Refactoring:** Clear dependencies between folders
- **Testing:** Test folders independently

## ✅ BENEFITS ACHIEVED

1. **Developer Experience:** Easy to find and modify code
2. **Team Efficiency:** Multiple developers can work simultaneously
3. **Code Quality:** Clear separation prevents spaghetti code
4. **Scalability:** Easy to add new features without restructuring
5. **Maintainability:** Logical organization for long-term maintenance
6. **RBAC Implementation:** Natural fit for role-based architecture
7. **Testing:** Isolated components for better test coverage