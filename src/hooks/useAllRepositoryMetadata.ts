import { useState, useEffect, useCallback } from 'react';
import type { Repository, RepositoryMetadata } from '../types/repository';
import { RepositoryService } from '../services/repository/repository.service';
import type { SnapEntry } from '../types/snap';

interface UseAllRepositoryMetadataResult {
  metadata: Map<string, RepositoryMetadata>;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const repositoryService = new RepositoryService();

export function useAllRepositoryMetadata(
  snaps: SnapEntry[]
): UseAllRepositoryMetadataResult {
  const [metadata, setMetadata] = useState<Map<string, RepositoryMetadata>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllMetadata = useCallback(async () => {
    if (!snaps || snaps.length === 0) {
      setMetadata(new Map());
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const metadataMap = new Map<string, RepositoryMetadata>();
    const fetchPromises: Promise<void>[] = [];

    // Process each snap's repository
    for (const snap of snaps) {
      if (!snap.repository) continue;

      let repository: Repository | null = null;

      if (typeof snap.repository === 'string') {
        // Parse string repository URL
        const parsed = repositoryService.parseRepositoryURL(snap.repository);
        if (parsed) {
          repository = {
            ...parsed,
            url: snap.repository
          };
        }
      } else {
        repository = snap.repository;
      }

      if (repository) {
        const snapId = snap.id || snap.name;

        // Check localStorage cache first
        const cacheKey = `repo-metadata-${repository.platform}-${repository.owner}-${repository.name}`;
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
          try {
            const cached = JSON.parse(cachedData);
            const age = Date.now() - cached.timestamp;

            // If cache is fresh, use it
            if (age < cached.ttl) {
              metadataMap.set(snapId, cached.data);
              continue; // Skip fetching for this repo
            }
          } catch {
            // Invalid cache, fetch fresh data
          }
        }

        // Fetch fresh metadata
        const promise = repositoryService
          .fetchRepositoryMetadata(repository)
          .then(data => {
            metadataMap.set(snapId, data);

            // Update localStorage cache
            const cacheEntry = {
              data,
              timestamp: Date.now(),
              ttl: 300000 // 5 minutes
            };
            localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
          })
          .catch(err => {
            console.warn(`Failed to fetch metadata for ${repository.owner}/${repository.name}:`, err);
            // Don't fail the whole batch for one error
          });

        fetchPromises.push(promise);
      }
    }

    try {
      // Fetch all metadata in parallel (with batching to avoid rate limits)
      const batchSize = 5;
      for (let i = 0; i < fetchPromises.length; i += batchSize) {
        const batch = fetchPromises.slice(i, i + batchSize);
        await Promise.all(batch);

        // Update state incrementally for better UX
        setMetadata(new Map(metadataMap));

        // Small delay between batches to avoid rate limiting
        if (i + batchSize < fetchPromises.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch repository metadata';
      setError(message);
    } finally {
      setLoading(false);
      setMetadata(new Map(metadataMap));
    }
  }, [snaps]);

  useEffect(() => {
    fetchAllMetadata();
  }, [fetchAllMetadata]);

  const refetch = useCallback(() => {
    // Clear cache and refetch
    snaps.forEach(snap => {
      if (snap.repository) {
        const repo = typeof snap.repository === 'string'
          ? repositoryService.parseRepositoryURL(snap.repository)
          : snap.repository;

        if (repo) {
          const cacheKey = `repo-metadata-${repo.platform}-${repo.owner}-${repo.name}`;
          localStorage.removeItem(cacheKey);
        }
      }
    });

    fetchAllMetadata();
  }, [fetchAllMetadata, snaps]);

  return {
    metadata,
    loading,
    error,
    refetch
  };
}