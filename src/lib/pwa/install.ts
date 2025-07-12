import React from 'react'

// PWA Install State Interface
interface PWAInstallState {
  isInstallable: boolean
  isInstalled: boolean
  platform: 'ios' | 'android' | 'desktop' | 'unknown'
  showInstallPrompt: boolean
  deferredPrompt: BeforeInstallPromptEvent | null
}

// BeforeInstallPrompt Event Interface
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

class PWAInstallManager {
  private state: PWAInstallState = {
    isInstallable: false,
    isInstalled: false,
    platform: 'unknown',
    showInstallPrompt: false,
    deferredPrompt: null,
  }

  private listeners: Array<(state: PWAInstallState) => void> = []

  constructor() {
    this.detectPlatform()
    this.setupEventListeners()
    this.checkInstallation()
  }

  private detectPlatform() {
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (/iphone|ipad|ipod/.test(userAgent)) {
      this.state.platform = 'ios'
    } else if (/android/.test(userAgent)) {
      this.state.platform = 'android'
    } else {
      this.state.platform = 'desktop'
    }
  }

  private setupEventListeners() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault()
      const event = e as BeforeInstallPromptEvent
      this.state.deferredPrompt = event
      this.state.isInstallable = true
      this.state.showInstallPrompt = !this.isInstalled()
      this.notifyListeners()
    })

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      this.state.isInstalled = true
      this.state.isInstallable = false
      this.state.showInstallPrompt = false
      this.state.deferredPrompt = null
      this.notifyListeners()
      
      // Track installation
      this.trackInstallation('successful')
    })
  }

  private checkInstallation() {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.state.isInstalled = true
      this.state.showInstallPrompt = false
    }

    // Check for iOS home screen app
    if (this.state.platform === 'ios') {
      const isInStandaloneMode = ('standalone' in window.navigator) && 
        (window.navigator as any).standalone
      
      if (isInStandaloneMode) {
        this.state.isInstalled = true
        this.state.showInstallPrompt = false
      }
    }
  }

  public async install(): Promise<boolean> {
    if (!this.state.deferredPrompt) {
      this.showPlatformSpecificInstructions()
      return false
    }

    try {
      await this.state.deferredPrompt.prompt()
      const { outcome } = await this.state.deferredPrompt.userChoice
      
      this.trackInstallation(outcome)
      
      if (outcome === 'accepted') {
        this.state.isInstalled = true
        this.state.showInstallPrompt = false
        return true
      }
      
      return false
    } catch (error) {
      console.error('Installation failed:', error)
      this.trackInstallation('failed')
      return false
    } finally {
      this.state.deferredPrompt = null
      this.notifyListeners()
    }
  }

  private showPlatformSpecificInstructions() {
    let instructions = ''
    
    switch (this.state.platform) {
      case 'ios':
        instructions = `To install AKBID Lab System on iOS:
1. Tap the Share button (square with arrow)
2. Scroll down and tap "Add to Home Screen"  
3. Tap "Add" to confirm`
        break
      case 'android':
        instructions = `To install AKBID Lab System on Android:
1. Tap the menu button (three dots)
2. Select "Add to Home screen"
3. Tap "Add" to confirm`
        break
      case 'desktop':
        instructions = `To install AKBID Lab System on desktop:
1. Look for the install icon in the address bar
2. Click it and select "Install"
3. Or use browser menu: "Install AKBID Lab System"`
        break
    }

    // Use simple alert fallback for installation instructions
    alert(`Install App\n\n${instructions}`)
    
    console.log('PWA Installation Instructions:', {
      platform: this.state.platform,
      instructions
    })
  }

  private trackInstallation(outcome: string) {
    // Analytics tracking (placeholder)
    console.log(`PWA Installation: ${outcome}`, {
      platform: this.state.platform,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    })
  }

  public dismissInstallPrompt() {
    this.state.showInstallPrompt = false
    this.notifyListeners()
    
    // Don't show again for 24 hours
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  public shouldShowInstallPrompt(): boolean {
    if (this.state.isInstalled || !this.state.isInstallable) {
      return false
    }

    // Check if user dismissed recently
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10)
      const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60)
      if (hoursSinceDismissed < 24) {
        return false
      }
    }

    return this.state.showInstallPrompt
  }

  public isInstalled(): boolean {
    return this.state.isInstalled
  }

  public subscribe(listener: (state: PWAInstallState) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.state }))
  }

  public getState(): PWAInstallState {
    return { ...this.state }
  }
}

// Singleton instance
export const pwaInstallManager = new PWAInstallManager()

// React Hook
export function usePWAInstall() {
  const [state, setState] = React.useState(pwaInstallManager.getState())

  React.useEffect(() => {
    return pwaInstallManager.subscribe(setState)
  }, [])

  return {
    ...state,
    install: () => pwaInstallManager.install(),
    dismiss: () => pwaInstallManager.dismissInstallPrompt(),
    shouldShow: () => pwaInstallManager.shouldShowInstallPrompt(),
  }
}

// Utility functions
export const isPWAInstalled = (): boolean => {
  return pwaInstallManager.isInstalled()
}

export const canInstallPWA = (): boolean => {
  return pwaInstallManager.getState().isInstallable
}

export const installPWA = async (): Promise<boolean> => {
  return await pwaInstallManager.install()
}