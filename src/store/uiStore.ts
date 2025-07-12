import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Modal {
  id: string
  type: 'confirm' | 'info' | 'warning' | 'error' | 'custom'
  title: string
  content: string
  isOpen: boolean
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  persistent?: boolean
  showCloseButton?: boolean
}

export interface LoadingState {
  id: string
  message?: string
  progress?: number
  cancelable?: boolean
  onCancel?: () => void
}

export interface Breadcrumb {
  label: string
  href?: string
  active?: boolean
}

interface UIState {
  // Theme and appearance
  theme: 'light' | 'dark' | 'system'
  sidebarCollapsed: boolean
  sidebarPinned: boolean
  
  // Layout states
  headerHeight: number
  sidebarWidth: number
  contentPadding: number
  
  // Loading states
  globalLoading: boolean
  loadingStates: Map<string, LoadingState>
  
  // Modal management
  modals: Map<string, Modal>
  modalStack: string[]
  
  // Navigation
  breadcrumbs: Breadcrumb[]
  currentPage: string
  pageTitle: string
  
  // Mobile responsiveness
  isMobile: boolean
  screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  
  // Focus management
  focusedElement: string | null
  
  // Scroll positions (for restoration)
  scrollPositions: Map<string, number>
  
  // Feature flags
  features: {
    darkMode: boolean
    notifications: boolean
    realtime: boolean
    analytics: boolean
    experimental: boolean
  }
  
  // Performance
  renderCount: number
  lastInteraction: number
}

interface UIActions {
  // Theme management
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleTheme: () => void
  
  // Sidebar management
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebarPin: () => void
  setSidebarPinned: (pinned: boolean) => void
  
  // Loading management
  setGlobalLoading: (loading: boolean) => void
  addLoadingState: (id: string, state: Omit<LoadingState, 'id'>) => void
  updateLoadingState: (id: string, updates: Partial<LoadingState>) => void
  removeLoadingState: (id: string) => void
  clearAllLoading: () => void
  
  // Modal management
  openModal: (modal: Omit<Modal, 'isOpen'>) => void
  closeModal: (id: string) => void
  closeTopModal: () => void
  closeAllModals: () => void
  updateModal: (id: string, updates: Partial<Modal>) => void
  
  // Navigation
  setBreadcrumbs: (breadcrumbs: Breadcrumb[]) => void
  addBreadcrumb: (breadcrumb: Breadcrumb) => void
  setCurrentPage: (page: string) => void
  setPageTitle: (title: string) => void
  
  // Screen size management
  setScreenSize: (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl') => void
  setIsMobile: (isMobile: boolean) => void
  
  // Focus management
  setFocusedElement: (elementId: string | null) => void
  
  // Scroll position management
  saveScrollPosition: (key: string, position: number) => void
  getScrollPosition: (key: string) => number
  clearScrollPositions: () => void
  
  // Feature flags
  toggleFeature: (feature: keyof UIState['features']) => void
  setFeature: (feature: keyof UIState['features'], enabled: boolean) => void
  
  // Performance tracking
  incrementRenderCount: () => void
  updateLastInteraction: () => void
  resetPerformanceMetrics: () => void
  
  // Utility actions
  resetUI: () => void
}

type UIStore = UIState & UIActions

const initialState: UIState = {
  theme: 'system',
  sidebarCollapsed: false,
  sidebarPinned: true,
  headerHeight: 64,
  sidebarWidth: 256,
  contentPadding: 24,
  globalLoading: false,
  loadingStates: new Map(),
  modals: new Map(),
  modalStack: [],
  breadcrumbs: [],
  currentPage: '',
  pageTitle: 'AKBID Lab System',
  isMobile: false,
  screenSize: 'lg',
  focusedElement: null,
  scrollPositions: new Map(),
  features: {
    darkMode: true,
    notifications: true,
    realtime: true,
    analytics: false,
    experimental: false
  },
  renderCount: 0,
  lastInteraction: Date.now()
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Theme management
      setTheme: (theme) => set({ theme }),

      toggleTheme: () => {
        const currentTheme = get().theme
        const newTheme = currentTheme === 'light' ? 'dark' : 'light'
        set({ theme: newTheme })
      },

      // Sidebar management
      toggleSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      toggleSidebarPin: () => set((state) => ({ 
        sidebarPinned: !state.sidebarPinned 
      })),

      setSidebarPinned: (pinned) => set({ sidebarPinned: pinned }),

      // Loading management
      setGlobalLoading: (globalLoading) => set({ globalLoading }),

      addLoadingState: (id, state) => {
        const loadingStates = new Map(get().loadingStates)
        loadingStates.set(id, { ...state, id })
        set({ loadingStates })
      },

      updateLoadingState: (id, updates) => {
        const loadingStates = new Map(get().loadingStates)
        const existing = loadingStates.get(id)
        if (existing) {
          loadingStates.set(id, { ...existing, ...updates })
          set({ loadingStates })
        }
      },

      removeLoadingState: (id) => {
        const loadingStates = new Map(get().loadingStates)
        loadingStates.delete(id)
        set({ loadingStates })
      },

      clearAllLoading: () => set({ 
        globalLoading: false,
        loadingStates: new Map() 
      }),

      // Modal management
      openModal: (modal) => {
        const modals = new Map(get().modals)
        const modalStack = [...get().modalStack]
        
        modals.set(modal.id, { ...modal, isOpen: true })
        modalStack.push(modal.id)
        
        set({ modals, modalStack })
      },

      closeModal: (id) => {
        const modals = new Map(get().modals)
        const modalStack = get().modalStack.filter(modalId => modalId !== id)
        
        const modal = modals.get(id)
        if (modal) {
          modals.set(id, { ...modal, isOpen: false })
        }
        
        set({ modals, modalStack })
        
        // Clean up closed modals after animation
        setTimeout(() => {
          const newModals = new Map(get().modals)
          newModals.delete(id)
          set({ modals: newModals })
        }, 300)
      },

      closeTopModal: () => {
        const modalStack = get().modalStack
        if (modalStack.length > 0) {
          const topModalId = modalStack[modalStack.length - 1]
          get().closeModal(topModalId)
        }
      },

      closeAllModals: () => {
        const modals = new Map()
        const modalStack: string[] = []
        set({ modals, modalStack })
      },

      updateModal: (id, updates) => {
        const modals = new Map(get().modals)
        const existing = modals.get(id)
        if (existing) {
          modals.set(id, { ...existing, ...updates })
          set({ modals })
        }
      },

      // Navigation
      setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),

      addBreadcrumb: (breadcrumb) => {
        const breadcrumbs = [...get().breadcrumbs, breadcrumb]
        set({ breadcrumbs })
      },

      setCurrentPage: (currentPage) => set({ currentPage }),

      setPageTitle: (pageTitle) => {
        set({ pageTitle })
        document.title = pageTitle
      },

      // Screen size management
      setScreenSize: (screenSize) => set({ screenSize }),

      setIsMobile: (isMobile) => set({ isMobile }),

      // Focus management
      setFocusedElement: (focusedElement) => set({ focusedElement }),

      // Scroll position management
      saveScrollPosition: (key, position) => {
        const scrollPositions = new Map(get().scrollPositions)
        scrollPositions.set(key, position)
        set({ scrollPositions })
      },

      getScrollPosition: (key) => {
        return get().scrollPositions.get(key) || 0
      },

      clearScrollPositions: () => set({ scrollPositions: new Map() }),

      // Feature flags
      toggleFeature: (feature) => {
        const features = { ...get().features }
        features[feature] = !features[feature]
        set({ features })
      },

      setFeature: (feature, enabled) => {
        const features = { ...get().features }
        features[feature] = enabled
        set({ features })
      },

      // Performance tracking
      incrementRenderCount: () => set((state) => ({ 
        renderCount: state.renderCount + 1 
      })),

      updateLastInteraction: () => set({ lastInteraction: Date.now() }),

      resetPerformanceMetrics: () => set({ 
        renderCount: 0, 
        lastInteraction: Date.now() 
      }),

      // Utility actions
      resetUI: () => set({
        ...initialState,
        loadingStates: new Map(),
        modals: new Map(),
        scrollPositions: new Map()
      })
    }),
    {
      name: 'akbid-ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarPinned: state.sidebarPinned,
        features: state.features,
        scrollPositions: Array.from(state.scrollPositions.entries())
      }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.scrollPositions)) {
          state.scrollPositions = new Map(state.scrollPositions as [string, number][])
        }
      }
    }
  )
)

// Selectors
export const useTheme = () => useUIStore((state) => ({
  theme: state.theme,
  setTheme: state.setTheme,
  toggleTheme: state.toggleTheme
}))

export const useSidebar = () => useUIStore((state) => ({
  collapsed: state.sidebarCollapsed,
  pinned: state.sidebarPinned,
  width: state.sidebarWidth,
  toggle: state.toggleSidebar,
  setCollapsed: state.setSidebarCollapsed,
  togglePin: state.toggleSidebarPin,
  setPinned: state.setSidebarPinned
}))

export const useModal = () => useUIStore((state) => ({
  modals: state.modals,
  modalStack: state.modalStack,
  openModal: state.openModal,
  closeModal: state.closeModal,
  closeTopModal: state.closeTopModal,
  closeAllModals: state.closeAllModals,
  updateModal: state.updateModal
}))

export const useLoading = () => useUIStore((state) => ({
  globalLoading: state.globalLoading,
  loadingStates: state.loadingStates,
  setGlobalLoading: state.setGlobalLoading,
  addLoadingState: state.addLoadingState,
  updateLoadingState: state.updateLoadingState,
  removeLoadingState: state.removeLoadingState,
  clearAllLoading: state.clearAllLoading
}))

export const useNavigation = () => useUIStore((state) => ({
  breadcrumbs: state.breadcrumbs,
  currentPage: state.currentPage,
  pageTitle: state.pageTitle,
  setBreadcrumbs: state.setBreadcrumbs,
  addBreadcrumb: state.addBreadcrumb,
  setCurrentPage: state.setCurrentPage,
  setPageTitle: state.setPageTitle
}))

export const useResponsive = () => useUIStore((state) => ({
  isMobile: state.isMobile,
  screenSize: state.screenSize,
  setIsMobile: state.setIsMobile,
  setScreenSize: state.setScreenSize
}))

export const useFeatures = () => useUIStore((state) => ({
  features: state.features,
  toggleFeature: state.toggleFeature,
  setFeature: state.setFeature
}))

// Helper functions
export const showConfirmModal = (
  title: string,
  content: string,
  onConfirm: () => void | Promise<void>,
  options?: Partial<Modal>
) => {
  const id = `confirm-${Date.now()}`
  useUIStore.getState().openModal({
    id,
    type: 'confirm',
    title,
    content,
    onConfirm,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    size: 'md',
    ...options
  })
  return id
}

export const showInfoModal = (
  title: string,
  content: string,
  options?: Partial<Modal>
) => {
  const id = `info-${Date.now()}`
  useUIStore.getState().openModal({
    id,
    type: 'info',
    title,
    content,
    confirmText: 'OK',
    size: 'md',
    ...options
  })
  return id
}

export const withLoading = async <T>(
  id: string,
  operation: () => Promise<T>,
  message?: string
): Promise<T> => {
  const { addLoadingState, removeLoadingState } = useUIStore.getState()
  
  addLoadingState(id, { message })
  
  try {
    const result = await operation()
    return result
  } finally {
    removeLoadingState(id)
  }
}