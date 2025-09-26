import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubClient } from './github-client';
import { Repository, RepositoryPlatform } from '../../types/repository';

describe('GitHubClient', () => {
  let client: GitHubClient;

  beforeEach(() => {
    client = new GitHubClient();
    vi.clearAllMocks();
  });

  describe('GitHub API client with CORS', () => {
    it('should fetch GitHub repository metadata with proper headers', async () => {
      const repository: Repository = {
        url: 'https://github.com/facebook/react',
        platform: RepositoryPlatform.GITHUB,
        owner: 'facebook',
        name: 'react'
      };

      const mockResponse = {
        stargazers_count: 200000,
        description: 'A JavaScript library for building user interfaces',
        language: 'JavaScript',
        forks_count: 40000,
        open_issues_count: 1200,
        updated_at: '2024-01-20T15:00:00Z',
        default_branch: 'main',
        html_url: 'https://github.com/facebook/react'
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers({
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        })
      });

      const metadata = await client.fetchMetadata(repository);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/facebook/react',
        {
          method: 'GET',
          headers: {
            'Accept': 'application/vnd.github.v3+json'
          },
          mode: 'cors'
        }
      );

      expect(metadata.stars).toBe(200000);
      expect(metadata.primaryLanguage).toBe('JavaScript');
    });

    it('should handle GitHub organizations correctly', async () => {
      const repository: Repository = {
        url: 'https://github.com/microsoft/vscode',
        platform: RepositoryPlatform.GITHUB,
        owner: 'microsoft',
        name: 'vscode'
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          stargazers_count: 150000,
          language: 'TypeScript',
          forks_count: 25000,
          open_issues_count: 5000,
          updated_at: '2024-01-19T10:00:00Z',
          default_branch: 'main'
        })
      });

      await client.fetchMetadata(repository);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/microsoft/vscode',
        expect.any(Object)
      );
    });

    it('should handle missing language field', async () => {
      const repository: Repository = {
        url: 'https://github.com/user/docs',
        platform: RepositoryPlatform.GITHUB,
        owner: 'user',
        name: 'docs'
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          stargazers_count: 50,
          description: 'Documentation repository',
          language: null,
          forks_count: 10,
          open_issues_count: 2,
          updated_at: '2024-01-15T08:00:00Z',
          default_branch: 'main'
        })
      });

      const metadata = await client.fetchMetadata(repository);

      expect(metadata.primaryLanguage).toBeUndefined();
      expect(metadata.stars).toBe(50);
    });

    it('should handle CORS headers correctly', async () => {
      const repository: Repository = {
        url: 'https://github.com/user/repo',
        platform: RepositoryPlatform.GITHUB,
        owner: 'user',
        name: 'repo'
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        headers: new Headers({
          'Access-Control-Allow-Origin': '*',
          'X-RateLimit-Remaining': '60',
          'X-RateLimit-Reset': '1705756800'
        }),
        json: async () => ({
          stargazers_count: 100,
          language: 'Python',
          forks_count: 20,
          open_issues_count: 5,
          updated_at: '2024-01-10T12:00:00Z',
          default_branch: 'master'
        })
      });

      const metadata = await client.fetchMetadata(repository);

      expect(metadata).toBeDefined();
      expect(metadata.stars).toBe(100);
    });
  });

  describe('GitHub field mapping', () => {
    it('should correctly map GitHub fields to normalized structure', () => {
      const githubData = {
        stargazers_count: 500,
        description: 'An awesome project',
        language: 'Rust',
        forks_count: 100,
        open_issues_count: 25,
        updated_at: '2024-01-18T16:45:00Z',
        default_branch: 'main'
      };

      const metadata = client.mapGitHubToMetadata(githubData);

      expect(metadata).toEqual({
        stars: 500,
        description: 'An awesome project',
        primaryLanguage: 'Rust',
        lastUpdated: '2024-01-18T16:45:00Z',
        forks: 100,
        openIssues: 25,
        defaultBranch: 'main'
      });
    });

    it('should handle null/undefined fields gracefully', () => {
      const githubData = {
        stargazers_count: 0,
        description: null,
        language: null,
        forks_count: 0,
        open_issues_count: 0,
        updated_at: '2024-01-01T00:00:00Z',
        default_branch: 'master'
      };

      const metadata = client.mapGitHubToMetadata(githubData);

      expect(metadata.description).toBeUndefined();
      expect(metadata.primaryLanguage).toBeUndefined();
      expect(metadata.stars).toBe(0);
    });

    it('should truncate long descriptions to 500 characters', () => {
      const longDescription = 'b'.repeat(600);
      const githubData = {
        stargazers_count: 10,
        description: longDescription,
        language: 'Java',
        forks_count: 2,
        open_issues_count: 1,
        updated_at: '2024-01-01T00:00:00Z',
        default_branch: 'main'
      };

      const metadata = client.mapGitHubToMetadata(githubData);

      expect(metadata.description).toHaveLength(500);
      expect(metadata.description).toBe('b'.repeat(497) + '...');
    });
  });
});