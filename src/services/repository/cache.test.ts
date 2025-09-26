import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CacheService } from './cache';
import { RepositoryMetadata } from '../../types/repository';

describe('CacheService', () => {
  let cache: CacheService<RepositoryMetadata>;
  const mockMetadata: RepositoryMetadata = {
    stars: 100,
    description: 'Test repository',
    primaryLanguage: 'TypeScript',
    lastUpdated: '2024-01-20T10:00:00Z',
    forks: 20,
    openIssues: 5,
    defaultBranch: 'main'
  };

  beforeEach(() => {
    cache = new CacheService<RepositoryMetadata>();
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Cache layer with TTL', () => {
    it('should store data in cache with TTL', () => {
      const key = 'test-repo';
      const ttl = 300000; // 5 minutes

      cache.set(key, mockMetadata, ttl);

      const cached = cache.get(key);
      expect(cached).toEqual(mockMetadata);
    });

    it('should return null for expired cache entries', () => {
      const key = 'test-repo';
      const ttl = 300000; // 5 minutes

      cache.set(key, mockMetadata, ttl);

      // Advance time beyond TTL
      vi.advanceTimersByTime(ttl + 1000);

      const cached = cache.get(key);
      expect(cached).toBeNull();
    });

    it('should return cached data if not expired', () => {
      const key = 'test-repo';
      const ttl = 300000; // 5 minutes

      cache.set(key, mockMetadata, ttl);

      // Advance time but not beyond TTL
      vi.advanceTimersByTime(ttl - 1000);

      const cached = cache.get(key);
      expect(cached).toEqual(mockMetadata);
    });

    it('should invalidate specific cache entries', () => {
      const key1 = 'repo-1';
      const key2 = 'repo-2';
      const ttl = 300000;

      cache.set(key1, mockMetadata, ttl);
      cache.set(key2, { ...mockMetadata, stars: 200 }, ttl);

      cache.invalidate(key1);

      expect(cache.get(key1)).toBeNull();
      expect(cache.get(key2)).toBeTruthy();
      expect(cache.get(key2)?.stars).toBe(200);
    });

    it('should clear all cache entries', () => {
      const keys = ['repo-1', 'repo-2', 'repo-3'];
      const ttl = 300000;

      keys.forEach(key => {
        cache.set(key, mockMetadata, ttl);
      });

      cache.clear();

      keys.forEach(key => {
        expect(cache.get(key)).toBeNull();
      });
    });

    it('should persist cache to localStorage', () => {
      const key = 'test-repo';
      const ttl = 300000;

      cache.set(key, mockMetadata, ttl);

      const stored = localStorage.getItem(`cache-${key}`);
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.data).toEqual(mockMetadata);
      expect(parsed.ttl).toBe(ttl);
    });

    it('should load cache from localStorage', () => {
      const key = 'test-repo';
      const ttl = 300000;
      const timestamp = Date.now();

      const cacheEntry = {
        data: mockMetadata,
        timestamp,
        ttl
      };

      localStorage.setItem(`cache-${key}`, JSON.stringify(cacheEntry));

      const cached = cache.get(key);
      expect(cached).toEqual(mockMetadata);
    });

    it('should handle stale-while-revalidate pattern', () => {
      const key = 'test-repo';
      const ttl = 300000;
      const staleTime = 60000; // 1 minute

      cache.set(key, mockMetadata, ttl);

      // Advance time to stale but not expired (add 1ms to make it strictly greater)
      vi.advanceTimersByTime(ttl - staleTime + 1);

      const result = cache.getWithStaleCheck(key, staleTime);
      expect(result.data).toEqual(mockMetadata);
      expect(result.isStale).toBe(true);
      expect(result.shouldRevalidate).toBe(true);
    });

    it('should handle concurrent access to same key', () => {
      const key = 'test-repo';
      const ttl = 300000;

      // Simulate concurrent writes
      cache.set(key, mockMetadata, ttl);
      cache.set(key, { ...mockMetadata, stars: 200 }, ttl);

      const cached = cache.get(key);
      expect(cached?.stars).toBe(200);
    });

    it('should provide cache statistics', () => {
      const keys = ['repo-1', 'repo-2', 'repo-3'];
      const ttl = 300000;

      keys.forEach((key, index) => {
        cache.set(key, { ...mockMetadata, stars: (index + 1) * 100 }, ttl);
      });

      const stats = cache.getStats();
      expect(stats.size).toBe(3);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);

      // Access cache to update stats
      cache.get('repo-1'); // hit
      cache.get('repo-2'); // hit
      cache.get('repo-missing'); // miss

      const updatedStats = cache.getStats();
      expect(updatedStats.hits).toBe(2);
      expect(updatedStats.misses).toBe(1);
      expect(updatedStats.hitRate).toBe(2 / 3);
    });

    it('should implement LRU eviction when cache size limit reached', () => {
      const maxSize = 3;
      const limitedCache = new CacheService<RepositoryMetadata>({ maxSize });
      const ttl = 300000;

      // Fill cache to limit
      limitedCache.set('repo-1', { ...mockMetadata, stars: 100 }, ttl);
      limitedCache.set('repo-2', { ...mockMetadata, stars: 200 }, ttl);
      limitedCache.set('repo-3', { ...mockMetadata, stars: 300 }, ttl);

      // Access repo-1 to make it recently used
      limitedCache.get('repo-1');

      // Add new item, should evict least recently used (repo-2)
      limitedCache.set('repo-4', { ...mockMetadata, stars: 400 }, ttl);

      expect(limitedCache.get('repo-1')).toBeTruthy();
      expect(limitedCache.get('repo-2')).toBeNull(); // Evicted
      expect(limitedCache.get('repo-3')).toBeTruthy();
      expect(limitedCache.get('repo-4')).toBeTruthy();
    });
  });
});