import React from 'react'

// PWA Cache Management for AKBID Lab System
// Implements intelligent caching strategies for offline-first experience

interface CacheEntry {
  data: any
  timestamp: number
  ttl: number // Time to live in milliseconds
  version: number
}

interface CacheStats {
  totalEntries: number
  totalSize: number
  hitRate: number
  lastCleanup: Date
}

class CacheManager {
  private readonly CACHE_PREFIX = 'akbid-lab-'
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
  private hits = 0
  private misses = 0

  // Cache categories with different TTL strategies
  private readonly CACHE_STRATEGIES = {
    user: { ttl: 15 * 60 * 1000, persistent: true },     // 15 minutes
    permissions: { ttl: 30 * 60 * 1000, persistent: true }, // 30 minutes
    courses: { ttl: 60 * 60 * 1000, persistent: false },    // 1 hour
    inventory: { ttl: 10 * 60 * 1000, persistent: false },  // 10 minutes
    schedules: { ttl: 5 * 60 * 1000, persistent: false },   // 5 minutes
    static: { ttl: 24 * 60 * 60 * 1000, persistent: true }, // 24 hours
  }

  constructor() {
    this.setupCleanupInterval()
    this.handleStorageEvents()
  }

  private setupCleanupInterval() {
    // Clean up expired entries every 10 minutes
    setInterval(() => {
      this.cleanup()
    }, 10 * 60 * 1000)
  }

  private handleStorageEvents() {
    // Handle storage events for cross-tab synchronization
    window.addEventListener('storage', (event) => {
      if (event.key?.startsWith(this.CACHE_PREFIX)) {
        // Cache was updated in another tab
        console.log('Cache updated in another tab:', event.key)
      }
    })
  }

  private getCacheKey(category: string, key: string): string {
    return `${this.CACHE_PREFIX}${category}-${key}`
  }

  private getStrategy(category: string) {
    return this.CACHE_STRATEGIES[category as keyof typeof this.CACHE_STRATEGIES] || 
           { ttl: this.DEFAULT_TTL, persistent: false }
  }

  public async set(
    category: string, 
    key: string, 
    data: any, 
    customTTL?: number
  ): Promise<void> {
    const strategy = this.getStrategy(category)
    const ttl = customTTL || strategy.ttl
    
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl,
      version: 1
    }

    const cacheKey = this.getCacheKey(category, key)

    try {
      if ('caches' in window && strategy.persistent) {
        // Use Cache API for persistent data
        await this.setCacheAPI(cacheKey, entry)
      } else {
        // Use localStorage for temporary data
        localStorage.setItem(cacheKey, JSON.stringify(entry))
      }
    } catch (error) {
      console.warn('Failed to cache data:', error)
      // Fallback to memory cache if needed
      this.setMemoryCache(cacheKey, entry)
    }
  }

  public async get<T = any>(category: string, key: string): Promise<T | null> {
    const cacheKey = this.getCacheKey(category, key)
    const strategy = this.getStrategy(category)

    try {
      let entry: CacheEntry | null = null

      if ('caches' in window && strategy.persistent) {
        entry = await this.getCacheAPI(cacheKey)
      } else {
        entry = this.getLocalStorage(cacheKey)
      }

      if (!entry) {
        this.misses++
        return null
      }

      // Check if entry is expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        await this.delete(category, key)
        this.misses++
        return null
      }

      this.hits++
      return entry.data as T
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error)
      this.misses++
      return null
    }
  }

  public async delete(category: string, key: string): Promise<void> {
    const cacheKey = this.getCacheKey(category, key)
    const strategy = this.getStrategy(category)

    try {
      if ('caches' in window && strategy.persistent) {
        await this.deleteCacheAPI(cacheKey)
      } else {
        localStorage.removeItem(cacheKey)
      }
    } catch (error) {
      console.warn('Failed to delete cached data:', error)
    }
  }

  public async clear(category?: string): Promise<void> {
    if (category) {
      // Clear specific category
      const prefix = `${this.CACHE_PREFIX}${category}-`
      
      // Clear from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(prefix)) {
          localStorage.removeItem(key)
        }
      })

      // Clear from Cache API
      if ('caches' in window) {
        const cache = await caches.open('akbid-lab-data')
        const keys = await cache.keys()
        await Promise.all(
          keys
            .filter(request => request.url.includes(prefix))
            .map(request => cache.delete(request))
        )
      }
    } else {
      // Clear all cache
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          localStorage.removeItem(key)
        }
      })

      if ('caches' in window) {
        await caches.delete('akbid-lab-data')
      }
    }
  }

  private async setCacheAPI(key: string, entry: CacheEntry): Promise<void> {
    const cache = await caches.open('akbid-lab-data')
    const response = new Response(JSON.stringify(entry), {
      headers: { 'Content-Type': 'application/json' }
    })
    await cache.put(key, response)
  }

  private async getCacheAPI(key: string): Promise<CacheEntry | null> {
    const cache = await caches.open('akbid-lab-data')
    const response = await cache.match(key)
    
    if (!response) return null
    
    const data = await response.json()
    return data as CacheEntry
  }

  private async deleteCacheAPI(key: string): Promise<void> {
    const cache = await caches.open('akbid-lab-data')
    await cache.delete(key)
  }

  private getLocalStorage(key: string): CacheEntry | null {
    const item = localStorage.getItem(key)
    if (!item) return null
    
    try {
      return JSON.parse(item) as CacheEntry
    } catch {
      localStorage.removeItem(key)
      return null
    }
  }

  private memoryCache = new Map<string, CacheEntry>()

  private setMemoryCache(key: string, entry: CacheEntry): void {
    this.memoryCache.set(key, entry)
  }

  public async cleanup(): Promise<void> {
    const now = Date.now()
    let cleanedCount = 0

    // Cleanup localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.CACHE_PREFIX)) {
        try {
          const entry: CacheEntry = JSON.parse(localStorage.getItem(key) || '{}')
          if (now - entry.timestamp > entry.ttl) {
            localStorage.removeItem(key)
            cleanedCount++
          }
        } catch {
          localStorage.removeItem(key)
          cleanedCount++
        }
      }
    })

    // Cleanup memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cache cleanup: removed ${cleanedCount} expired entries`)
    }
  }

  public getStats(): CacheStats {
    const totalRequests = this.hits + this.misses
    const hitRate = totalRequests > 0 ? this.hits / totalRequests : 0

    return {
      totalEntries: this.getTotalEntries(),
      totalSize: this.getTotalSize(),
      hitRate: Math.round(hitRate * 100) / 100,
      lastCleanup: new Date()
    }
  }

  private getTotalEntries(): number {
    const localStorageEntries = Object.keys(localStorage).filter(key => 
      key.startsWith(this.CACHE_PREFIX)
    ).length
    
    return localStorageEntries + this.memoryCache.size
  }

  private getTotalSize(): number {
    let size = 0
    
    // Calculate localStorage size
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.CACHE_PREFIX)) {
        size += (localStorage.getItem(key) || '').length
      }
    })

    // Calculate memory cache size (approximate)
    for (const entry of this.memoryCache.values()) {
      size += JSON.stringify(entry).length
    }

    return size
  }

  public async preload(resources: Array<{ category: string; key: string; fetcher: () => Promise<any> }>): Promise<void> {
    const preloadPromises = resources.map(async ({ category, key, fetcher }) => {
      try {
        const cached = await this.get(category, key)
        if (!cached) {
          const data = await fetcher()
          await this.set(category, key, data)
        }
      } catch (error) {
        console.warn(`Failed to preload ${category}:${key}`, error)
      }
    })

    await Promise.allSettled(preloadPromises)
  }
}

// Singleton instance
export const cacheManager = new CacheManager()

// Utility functions
export const cache = {
  set: (category: string, key: string, data: any, ttl?: number) => 
    cacheManager.set(category, key, data, ttl),
  
  get: <T = any>(category: string, key: string) => 
    cacheManager.get<T>(category, key),
  
  delete: (category: string, key: string) => 
    cacheManager.delete(category, key),
  
  clear: (category?: string) => 
    cacheManager.clear(category),
  
  stats: () => 
    cacheManager.getStats(),
  
  cleanup: () => 
    cacheManager.cleanup(),

  preload: (resources: Array<{ category: string; key: string; fetcher: () => Promise<any> }>) =>
    cacheManager.preload(resources)
}

// React Hook for cache stats
export function useCacheStats() {
  const [stats, setStats] = React.useState<CacheStats | null>(null)

  React.useEffect(() => {
    const updateStats = () => setStats(cacheManager.getStats())
    updateStats()

    const interval = setInterval(updateStats, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  return stats
}