import React from 'react'

// Self-contained notification interface to avoid store dependency issues
interface SimpleNotification {
  success: (title: string, message: string) => void
  warning: (title: string, message: string) => void
  info: (title: string, message: string) => void
  error: (title: string, message: string) => void
}

// Fallback notification system for PWA offline functionality
const createSimpleNotification = (): SimpleNotification => {
  const showNotification = (type: string, title: string, message: string) => {
    // Console logging for development
    console.log(`[${type.toUpperCase()}] ${title}: ${message}`)
    
    // Browser notification fallback if available
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/icons/icon-96x96.png',
        tag: `offline-${type}`
      })
    }
  }

  return {
    success: (title, message) => showNotification('success', title, message),
    warning: (title, message) => showNotification('warning', title, message),
    info: (title, message) => showNotification('info', title, message),
    error: (title, message) => showNotification('error', title, message)
  }
}

// Use simple notification system
const notify = createSimpleNotification()

interface OfflineState {
  isOnline: boolean
  lastOnline: Date | null
  pendingActions: Array<{
    id: string
    action: () => Promise<void>
    description: string
    timestamp: Date
  }>
}

class OfflineManager {
  private state: OfflineState = {
    isOnline: navigator.onLine,
    lastOnline: navigator.onLine ? new Date() : null,
    pendingActions: []
  }

  private listeners: Array<(state: OfflineState) => void> = []
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map()

  constructor() {
    this.setupEventListeners()
    this.loadPendingActions()
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.state.isOnline = true
      this.state.lastOnline = new Date()
      this.notifyListeners()
      this.showOnlineNotification()
      this.processPendingActions()
    })

    window.addEventListener('offline', () => {
      this.state.isOnline = false
      this.notifyListeners()
      this.showOfflineNotification()
    })
  }

  private showOnlineNotification() {
    notify.success('Connection Restored', 'You are back online. Syncing pending changes...')
  }

  private showOfflineNotification() {
    notify.warning('Offline Mode', 'You are offline. Changes will be saved and synced when connection is restored.')
  }

  public queueAction(action: () => Promise<void>, description: string): string {
    const id = `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const queuedAction = {
      id,
      action,
      description,
      timestamp: new Date()
    }

    this.state.pendingActions.push(queuedAction)
    this.savePendingActions()
    this.notifyListeners()

    // If we're online, try to execute immediately
    if (this.state.isOnline) {
      this.executeAction(queuedAction)
    }

    return id
  }

  private async executeAction(queuedAction: typeof this.state.pendingActions[0]) {
    try {
      await queuedAction.action()
      this.removeAction(queuedAction.id)
      
      notify.success('Synced', `${queuedAction.description} completed successfully`)
    } catch (error) {
      console.error('Failed to execute queued action:', error)
      
      // Retry with exponential backoff
      this.scheduleRetry(queuedAction)
    }
  }

  private scheduleRetry(queuedAction: typeof this.state.pendingActions[0]) {
    const existingTimeout = this.retryTimeouts.get(queuedAction.id)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Exponential backoff: 2s, 4s, 8s, 16s, 32s max
    const retryCount = this.getRetryCount(queuedAction.id)
    const delay = Math.min(2000 * Math.pow(2, retryCount), 32000)

    const timeout = setTimeout(() => {
      if (this.state.isOnline) {
        this.executeAction(queuedAction)
      } else {
        this.scheduleRetry(queuedAction)
      }
    }, delay)

    this.retryTimeouts.set(queuedAction.id, timeout)
  }

  private getRetryCount(actionId: string): number {
    // Simple retry counter (could be enhanced with persistent storage)
    const retryKey = `retry-${actionId}`
    const count = parseInt(localStorage.getItem(retryKey) || '0', 10)
    localStorage.setItem(retryKey, (count + 1).toString())
    return count
  }

  private removeAction(actionId: string) {
    this.state.pendingActions = this.state.pendingActions.filter(a => a.id !== actionId)
    this.savePendingActions()
    this.notifyListeners()

    // Cleanup retry timeout and counter
    const timeout = this.retryTimeouts.get(actionId)
    if (timeout) {
      clearTimeout(timeout)
      this.retryTimeouts.delete(actionId)
    }
    localStorage.removeItem(`retry-${actionId}`)
  }

  private async processPendingActions() {
    if (!this.state.isOnline || this.state.pendingActions.length === 0) {
      return
    }

    notify.info('Syncing', `Processing ${this.state.pendingActions.length} pending changes...`)

    // Process actions one by one to avoid overwhelming the server
    for (const action of [...this.state.pendingActions]) {
      if (this.state.isOnline) {
        await this.executeAction(action)
        // Small delay between actions
        await new Promise(resolve => setTimeout(resolve, 500))
      } else {
        break // Connection lost during processing
      }
    }
  }

  private savePendingActions() {
    try {
      // Note: We can only save serializable data, not the actual functions
      const serializableActions = this.state.pendingActions.map(action => ({
        id: action.id,
        description: action.description,
        timestamp: action.timestamp.toISOString()
      }))
      localStorage.setItem('pwa-pending-actions', JSON.stringify(serializableActions))
    } catch (error) {
      console.warn('Failed to save pending actions to localStorage:', error)
    }
  }

  private loadPendingActions() {
    try {
      const saved = localStorage.getItem('pwa-pending-actions')
      if (saved) {
        const actions = JSON.parse(saved)
        // Note: We can't restore the actual functions, only the metadata
        // In a real implementation, you'd need a way to recreate the actions
        console.log('Found pending actions from previous session:', actions)
      }
    } catch (error) {
      console.warn('Failed to load pending actions from localStorage:', error)
    }
  }

  public clearAllActions() {
    this.state.pendingActions = []
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout))
    this.retryTimeouts.clear()
    localStorage.removeItem('pwa-pending-actions')
    this.notifyListeners()
  }

  public subscribe(listener: (state: OfflineState) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.state }))
  }

  public getState(): OfflineState {
    return { ...this.state }
  }

  public isOnline(): boolean {
    return this.state.isOnline
  }

  public getPendingCount(): number {
    return this.state.pendingActions.length
  }
}

// Singleton instance
export const offlineManager = new OfflineManager()

// React Hook
export function useOffline() {
  const [state, setState] = React.useState(offlineManager.getState())

  React.useEffect(() => {
    return offlineManager.subscribe(setState)
  }, [])

  return {
    ...state,
    queueAction: (action: () => Promise<void>, description: string) => 
      offlineManager.queueAction(action, description),
    clearAll: () => offlineManager.clearAllActions(),
    isOnline: offlineManager.isOnline(),
    pendingCount: offlineManager.getPendingCount(),
  }
}

// Utility functions
export const isOnline = (): boolean => {
  return offlineManager.isOnline()
}

export const queueOfflineAction = (action: () => Promise<void>, description: string): string => {
  return offlineManager.queueAction(action, description)
}

export const withOfflineSupport = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  description: string
) => {
  return async (...args: T): Promise<R | void> => {
    if (offlineManager.isOnline()) {
      return await fn(...args)
    } else {
      offlineManager.queueAction(() => fn(...args) as Promise<void>, description)
    }
  }
}