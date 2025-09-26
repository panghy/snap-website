import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitLabClient } from './gitlab-client';
import { Repository, RepositoryPlatform } from '../../types/repository';

describe('GitLabClient', () => {
  let client: GitLabClient;

  beforeEach(() => {
    client = new GitLabClient();
    vi.clearAllMocks();
  });

  describe('GitLab API client with CORS', () => {
    it('should fetch GitLab repository metadata with proper headers', async () => {
      const repository: Repository = {
        url: 'https://gitlab.com/gitlab-org/gitlab',
        platform: RepositoryPlatform.GITLAB,
        owner: 'gitlab-org',
        name: 'gitlab'
      };

      const mockResponse = {
        star_count: 2500,
        description: 'GitLab CE Mirror',
        forks_count: 1200,
        open_issues_count: 150,
        last_activity_at: '2024-01-20T10:00:00Z',
        default_branch: 'master'
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
        'https://gitlab.com/api/v4/projects/gitlab-org%2Fgitlab',
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          },
          mode: 'cors'
        }
      );

      expect(metadata.stars).toBe(2500);
      expect(metadata.description).toBe('GitLab CE Mirror');
    });

    it('should handle GitLab group/subgroup projects', async () => {
      const repository: Repository = {
        url: 'https://gitlab.com/group/subgroup/project',
        platform: RepositoryPlatform.GITLAB,
        owner: 'group/subgroup',
        name: 'project'
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          star_count: 50,
          forks_count: 10,
          open_issues_count: 5,
          last_activity_at: '2024-01-15T12:00:00Z',
          default_branch: 'main'
        })
      });

      await client.fetchMetadata(repository);

      expect(fetch).toHaveBeenCalledWith(
        'https://gitlab.com/api/v4/projects/group%2Fsubgroup%2Fproject',
        expect.any(Object)
      );
    });

    it('should fetch languages separately and determine primary language', async () => {
      const repository: Repository = {
        url: 'https://gitlab.com/user/project',
        platform: RepositoryPlatform.GITLAB,
        owner: 'user',
        name: 'project'
      };

      // Mock project API response
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            star_count: 100,
            forks_count: 20,
            open_issues_count: 10,
            last_activity_at: '2024-01-10T08:00:00Z',
            default_branch: 'main'
          })
        })
        // Mock languages API response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            'TypeScript': 65.5,
            'JavaScript': 20.3,
            'CSS': 10.2,
            'HTML': 4.0
          })
        })
        // Mock releases API response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ([
            { tag_name: 'v1.0.0' }
          ])
        });

      const metadata = await client.fetchMetadata(repository);

      expect(fetch).toHaveBeenCalledTimes(3);
      expect(fetch).toHaveBeenNthCalledWith(2,
        'https://gitlab.com/api/v4/projects/user%2Fproject/languages',
        expect.any(Object)
      );
      expect(fetch).toHaveBeenNthCalledWith(3,
        'https://gitlab.com/api/v4/projects/user%2Fproject/releases',
        expect.any(Object)
      );
      expect(metadata.primaryLanguage).toBe('TypeScript');
      expect(metadata.lastRelease).toBe('v1.0.0');
    });

    it('should handle CORS preflight requests', async () => {
      const repository: Repository = {
        url: 'https://gitlab.com/user/project',
        platform: RepositoryPlatform.GITLAB,
        owner: 'user',
        name: 'project'
      };

      // Simulate CORS preflight
      global.fetch = vi.fn().mockImplementation((url, options) => {
        if (options?.method === 'OPTIONS') {
          return Promise.resolve({
            ok: true,
            headers: new Headers({
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, OPTIONS'
            })
          });
        }
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
      });

      const metadata = await client.fetchMetadata(repository);

      expect(metadata).toBeDefined();
      expect(metadata.stars).toBe(10);
    });
  });

  describe('GitLab field mapping', () => {
    it('should correctly map GitLab fields to normalized structure', () => {
      const gitlabData = {
        star_count: 150,
        description: 'A test project',
        forks_count: 30,
        open_issues_count: 8,
        last_activity_at: '2024-01-18T14:30:00Z',
        default_branch: 'develop',
        web_url: 'https://gitlab.com/user/project'
      };

      const metadata = client.mapGitLabToMetadata(gitlabData, 'Python');

      expect(metadata).toEqual({
        stars: 150,
        description: 'A test project',
        primaryLanguage: 'Python',
        lastUpdated: '2024-01-18T14:30:00Z',
        forks: 30,
        openIssues: 8,
        defaultBranch: 'develop'
      });
    });

    it('should handle null/undefined description gracefully', () => {
      const gitlabData = {
        star_count: 0,
        description: null,
        forks_count: 0,
        open_issues_count: 0,
        last_activity_at: '2024-01-01T00:00:00Z',
        default_branch: 'main'
      };

      const metadata = client.mapGitLabToMetadata(gitlabData, null);

      expect(metadata.description).toBeUndefined();
      expect(metadata.primaryLanguage).toBeUndefined();
    });

    it('should truncate long descriptions to 500 characters', () => {
      const longDescription = 'a'.repeat(600);
      const gitlabData = {
        star_count: 10,
        description: longDescription,
        forks_count: 2,
        open_issues_count: 1,
        last_activity_at: '2024-01-01T00:00:00Z',
        default_branch: 'main'
      };

      const metadata = client.mapGitLabToMetadata(gitlabData, 'Go');

      expect(metadata.description).toHaveLength(500);
      expect(metadata.description).toBe('a'.repeat(497) + '...');
    });
  });
});