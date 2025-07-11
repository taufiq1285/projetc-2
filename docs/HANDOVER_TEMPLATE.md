## 📝 HANDOVER_TEMPLATE.md Template

```markdown
# CLAUDE HANDOVER TEMPLATE

## QUICK START CONTEXT
Copy this when starting a new Claude chat:

---

**Project:** AKBID Lab System - Laboratory Management PWA
**Tech Stack:** Vite + React + TypeScript + Tailwind CSS 3 + Supabase + PWA
**Architecture:** Complex RBAC system for research contribution

**Current State:**
- Day: [X] of 42 (Week [Y] of 6)  
- Phase: [Current phase from roadmap]
- Last completed: [From PROJECT_STATE.md]
- Working on: [Current task]
- Blockers: [Any issues]

**Key Files to Reference:**
1. `docs/PROJECT_STATE.md` - Current progress
2. `docs/COMPONENT_REGISTRY.md` - Component status
3. `docs/API_PATTERNS.md` - Established patterns
4. `FINAL DIRECTORY STRUCTURE.docx` - Complete structure

**Established Patterns:**
[Copy from PROJECT_STATE.md "KNOWN PATTERNS" section]

**Next Immediate Task:**
[From PROJECT_STATE.md "Next Task"]

---

## DEVELOPMENT CONTEXT

### Roles & Permissions (4 levels)
1. **Admin** - Full system access
2. **Dosen** - Course management, student grading
3. **Laboran** - Inventory, equipment, approvals
4. **Mahasiswa** - View schedules, submit reports

### Database Structure (Supabase)
- Users, roles, permissions (RBAC)
- Lab rooms (9 labs + 1 depo)
- Equipment inventory & loans
- Course schedules & materials
- Student reports & grading

### Component Architecture
- UI components (Tailwind CSS 3)
- Layout components (responsive)
- Form components (React Hook Form + Zod)
- Table components (with pagination)
- Guards (RBAC route protection)

### State Management
- Zustand stores for each domain
- React Query for server state
- Local storage for user preferences

## CRITICAL REMINDERS
1. **Mobile-first PWA** - All components must be responsive
2. **RBAC everywhere** - Every feature needs permission checks
3. **TypeScript strict** - No any types allowed
4. **Supabase native** - Use RLS policies, not client-side checks
5. **Production ready** - No dev tools, optimized from start

## DAILY ROUTINE
**Start:** Update PROJECT_STATE.md, check git, review current task
**End:** Update progress, commit work, note tomorrow's task