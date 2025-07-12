import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number // Auto-dismiss time in milliseconds (0 = no auto-dismiss)
  persistent?: boolean // Cannot be dismissed by user
  actions?: NotificationAction[]
  timestamp: number
  read: boolean
  category?: string
  userId?: string
  source?: 'system' | 'user' | 'realtime' | 'push'
  data?: Record<string, any> // Additional data for custom handling
}

export interface NotificationAction {
  label: string
  action: () => void | Promise<void>
  style?: 'primary' | 'secondary' | 'danger'
}

export interface NotificationPreferences {
  enabled: boolean
  sound: boolean
  desktop: boolean
  email: boolean
  push: boolean
  categories: {
    system: boolean
    security: boolean
    equipment: boolean
    schedule: boolean
    reports: boolean
    maintenance: boolean
  }
  quietHours: {
    enabled: boolean
    start: string // HH:mm format
    end: string // HH:mm format
  }
  maxVisible: number
}

interface NotificationState {
  // Active notifications (shown in UI)
  notifications: Notification[]
  
  // All notifications history
  history: Notification[]
  
  // Notification preferences
  preferences: NotificationPreferences
  
  // UI state
  isVisible: boolean
  unreadCount: number
  lastNotificationId: string | null
  
  // Sound and visual settings
  soundEnabled: boolean
  animationsEnabled: boolean
  
  // Performance
  maxHistorySize: number
  cleanupInterval: number
}

interface NotificationActions {
  // Notification management
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => string
  removeNotification: (id: string) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotification: (id: string) => void
  clearAllNotifications: () => void
  
  // Quick notification helpers
  showSuccess: (title: string, message: string, options?: Partial<Notification>) => string
  showError: (title: string, message: string, options?: Partial<Notification>) => string
  showWarning: (title: string, message: string, options?: Partial<Notification>) => string
  showInfo: (title: string, message: string, options?: Partial<Notification>) => string
  
  // Batch operations
  addNotifications: (notifications: Array<Omit<Notification, 'id' | 'timestamp' | 'read'>>) => void
  removeNotifications: (ids: string[]) => void
  clearByCategory: (category: string) => void
  clearByType: (type: Notification['type']) => void
  
  // History management
  moveToHistory: (id: string) => void
  clearHistory: () => void
  getHistoryByCategory: (category: string) => Notification[]
  
  // Preferences
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void
  resetPreferences: () => void
  
  // UI management
  setVisible: (visible: boolean) => void
  toggleVisible: () => void
  
  // Sound and animations
  setSoundEnabled: (enabled: boolean) => void
  setAnimationsEnabled: (enabled: boolean) => void
  
  // Utility
  isQuietHours: () => boolean
  shouldShowNotification: (notification: Notification) => boolean
  cleanup: () => void
}

type NotificationStore = NotificationState & NotificationActions

const defaultPreferences: NotificationPreferences = {
  enabled: true,
  sound: true,
  desktop: true,
  email: false,
  push: true,
  categories: {
    system: true,
    security: true,
    equipment: true,
    schedule: true,
    reports: true,
    maintenance: true
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '07:00'
  },
  maxVisible: 5
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      // State
      notifications: [],
      history: [],
      preferences: defaultPreferences,
      isVisible: false,
      unreadCount: 0,
      lastNotificationId: null,
      soundEnabled: true,
      animationsEnabled: true,
      maxHistorySize: 100,
      cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours

      // Actions
      addNotification: (notificationData) => {
        const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const notification: Notification = {
          ...notificationData,
          id,
          timestamp: Date.now(),
          read: false,
          duration: notificationData.duration ?? (notificationData.type === 'error' ? 0 : 5000)
        }

        // Check if notification should be shown
        if (!get().shouldShowNotification(notification)) {
          return id
        }

        const notifications = [...get().notifications]
        const { maxVisible } = get().preferences

        // Add new notification
        notifications.unshift(notification)

        // Enforce max visible limit
        if (notifications.length > maxVisible) {
          const excess = notifications.splice(maxVisible)
          // Move excess to history
          excess.forEach(notif => get().moveToHistory(notif.id))
        }

        set({
          notifications,
          unreadCount: get().unreadCount + 1,
          lastNotificationId: id
        })

        // Auto-dismiss if duration is set
        if (notification.duration && notification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(id)
          }, notification.duration)
        }

        // Play sound if enabled
        if (get().soundEnabled && get().preferences.sound && !get().isQuietHours()) {
          // Play notification sound
          if (typeof Audio !== 'undefined') {
            try {
              const audio = new Audio(`/sounds/notification-${notification.type}.mp3`)
              audio.volume = 0.3
              audio.play().catch(() => {
                // Silently fail if audio cannot be played
              })
            } catch {
              // Audio not supported or failed
            }
          }
        }

        return id
      },

      removeNotification: (id) => {
        const notifications = get().notifications.filter(n => n.id !== id)
        set({ notifications })
      },

      markAsRead: (id) => {
        const notifications = get().notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        )
        const unreadCount = notifications.filter(n => !n.read).length
        set({ notifications, unreadCount })
      },

      markAllAsRead: () => {
        const notifications = get().notifications.map(n => ({ ...n, read: true }))
        set({ notifications, unreadCount: 0 })
      },

      clearNotification: (id) => {
        get().moveToHistory(id)
        get().removeNotification(id)
      },

      clearAllNotifications: () => {
        const notifications = get().notifications
        // Move all to history
        notifications.forEach(n => get().moveToHistory(n.id))
        set({ notifications: [], unreadCount: 0 })
      },

      // Quick helpers
      showSuccess: (title, message, options = {}) => {
        return get().addNotification({
          type: 'success',
          title,
          message,
          ...options
        })
      },

      showError: (title, message, options = {}) => {
        return get().addNotification({
          type: 'error',
          title,
          message,
          duration: 0, // Errors don't auto-dismiss by default
          ...options
        })
      },

      showWarning: (title, message, options = {}) => {
        return get().addNotification({
          type: 'warning',
          title,
          message,
          ...options
        })
      },

      showInfo: (title, message, options = {}) => {
        return get().addNotification({
          type: 'info',
          title,
          message,
          ...options
        })
      },

      // Batch operations
      addNotifications: (notificationsData) => {
        notificationsData.forEach(data => get().addNotification(data))
      },

      removeNotifications: (ids) => {
        const notifications = get().notifications.filter(n => !ids.includes(n.id))
        const unreadCount = notifications.filter(n => !n.read).length
        set({ notifications, unreadCount })
      },

      clearByCategory: (category) => {
        const toRemove = get().notifications
          .filter(n => n.category === category)
          .map(n => n.id)
        get().removeNotifications(toRemove)
      },

      clearByType: (type) => {
        const toRemove = get().notifications
          .filter(n => n.type === type)
          .map(n => n.id)
        get().removeNotifications(toRemove)
      },

      // History management
      moveToHistory: (id) => {
        const notification = get().notifications.find(n => n.id === id)
        if (notification) {
          const history = [...get().history, notification]
          
          // Enforce max history size
          if (history.length > get().maxHistorySize) {
            history.shift() // Remove oldest
          }
          
          set({ history })
        }
      },

      clearHistory: () => set({ history: [] }),

      getHistoryByCategory: (category) => {
        return get().history.filter(n => n.category === category)
      },

      // Preferences
      updatePreferences: (updates) => {
        const preferences = { ...get().preferences, ...updates }
        set({ preferences })
      },

      resetPreferences: () => set({ preferences: defaultPreferences }),

      // UI management
      setVisible: (isVisible) => set({ isVisible }),

      toggleVisible: () => set((state) => ({ isVisible: !state.isVisible })),

      // Sound and animations
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),

      setAnimationsEnabled: (animationsEnabled) => set({ animationsEnabled }),

      // Utility functions
      isQuietHours: () => {
        const { quietHours } = get().preferences
        if (!quietHours.enabled) return false

        const now = new Date()
        const currentTime = now.getHours() * 100 + now.getMinutes()
        
        const [startHour, startMin] = quietHours.start.split(':').map(Number)
        const [endHour, endMin] = quietHours.end.split(':').map(Number)
        
        const startTime = startHour * 100 + startMin
        const endTime = endHour * 100 + endMin

        if (startTime <= endTime) {
          return currentTime >= startTime && currentTime <= endTime
        } else {
          // Crosses midnight
          return currentTime >= startTime || currentTime <= endTime
        }
      },

      shouldShowNotification: (notification) => {
        const { preferences } = get()
        
        if (!preferences.enabled) return false
        if (get().isQuietHours()) return false
        
        if (notification.category && !preferences.categories[notification.category as keyof typeof preferences.categories]) {
          return false
        }
        
        return true
      },

      cleanup: () => {
        const now = Date.now()
        const cutoff = now - get().cleanupInterval
        
        // Clean old history entries
        const history = get().history.filter(n => n.timestamp > cutoff)
        set({ history })
      }
    }),
    {
      name: 'akbid-notifications-storage',
      partialize: (state) => ({
        history: state.history,
        preferences: state.preferences,
        soundEnabled: state.soundEnabled,
        animationsEnabled: state.animationsEnabled
      })
    }
  )
)

// Selectors
export const useNotifications = () => useNotificationStore((state) => ({
  notifications: state.notifications,
  unreadCount: state.unreadCount,
  isVisible: state.isVisible
}))

export const useNotificationActions = () => useNotificationStore((state) => ({
  showSuccess: state.showSuccess,
  showError: state.showError,
  showWarning: state.showWarning,
  showInfo: state.showInfo,
  markAsRead: state.markAsRead,
  clearNotification: state.clearNotification,
  clearAllNotifications: state.clearAllNotifications,
  setVisible: state.setVisible,
  toggleVisible: state.toggleVisible
}))

export const useNotificationPreferences = () => useNotificationStore((state) => ({
  preferences: state.preferences,
  updatePreferences: state.updatePreferences,
  resetPreferences: state.resetPreferences
}))

export const useNotificationHistory = () => useNotificationStore((state) => ({
  history: state.history,
  clearHistory: state.clearHistory,
  getHistoryByCategory: state.getHistoryByCategory
}))

// Helper functions for easy usage
export const notify = {
  success: (title: string, message: string, options?: Partial<Notification>) =>
    useNotificationStore.getState().showSuccess(title, message, options),
  
  error: (title: string, message: string, options?: Partial<Notification>) =>
    useNotificationStore.getState().showError(title, message, options),
  
  warning: (title: string, message: string, options?: Partial<Notification>) =>
    useNotificationStore.getState().showWarning(title, message, options),
  
  info: (title: string, message: string, options?: Partial<Notification>) =>
    useNotificationStore.getState().showInfo(title, message, options)
}

// Auto-cleanup on interval
if (typeof window !== 'undefined') {
  setInterval(() => {
    useNotificationStore.getState().cleanup()
  }, 60 * 60 * 1000) // Run cleanup every hour
}