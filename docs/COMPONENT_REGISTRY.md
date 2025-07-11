 COMPONENT_REGISTRY.md Template
markdown# COMPONENT REGISTRY

## UI Components (15 total)
| Component | Status | Location | Dependencies | Notes |
|-----------|--------|----------|--------------|-------|
| Button | ❌ | src/components/ui/Button.tsx | - | Tailwind variants |
| Input | ❌ | src/components/ui/Input.tsx | - | Form integration |
| Modal | ❌ | src/components/ui/Modal.tsx | - | Portal based |
| Card | ❌ | src/components/ui/Card.tsx | - | Shadow variants |
| Badge | ❌ | src/components/ui/Badge.tsx | - | Color themes |
| Spinner | ❌ | src/components/ui/Spinner.tsx | - | Loading states |
| Alert | ❌ | src/components/ui/Alert.tsx | - | Toast integration |
| Select | ❌ | src/components/ui/Select.tsx | - | Dropdown wrapper |
| Textarea | ❌ | src/components/ui/Textarea.tsx | - | Auto-resize |
| Dropdown | ❌ | src/components/ui/Dropdown.tsx | - | Click outside |
| Checkbox | ❌ | src/components/ui/Checkbox.tsx | - | Form integration |
| Radio | ❌ | src/components/ui/Radio.tsx | - | Group handling |
| Table | ❌ | src/components/ui/Table.tsx | - | Sorting/pagination |
| Tabs | ❌ | src/components/ui/Tabs.tsx | - | Router integration |
| Toast | ❌ | src/components/ui/Toast.tsx | - | Global state |

## Layout Components (8 total)
| Component | Status | Location | Dependencies | Notes |
|-----------|--------|----------|--------------|-------|
| AppLayout | ❌ | src/components/layout/AppLayout.tsx | Header, Sidebar | Main wrapper |
| DashboardLayout | ❌ | src/components/layout/DashboardLayout.tsx | AppLayout | Role-specific |
| AuthLayout | ❌ | src/components/layout/AuthLayout.tsx | - | Login/register |
| Header | ❌ | src/components/layout/Header.tsx | Navigation | User menu |
| Sidebar | ❌ | src/components/layout/Sidebar.tsx | Navigation | Collapsible |
| Navigation | ❌ | src/components/layout/Navigation.tsx | Router | RBAC aware |
| Footer | ❌ | src/components/layout/Footer.tsx | - | Copyright info |
| Breadcrumb | ❌ | src/components/layout/Breadcrumb.tsx | Router | Auto-generated |

## ESTABLISHED PATTERNS
```typescript
// Component naming: PascalCase
// File naming: ComponentName.tsx
// Props interface: ComponentNameProps
// Default export only
COMPONENT DEPENDENCIES MAP
AppLayout
├── Header
│   └── Navigation
│       └── useAuth, usePermissions
├── Sidebar
│   └── Navigation
└── Footer

DashboardLayout
├── AppLayout
└── Breadcrumb
    └── Router

---