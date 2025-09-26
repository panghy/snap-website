import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RepositoryService } from './repository.service';
import { Repository, RepositoryPlatform } from '../../types/repository';

describe('RepositoryService', () => {
  let service: RepositoryService;

  beforeEach(() => {
    service = new RepositoryService();
    // Clear any cached data
    vi.clearAllMocks();
  });

  describe('Repository metadata normalization', () => {
    it('should normalize GitLab API response to standard metadata', () => {
      const gitlabResponse = {
        star_count: 100,
        description: 'Test project',
        forks_count: 20,
        open_issues_count: 5,
        last_activity_at: '2024-01-15T10:30:00Z',
        default_branch: 'main'
      };

      const metadata = service.normalizeGitLabMetadata(gitlabResponse, 'TypeScript');

      expect(metadata).toEqual({
        stars: 100,
        description: 'Test project',
        primaryLanguage: 'TypeScript',
        lastUpdated: '2024-01-15T10:30:00Z',
        forks: 20,
        openIssues: 5,
        defaultBranch: 'main'
      });
    });

    it('should normalize GitHub API response to standard metadata', () => {
      const githubResponse = {
        stargazers_count: 200,
        description: 'Another test project',
        language: 'JavaScript',
        forks_count: 30,
        open_issues_count: 10,
        updated_at: '2024-01-20T15:45:00Z',
        default_branch: 'master'
      };

      const metadata = service.normalizeGitHubMetadata(githubResponse);

      expect(metadata).toEqual({
        stars: 200,
        description: 'Another test project',
        primaryLanguage: 'JavaScript',
        lastUpdated: '2024-01-20T15:45:00Z',
        forks: 30,
        openIssues: 10,
        defaultBranch: 'master'
      });
    });

    it('should handle missing optional fields in metadata', () => {
      const gitlabResponse = {
        star_count: 0,
        description: null,
        forks_count: 0,
        open_issues_count: 0,
        last_activity_at: '2024-01-01T00:00:00Z',
        default_branch: 'main'
      };

      const metadata = service.normalizeGitLabMetadata(gitlabResponse, null);

      expect(metadata.description).toBeUndefined();
      expect(metadata.primaryLanguage).toBeUndefined();
      expect(metadata.stars).toBe(0);
    });
  });

  describe('Runtime fetch error handling', () => {
    it('should handle 404 errors for non-existent repositories', async () => {
      const repository: Repository = {
        url: 'https://gitlab.com/nonexistent/repo',
        platform: RepositoryPlatform.GITLAB,
        owner: 'nonexistent',
        name: 'repo'
      };

      // Mock fetch to return 404
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(service.fetchRepositoryMetadata(repository)).rejects.toThrow(
        'Repository not found or private'
      );
    });

    it('should handle rate limiting (429) errors', async () => {
      const repository: Repository = {
        url: 'https://github.com/user/repo',
        platform: RepositoryPlatform.GITHUB,
        owner: 'user',
        name: 'repo'
      };

      // Mock fetch to return 429
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Headers({
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Date.now() / 1000 + 3600)
        })
      });

      await expect(service.fetchRepositoryMetadata(repository)).rejects.toThrow(
        /Rate limit exceeded/
      );
    });

    it('should handle network errors gracefully', async () => {
      const repository: Repository = {
        url: 'https://gitlab.com/user/repo',
        platform: RepositoryPlatform.GITLAB,
        owner: 'user',
        name: 'repo'
      };

      // Mock fetch to throw network error for all retry attempts
      global.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('Network request failed'))
        .mockRejectedValueOnce(new Error('Network request failed'))
        .mockRejectedValueOnce(new Error('Network request failed'));

      await expect(service.fetchRepositoryMetadata(repository)).rejects.toThrow(
        'Network request failed'
      );
    });

    it('should handle CORS errors appropriately', async () => {
      const repository: Repository = {
        url: 'https://github.com/user/repo',
        platform: RepositoryPlatform.GITHUB,
        owner: 'user',
        name: 'repo'
      };

      // Mock fetch to simulate CORS error for all retry attempts
      global.fetch = vi.fn()
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(service.fetchRepositoryMetadata(repository)).rejects.toThrow(
        'Failed to fetch'
      );
    });

    it('should retry on transient failures with exponential backoff', async () => {
      const repository: Repository = {
        url: 'https://gitlab.com/user/repo',
        platform: RepositoryPlatform.GITLAB,
        owner: 'user',
        name: 'repo'
      };

      let retryAttempts = 0;
      global.fetch = vi.fn().mockImplementation((url) => {
        // Track retry attempts only for the main project API call
        if (url.includes('/projects/') && !url.includes('/languages') && !url.includes('/releases')) {
          retryAttempts++;
          if (retryAttempts < 3) {
            return Promise.resolve({
              ok: false,
              status: 503,
              statusText: 'Service Unavailable'
            });
          }
          // Main project API success on 3rd attempt
          return Promise.resolve({
            ok: true,
            json: async () => ({
              star_count: 10,
              forks_count: 2,
              open_issues_count: 1,
              last_activity_at: '2024-01-01T00:00:00Z',
              default_branch: 'main'
            })
          });
        }

        // Success responses for subsequent API calls
        if (url.includes('/languages')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ 'Go': 100 })
          });
        } else if (url.includes('/releases')) {
          return Promise.resolve({
            ok: true,
            json: async () => ([])
          });
        }

        // Default response (shouldn't be reached)
        return Promise.resolve({
          ok: true,
          json: async () => ({})
        });
      });

      const metadata = await service.fetchRepositoryMetadata(repository);

      expect(retryAttempts).toBe(3);
      expect(metadata.stars).toBe(10);
    });
  });
});