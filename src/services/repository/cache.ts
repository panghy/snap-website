import type { CacheEntry } from '../../types/repository';

interface CacheOptions {
  maxSize?: number;
}

interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
}

interface StaleCheckResult<T> {
  data: T | null;
  isStale: boolean;
  shouldRevalidate: boolean;
}

export class CacheService<T> {
  private memoryCache: Map<string, CacheEntry<T>>;
  private maxSize: number;
  private hits: number = 0;
  private misses: number = 0;
  private accessOrder: string[] = [];

  constructor(options: CacheOptions = {}) {
    this.memoryCache = new Map();
    this.maxSize = options.maxSize || Infinity;
  }

  /**
   * Get cached data
   */
  get(key: string): T | null {
    // Try memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry) {
      if (this.isExpired(memoryEntry)) {
        this.memoryCache.delete(key);
      } else {
        this.hits++;
        this.updateAccessOrder(key);
        return memoryEntry.data;
      }
    }

    // Try localStorage
    const cacheKey = `cache-${key}`;
    const stored = localStorage.getItem(cacheKey);
    if (stored) {
      try {
        const entry: CacheEntry<T> = JSON.parse(stored);
        if (!this.isExpired(entry)) {
          // Restore to memory cache
          this.memoryCache.set(key, entry);
          this.hits++;
          this.updateAccessOrder(key);
          return entry.data;
        } else {
          // Clean up expired entry
          localStorage.removeItem(cacheKey);
        }
      } catch {
        // Invalid cache entry
        localStorage.removeItem(cacheKey);
      }
    }

    this.misses++;
    return null;
  }

  /**
   * Set cache data with TTL
   */
  set(key: string, data: T, ttl: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };

    // Handle LRU eviction if needed
    if (this.memoryCache.size >= this.maxSize && !this.memoryCache.has(key)) {
      this.evictLRU();
    }

    // Store in memory
    this.memoryCache.set(key, entry);
    this.updateAccessOrder(key);

    // Store in localStorage
    const cacheKey = `cache-${key}`;
    localStorage.setItem(cacheKey, JSON.stringify(entry));
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.memoryCache.delete(key);
    localStorage.removeItem(`cache-${key}`);
    this.removeFromAccessOrder(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.memoryCache.clear();
    // Clear all cache entries from localStorage
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('cache-')) {
        keys.push(key);
      }
    }
    keys.forEach(key => localStorage.removeItem(key));
    this.accessOrder = [];
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get data with stale check for stale-while-revalidate pattern
   */
  getWithStaleCheck(key: string, staleTime: number): StaleCheckResult<T> {
    const memoryEntry = this.memoryCache.get(key);
    const localStorageKey = `cache-${key}`;
    const stored = localStorage.getItem(localStorageKey);

    let entry: CacheEntry<T> | null = null;

    if (memoryEntry) {
      entry = memoryEntry;
    } else if (stored) {
      try {
        entry = JSON.parse(stored);
        if (entry) {
          this.memoryCache.set(key, entry);
        }
      } catch {
        // Invalid entry
      }
    }

    if (!entry) {
      return {
        data: null,
        isStale: false,
        shouldRevalidate: true
      };
    }

    const age = Date.now() - entry.timestamp;
    const isExpired = age > entry.ttl;
    const isStale = age > (entry.ttl - staleTime);

    if (isExpired) {
      this.invalidate(key);
      return {
        data: null,
        isStale: false,
        shouldRevalidate: true
      };
    }

    this.hits++;
    this.updateAccessOrder(key);

    return {
      data: entry.data,
      isStale,
      shouldRevalidate: isStale
    };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      size: this.memoryCache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0
    };
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Update access order for LRU
   */
  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  /**
   * Remove from access order
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Evict least recently used item
   */
  private evictLRU(): void {
    if (this.accessOrder.length > 0) {
      const lruKey = this.accessOrder[0];
      this.invalidate(lruKey);
    }
  }
}