import type { CacheEntry, GitHubMetrics } from '../types/snap';

export class CacheService {
  private static readonly CACHE_PREFIX = 'snap_cache_';
  private static readonly DEFAULT_TTL = 60 * 60 * 1000; // 1 hour

  /**
   * Get cached metrics for repository
   */
  static get(repositoryUrl: string): GitHubMetrics | null {
    try {
      const key = this.getCacheKey(repositoryUrl);
      const cached = localStorage.getItem(key);

      if (!cached) return null;

      const entry: CacheEntry = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is expired
      if (now - entry.timestamp > entry.ttl) {
        this.remove(repositoryUrl);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Store metrics in cache
   */
  static set(
    repositoryUrl: string,
    metrics: GitHubMetrics,
    ttl: number = this.DEFAULT_TTL
  ): void {
    try {
      const key = this.getCacheKey(repositoryUrl);
      const entry: CacheEntry = {
        repository: repositoryUrl,
        data: metrics,
        timestamp: Date.now(),
        ttl,
      };

      localStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.error('Cache set error:', error);
      // If storage is full, try to prune old entries
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.prune();
        // Try again
        try {
          const key = this.getCacheKey(repositoryUrl);
          localStorage.setItem(key, JSON.stringify({
            repository: repositoryUrl,
            data: metrics,
            timestamp: Date.now(),
            ttl,
          }));
        } catch {
          // Give up if still failing
        }
      }
    }
  }

  /**
   * Remove specific cache entry
   */
  static remove(repositoryUrl: string): void {
    const key = this.getCacheKey(repositoryUrl);
    localStorage.removeItem(key);
  }

  /**
   * Clear all cached entries
   */
  static clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Remove expired entries
   */
  static prune(): void {
    const keys = Object.keys(localStorage);
    const now = Date.now();

    keys.forEach(key => {
      if (key.startsWith(this.CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const entry: CacheEntry = JSON.parse(cached);
            if (now - entry.timestamp > entry.ttl) {
              localStorage.removeItem(key);
            }
          }
        } catch {
          // Remove invalid entries
          localStorage.removeItem(key);
        }
      }
    });
  }

  /**
   * Get cache statistics
   */
  static getStats(): {
    totalEntries: number;
    totalSize: number;
    oldestEntry: Date | null;
  } {
    const keys = Object.keys(localStorage);
    let totalEntries = 0;
    let totalSize = 0;
    let oldestTimestamp: number | null = null;

    keys.forEach(key => {
      if (key.startsWith(this.CACHE_PREFIX)) {
        totalEntries++;
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += key.length + value.length;
          try {
            const entry: CacheEntry = JSON.parse(value);
            if (!oldestTimestamp || entry.timestamp < oldestTimestamp) {
              oldestTimestamp = entry.timestamp;
            }
          } catch {
            // Ignore invalid entries
          }
        }
      }
    });

    return {
      totalEntries,
      totalSize,
      oldestEntry: oldestTimestamp ? new Date(oldestTimestamp) : null,
    };
  }

  /**
   * Generate cache key from repository URL
   */
  private static getCacheKey(repositoryUrl: string): string {
    // Simple hash to create a valid localStorage key
    const hash = repositoryUrl
      .split('')
      .reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0)
      .toString(36);

    return `${this.CACHE_PREFIX}${hash}`;
  }
}