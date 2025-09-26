import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRepositoryMetadata } from './useRepositoryMetadata';
import { Repository, RepositoryPlatform } from '../types/repository';

// Create mock function that will be hoisted
const { mockFetchRepositoryMetadata } = vi.hoisted(() => ({
  mockFetchRepositoryMetadata: vi.fn()
}));

// Mock the repository service
vi.mock('../services/repository/repository.service', () => ({
  RepositoryService: class {
    fetchRepositoryMetadata = mockFetchRepositoryMetadata;
  }
}));

describe('useRepositoryMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch repository metadata on mount', async () => {
    const repository: Repository = {
      url: 'https://github.com/user/repo',
      platform: RepositoryPlatform.GITHUB,
      owner: 'user',
      name: 'repo'
    };

    const mockMetadata = {
      stars: 100,
      description: 'Test repo',
      primaryLanguage: 'TypeScript',
      lastUpdated: '2024-01-20T10:00:00Z',
      forks: 20,
      openIssues: 5,
      defaultBranch: 'main'
    };

    mockFetchRepositoryMetadata.mockResolvedValue(mockMetadata);

    const { result } = renderHook(() => useRepositoryMetadata(repository));

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.metadata).toBeNull();
    expect(result.current.error).toBeNull();

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metadata).toEqual(mockMetadata);
    expect(result.current.error).toBeNull();
    expect(mockFetchRepositoryMetadata).toHaveBeenCalledWith(repository);
  });

  it('should handle fetch errors gracefully', async () => {
    const repository: Repository = {
      url: 'https://gitlab.com/user/repo',
      platform: RepositoryPlatform.GITLAB,
      owner: 'user',
      name: 'repo'
    };

    const mockError = new Error('Failed to fetch');
    mockFetchRepositoryMetadata.mockRejectedValue(mockError);

    const { result } = renderHook(() => useRepositoryMetadata(repository));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metadata).toBeNull();
    expect(result.current.error).toBe(mockError.message);
  });

  it('should use cached data if available and not expired', async () => {
    const repository: Repository = {
      url: 'https://github.com/user/repo',
      platform: RepositoryPlatform.GITHUB,
      owner: 'user',
      name: 'repo'
    };

    const cachedMetadata = {
      stars: 150,
      description: 'Cached repo',
      primaryLanguage: 'JavaScript',
      lastUpdated: '2024-01-19T10:00:00Z',
      forks: 30,
      openIssues: 10,
      defaultBranch: 'main'
    };

    // Set cached data in localStorage
    const cacheKey = `repo-metadata-${repository.platform}-${repository.owner}-${repository.name}`;
    const cacheEntry = {
      data: cachedMetadata,
      timestamp: Date.now() - 60000, // 1 minute ago
      ttl: 300000 // 5 minutes
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));

    // Mock shouldn't be called as we use cached data
    mockFetchRepositoryMetadata.mockImplementation(vi.fn());

    const { result } = renderHook(() => useRepositoryMetadata(repository));

    // Should immediately return cached data
    expect(result.current.loading).toBe(false);
    expect(result.current.metadata).toEqual(cachedMetadata);
    expect(result.current.error).toBeNull();

    // Should not fetch new data
    await waitFor(() => {
      expect(mockFetchRepositoryMetadata).not.toHaveBeenCalled();
    });
  });

  it('should refetch if cached data is expired', async () => {
    const repository: Repository = {
      url: 'https://gitlab.com/group/project',
      platform: RepositoryPlatform.GITLAB,
      owner: 'group',
      name: 'project'
    };

    const oldCachedMetadata = {
      stars: 50,
      description: 'Old cached data',
      lastUpdated: '2024-01-01T00:00:00Z',
      forks: 10,
      openIssues: 2,
      defaultBranch: 'main'
    };

    const newMetadata = {
      stars: 75,
      description: 'Updated data',
      primaryLanguage: 'Python',
      lastUpdated: '2024-01-20T12:00:00Z',
      forks: 15,
      openIssues: 3,
      defaultBranch: 'main'
    };

    // Set expired cached data (but within stale-while-revalidate window)
    const cacheKey = `repo-metadata-${repository.platform}-${repository.owner}-${repository.name}`;
    const ttl = 300000; // 5 minutes
    const cacheEntry = {
      data: oldCachedMetadata,
      timestamp: Date.now() - (ttl + 1000), // Just expired, but within 2x ttl
      ttl: ttl
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));

    mockFetchRepositoryMetadata.mockResolvedValue(newMetadata);

    const { result } = renderHook(() => useRepositoryMetadata(repository));

    // Should start with expired cached data (stale-while-revalidate) and loading state
    expect(result.current.loading).toBe(true);
    expect(result.current.metadata).toEqual(oldCachedMetadata);

    // Wait for new fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metadata).toEqual(newMetadata);
    expect(mockFetchRepositoryMetadata).toHaveBeenCalledWith(repository);
  });

  it('should not fetch if repository is null', () => {
    // Clear any previous mock calls
    mockFetchRepositoryMetadata.mockClear();

    const { result } = renderHook(() => useRepositoryMetadata(null));

    expect(result.current.loading).toBe(false);
    expect(result.current.metadata).toBeNull();
    expect(result.current.error).toBeNull();
    expect(mockFetchRepositoryMetadata).not.toHaveBeenCalled();
  });

  it('should provide a refetch function', async () => {
    const repository: Repository = {
      url: 'https://github.com/user/repo',
      platform: RepositoryPlatform.GITHUB,
      owner: 'user',
      name: 'repo'
    };

    const firstMetadata = {
      stars: 100,
      lastUpdated: '2024-01-19T10:00:00Z',
      forks: 20,
      openIssues: 5,
      defaultBranch: 'main'
    };

    const secondMetadata = {
      stars: 110,
      lastUpdated: '2024-01-20T10:00:00Z',
      forks: 22,
      openIssues: 4,
      defaultBranch: 'main'
    };

    mockFetchRepositoryMetadata
      .mockResolvedValueOnce(firstMetadata)
      .mockResolvedValueOnce(secondMetadata);

    const { result } = renderHook(() => useRepositoryMetadata(repository));

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metadata).toEqual(firstMetadata);

    // Clear cache to force actual refetch
    localStorage.clear();

    // Trigger refetch
    result.current.refetch();

    // Wait for refetch to complete (metadata should change)
    await waitFor(() => {
      expect(result.current.metadata).toEqual(secondMetadata);
    });

    expect(result.current.loading).toBe(false);
    expect(mockFetchRepositoryMetadata).toHaveBeenCalledTimes(2);
  });
});