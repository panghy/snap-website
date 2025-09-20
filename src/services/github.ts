import type { GitHubMetrics } from '../types/snap';

interface GitHubRepo {
  stargazers_count: number;
  updated_at: string;
  archived: boolean;
  open_issues_count: number;
  topics?: string[];
  license?: { name: string };
}

interface GitHubRelease {
  tag_name: string;
  published_at: string;
}

export class GitHubService {
  private static readonly API_BASE = 'https://api.github.com';
  private static readonly CACHE_KEY_PREFIX = 'github_metrics_';
  private static readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

  /**
   * Extract owner and repo from GitHub URL
   */
  private static parseGitHubUrl(url: string): { owner: string; repo: string } | null {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
  }

  /**
   * Fetch repository metrics from GitHub API
   */
  static async fetchRepositoryMetrics(repositoryUrl: string): Promise<GitHubMetrics | null> {
    try {
      // Check cache first
      const cached = this.getCachedMetrics(repositoryUrl);
      if (cached) return cached;

      const parsed = this.parseGitHubUrl(repositoryUrl);
      if (!parsed) {
        console.error('Invalid GitHub URL:', repositoryUrl);
        return null;
      }

      // Fetch repository data
      const repoResponse = await fetch(
        `${this.API_BASE}/repos/${parsed.owner}/${parsed.repo}`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (!repoResponse.ok) {
        if (repoResponse.status === 403) {
          console.warn('GitHub API rate limit exceeded');
        }
        return null;
      }

      const repoData: GitHubRepo = await repoResponse.json();

      // Fetch latest release (optional)
      let lastRelease: string | undefined;
      try {
        const releaseResponse = await fetch(
          `${this.API_BASE}/repos/${parsed.owner}/${parsed.repo}/releases/latest`,
          {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
            },
          }
        );

        if (releaseResponse.ok) {
          const releaseData: GitHubRelease = await releaseResponse.json();
          lastRelease = releaseData.tag_name;
        }
      } catch {
        // Ignore release fetch errors
      }

      const metrics: GitHubMetrics = {
        stars: repoData.stargazers_count,
        lastCommit: repoData.updated_at,
        lastRelease,
        openIssues: repoData.open_issues_count,
        isArchived: repoData.archived,
        topics: repoData.topics,
        license: repoData.license?.name,
      };

      // Cache the results
      this.cacheMetrics(repositoryUrl, metrics);

      return metrics;
    } catch (error) {
      console.error('Failed to fetch GitHub metrics:', error);
      return null;
    }
  }

  /**
   * Batch fetch metrics for multiple repositories
   */
  static async fetchBatchMetrics(
    repositoryUrls: string[]
  ): Promise<Map<string, GitHubMetrics | null>> {
    const results = new Map<string, GitHubMetrics | null>();

    // Process in parallel with a limit to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < repositoryUrls.length; i += batchSize) {
      const batch = repositoryUrls.slice(i, i + batchSize);
      const promises = batch.map(url =>
        this.fetchRepositoryMetrics(url).then(metrics => ({ url, metrics }))
      );

      const batchResults = await Promise.all(promises);
      batchResults.forEach(({ url, metrics }) => {
        results.set(url, metrics);
      });

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < repositoryUrls.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Get cached metrics from localStorage
   */
  private static getCachedMetrics(repositoryUrl: string): GitHubMetrics | null {
    try {
      const cacheKey = this.CACHE_KEY_PREFIX + repositoryUrl;
      const cached = localStorage.getItem(cacheKey);

      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is still valid
      if (now - timestamp > this.CACHE_TTL) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return data;
    } catch {
      return null;
    }
  }

  /**
   * Cache metrics in localStorage
   */
  private static cacheMetrics(repositoryUrl: string, metrics: GitHubMetrics): void {
    try {
      const cacheKey = this.CACHE_KEY_PREFIX + repositoryUrl;
      const cacheData = {
        data: metrics,
        timestamp: Date.now(),
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache GitHub metrics:', error);
    }
  }

  /**
   * Clear all cached metrics
   */
  static clearCache(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Get remaining rate limit
   */
  static async getRateLimit(): Promise<{ remaining: number; reset: Date } | null> {
    try {
      const response = await fetch(`${this.API_BASE}/rate_limit`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) return null;

      const data = await response.json();
      return {
        remaining: data.rate.remaining,
        reset: new Date(data.rate.reset * 1000),
      };
    } catch {
      return null;
    }
  }
}