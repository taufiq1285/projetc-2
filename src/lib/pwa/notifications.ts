import React from 'react'

// Define types directly in file to avoid import issues during development
interface ExtendedNotificationOptions extends NotificationOptions {
  vibrate?: number[]
  actions?: NotificationAction[]
  requireInteraction?: boolean
}

interface NotificationAction {
  action: string
  title: string
  icon?: string
}


interface NotificationPermissionState {
  permission: NotificationPermission
  supported: boolean
  pushSupported: boolean
  swSupported: boolean
}

interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

class PWANotificationManager {
  private state: NotificationPermissionState = {
    permission: 'default',
    supported: 'Notification' in window,
    pushSupported: 'PushManager' in window,
    swSupported: 'serviceWorker' in navigator
  }

  private listeners: Array<(state: NotificationPermissionState) => void> = []

  constructor() {
    this.updatePermissionState()
    this.setupServiceWorker()
  }

  private updatePermissionState() {
    if (this.state.supported) {
      this.state.permission = Notification.permission
      this.notifyListeners()
    }
  }

  private async setupServiceWorker() {
    if (!this.state.swSupported) return

    try {
      // Register service worker for push notifications
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered for notifications:', registration)
    } catch (error) {
      console.warn('Service Worker registration failed:', error)
    }
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.state.supported) {
      throw new Error('Notifications not supported')
    }

    try {
      const permission = await Notification.requestPermission()
      this.state.permission = permission
      this.notifyListeners()

      if (permission === 'granted') {
        this.showPermissionGrantedNotification()
      }

      return permission
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      throw error
    }
  }

  private showPermissionGrantedNotification() {
    this.showNotification('Notifications Enabled', {
      body: 'You will now receive important updates from AKBID Lab System',
      icon: '/icons/icon-96x96.png',
      tag: 'permission-granted'
    })
  }

  public showNotification(title: string, options: ExtendedNotificationOptions = {}): Promise<Notification | null> {
    return new Promise((resolve) => {
      if (!this.canShowNotifications()) {
        resolve(null)
        return
      }

      // Create base options with fallbacks for unsupported features
      const notificationOptions: NotificationOptions = {
        icon: '/icons/icon-96x96.png',
        badge: '/icons/icon-72x72.png',
        silent: false,
        ...options
      }

      // Add modern features if supported
      if ('vibrate' in navigator && options.vibrate) {
        (notificationOptions as any).vibrate = options.vibrate
      }

      if (options.requireInteraction !== undefined) {
        (notificationOptions as any).requireInteraction = options.requireInteraction
      }

      if (options.actions && 'serviceWorker' in navigator) {
        (notificationOptions as any).actions = options.actions
      }

      const notification = new Notification(title, notificationOptions)

      // Auto close after 5 seconds if not persistent
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close()
        }, 5000)
      }

      notification.addEventListener('click', () => {
        window.focus()
        notification.close()
      })

      resolve(notification)
    })
  }

  public async showEquipmentNotification(type: 'borrowed' | 'returned' | 'due' | 'overdue', equipment: string, user?: string) {
    // Define consistent message structure
    interface NotificationMessage {
      title: string
      body: string
      icon: string
      vibrate: number[]
      requireInteraction?: boolean
      tag?: string
      actions?: NotificationAction[]
    }

    const messages: Record<'borrowed' | 'returned' | 'due' | 'overdue', NotificationMessage> = {
      borrowed: {
        title: 'Equipment Borrowed',
        body: `${equipment} has been borrowed${user ? ` by ${user}` : ''}`,
        icon: '/icons/icon-96x96.png',
        vibrate: [200, 100, 200]
      },
      returned: {
        title: 'Equipment Returned',
        body: `${equipment} has been returned${user ? ` by ${user}` : ''}`,
        icon: '/icons/icon-96x96.png',
        vibrate: [200, 100, 200]
      },
      due: {
        title: 'Equipment Due Soon',
        body: `${equipment} is due for return today`,
        icon: '/icons/icon-96x96.png',
        requireInteraction: true,
        vibrate: [300, 100, 300, 100, 300]
      },
      overdue: {
        title: 'Equipment Overdue',
        body: `${equipment} is overdue for return`,
        icon: '/icons/icon-96x96.png',
        requireInteraction: true,
        tag: 'overdue',
        vibrate: [500, 200, 500, 200, 500],
        actions: [
          { action: 'remind', title: 'Send Reminder' },
          { action: 'extend', title: 'Extend Due Date' }
        ]
      }
    }

    const config = messages[type]
    return await this.showNotification(config.title, {
      body: config.body,
      icon: config.icon,
      tag: config.tag || `equipment-${type}`,
      requireInteraction: config.requireInteraction,
      vibrate: config.vibrate,
      actions: config.actions
    })
  }

  public async showScheduleNotification(type: 'starting' | 'ending' | 'reminder', course: string, lab: string, time: string) {
    // Define consistent message structure
    interface ScheduleNotificationMessage {
      title: string
      body: string
      requireInteraction: boolean
      vibrate: number[]
      actions?: NotificationAction[]
    }

    const messages: Record<'starting' | 'ending' | 'reminder', ScheduleNotificationMessage> = {
      starting: {
        title: 'Lab Session Starting',
        body: `${course} starts in ${time} at ${lab}`,
        requireInteraction: false,
        vibrate: [200, 100, 200]
      },
      ending: {
        title: 'Lab Session Ending',
        body: `${course} at ${lab} ends in ${time}`,
        requireInteraction: false,
        vibrate: [200, 100, 200]
      },
      reminder: {
        title: 'Lab Session Reminder',
        body: `Don't forget: ${course} tomorrow at ${lab}`,
        requireInteraction: true,
        vibrate: [300, 100, 300],
        actions: [
          { action: 'acknowledge', title: 'Got it' },
          { action: 'reschedule', title: 'Reschedule' }
        ]
      }
    }

    const config = messages[type]
    return await this.showNotification(config.title, {
      body: config.body,
      icon: '/icons/icon-96x96.png',
      tag: `schedule-${type}`,
      requireInteraction: config.requireInteraction,
      vibrate: config.vibrate,
      actions: config.actions
    })
  }

  public async subscribeToPush(): Promise<PushSubscriptionData | null> {
    if (!this.state.pushSupported || !this.state.swSupported) {
      throw new Error('Push notifications not supported')
    }

    if (this.state.permission !== 'granted') {
      await this.requestPermission()
    }

    if (this.state.permission !== 'granted') {
      throw new Error('Notification permission not granted')
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          // Replace with your VAPID public key
          'BEl62iUYgUivxIkv69yViEuiBIa40HI80YmqRSEdxIQ'
        ) as BufferSource
      })

      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: this.arrayBufferToBase64(subscription.getKey('auth'))
        }
      }

      // Send subscription to server
      await this.sendSubscriptionToServer(subscriptionData)

      return subscriptionData
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      throw error
    }
  }

  private async sendSubscriptionToServer(subscription: PushSubscriptionData) {
    // TODO: Implement API call to save subscription to Supabase
    console.log('Push subscription to save:', subscription)
    
    // This would typically be implemented as:
    // await supabase.from('push_subscriptions').insert({
    //   user_id: currentUser.id,
    //   endpoint: subscription.endpoint,
    //   p256dh: subscription.keys.p256dh,
    //   auth: subscription.keys.auth
    // })
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  private arrayBufferToBase64(buffer: ArrayBuffer | null): string {
    if (!buffer) return ''
    
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }

  public canShowNotifications(): boolean {
    return this.state.supported && this.state.permission === 'granted'
  }

  public subscribe(listener: (state: NotificationPermissionState) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.state }))
  }

  public getState(): NotificationPermissionState {
    return { ...this.state }
  }
}

// Singleton instance
export const pwaNotificationManager = new PWANotificationManager()

// React Hook
export function usePWANotifications() {
  const [state, setState] = React.useState(pwaNotificationManager.getState())

  React.useEffect(() => {
    return pwaNotificationManager.subscribe(setState)
  }, [])

  return {
    ...state,
    requestPermission: () => pwaNotificationManager.requestPermission(),
    showNotification: (title: string, options?: ExtendedNotificationOptions) => 
      pwaNotificationManager.showNotification(title, options),
    subscribeToPush: () => pwaNotificationManager.subscribeToPush(),
    canShow: pwaNotificationManager.canShowNotifications(),
    
    // Convenience methods for common notifications
    showEquipmentNotification: (type: 'borrowed' | 'returned' | 'due' | 'overdue', equipment: string, user?: string) =>
      pwaNotificationManager.showEquipmentNotification(type, equipment, user),
    
    showScheduleNotification: (type: 'starting' | 'ending' | 'reminder', course: string, lab: string, time: string) =>
      pwaNotificationManager.showScheduleNotification(type, course, lab, time),
  }
}

// Utility functions
export const canShowNotifications = (): boolean => {
  return pwaNotificationManager.canShowNotifications()
}

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  return await pwaNotificationManager.requestPermission()
}

export const showPWANotification = (title: string, options?: ExtendedNotificationOptions): Promise<Notification | null> => {
  return pwaNotificationManager.showNotification(title, options)
}