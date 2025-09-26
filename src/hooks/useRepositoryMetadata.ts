import { useState, useEffect, useCallback } from 'react';
import type { Repository, RepositoryMetadata } from '../types/repository';
import { RepositoryService } from '../services/repository/repository.service';

interface UseRepositoryMetadataResult {
  metadata: RepositoryMetadata | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const repositoryService = new RepositoryService();

export function useRepositoryMetadata(
  repository: Repository | null
): UseRepositoryMetadataResult {
  const [metadata, setMetadata] = useState<RepositoryMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = useCallback(async () => {
    if (!repository) {
      setMetadata(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Check localStorage cache first for immediate display
    const cacheKey = `repo-metadata-${repository.platform}-${repository.owner}-${repository.name}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      try {
        const cached = JSON.parse(cachedData);
        const age = Date.now() - cached.timestamp;

        // If cache is fresh enough, use it immediately
        if (age < cached.ttl) {
          setMetadata(cached.data);
          setLoading(false);
          return;
        }

        // If cache is stale but not too old, show it while fetching new data
        if (age < cached.ttl * 2) {
          setMetadata(cached.data);
        }
      } catch {
        // Invalid cache, ignore
      }
    }

    try {
      const data = await repositoryService.fetchRepositoryMetadata(repository);
      setMetadata(data);
      setError(null);

      // Update localStorage cache
      const cacheEntry = {
        data,
        timestamp: Date.now(),
        ttl: 300000 // 5 minutes
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch repository metadata';
      setError(message);

      // Keep stale data if available
      if (!metadata) {
        setMetadata(null);
      }
    } finally {
      setLoading(false);
    }
  }, [repository]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  const refetch = useCallback(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  return {
    metadata,
    loading,
    error,
    refetch
  };
}