# NAMING CONVENTIONS GUIDE

## 🎯 CONSISTENT NAMING ACROSS CODEBASE

### **File Naming Conventions**

#### **React Components (.tsx)**
- **Format:** PascalCase
- **Examples:**
Button.tsx
UserForm.tsx
AdminDashboard.tsx
MataKuliahManagement.tsx

#### **TypeScript Files (.ts)**
- **Format:** camelCase
- **Examples:**
useAuth.ts
authStore.ts
userApi.ts
helpers.ts

#### **Style Files (.css)**
- **Format:** kebab-case
- **Examples:**
globals.css
admin-dashboard.css
user-form.css

#### **Database Files (.sql)**
- **Format:** snake_case with numbers
- **Examples:**
001_initial_schema.sql
create_users_table.sql
users_policies.sql

### **Directory Naming Conventions**

#### **Main Directories**
- **Format:** kebab-case
- **Examples:**
components/
lab-rooms/
mata-kuliah/

#### **Subdirectories**
- **Format:** camelCase or descriptive
- **Examples:**
ui/
auth/
admin/
supabase/

### **Variable & Function Naming**

#### **React Components**
```typescript
// PascalCase for component names
function UserManagement() { }
const AdminDashboard = () => { }

// camelCase for props
interface UserFormProps {
userId: string;
isEditing: boolean;
onSubmit: (data: UserData) => void;
}
Hooks
typescript// Always start with 'use' + PascalCase
function useAuth() { }
function usePermissions() { }
function useFileUpload() { }
Constants
typescript// SCREAMING_SNAKE_CASE for constants
const API_BASE_URL = 'https://api.example.com';
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// camelCase for config objects
const appConfig = {
  apiTimeout: 5000,
  retryAttempts: 3
};
Types & Interfaces
typescript// PascalCase with descriptive suffixes
interface UserData { }
type PermissionType = 'read' | 'write' | 'delete';
interface ApiResponse<T> { }

// Enum with PascalCase
enum UserRole {
  Admin = 'admin',
  Dosen = 'dosen', 
  Laboran = 'laboran',
  Mahasiswa = 'mahasiswa'
}
Database Naming Conventions
Table Names
sql-- snake_case, plural
users
lab_rooms  
mata_kuliah
inventaris_alat
peminjaman_alat
Column Names
sql-- snake_case
user_id
created_at
updated_at
lab_room_id
mata_kuliah_name
Function Names
sql-- snake_case with action verb
create_user()
check_permissions()
update_inventory()
API Naming Conventions
Endpoint Paths
typescript// kebab-case, RESTful
/api/users
/api/lab-rooms
/api/mata-kuliah
/api/inventaris-alat
API Service Functions
typescript// camelCase with HTTP method prefix
async function getUsers() { }
async function createUser() { }
async function updateLabRoom() { }
async function deleteInventaris() { }
CSS Class Naming (Tailwind + Custom)
Tailwind Utilities
css/* Use as-is */
bg-blue-500
text-lg
p-4
Custom CSS Classes
css/* BEM methodology for custom classes */
.user-card { }
.user-card__header { }
.user-card__title { }
.user-card--featured { }

/* Component-specific classes */
.admin-dashboard { }
.lab-inventory { }
Git Commit Message Conventions
Format
type(scope): description

feat(auth): implement role-based login
fix(inventory): resolve stock calculation bug
docs(api): update authentication endpoints
style(ui): improve button component styling
refactor(rbac): simplify permission checking logic
test(forms): add validation tests
chore(deps): update dependencies
Types

feat: New feature
fix: Bug fix
docs: Documentation
style: Code formatting
refactor: Code restructuring
test: Testing
chore: Maintenance

Environment Variables
Format
bash# SCREAMING_SNAKE_CASE with VITE_ prefix
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_NAME=
VITE_NODE_ENV=