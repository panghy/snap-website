import type {
  Repository,
  RepositoryMetadata,
  IRepositoryService,
  GitLabProjectResponse,
  GitHubRepoResponse
} from '../../types/repository';
import { RepositoryPlatform } from '../../types/repository';
import { GitLabClient } from './gitlab-client';
import { GitHubClient } from './github-client';
import { CacheService } from './cache';
import { parseRepositoryURL, validateRepositoryURL } from '../../utils/url-parser';

export class RepositoryService implements IRepositoryService {
  private githubClient: GitHubClient;
  private gitlabClient: GitLabClient;
  private cache: CacheService<RepositoryMetadata>;
  private readonly defaultTTL = 300000; // 5 minutes
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second initial delay

  constructor() {
    this.githubClient = new GitHubClient();
    this.gitlabClient = new GitLabClient();
    this.cache = new CacheService<RepositoryMetadata>({ maxSize: 100 });
  }

  /**
   * Parse repository URL
   */
  parseRepositoryURL(url: string) {
    return parseRepositoryURL(url);
  }

  /**
   * Validate repository URL
   */
  validateRepositoryURL(url: string): boolean {
    return validateRepositoryURL(url);
  }

  /**
   * Fetch repository metadata with caching and retry logic
   */
  async fetchRepositoryMetadata(repository: Repository): Promise<RepositoryMetadata> {
    const cacheKey = this.getCacheKey(repository);

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch with retry logic
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const metadata = await this.fetchFromAPI(repository);

        // Cache the result
        this.cache.set(cacheKey, metadata, this.defaultTTL);

        return metadata;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on 404 or 429
        if (error instanceof Error) {
          if (error.message.includes('not found') || error.message.includes('Rate limit')) {
            throw error;
          }
        }

        // Exponential backoff for transient errors
        if (attempt < this.maxRetries - 1) {
          await this.sleep(this.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError || new Error('Failed to fetch repository metadata');
  }

  /**
   * Normalize GitLab metadata
   */
  normalizeGitLabMetadata(
    data: Partial<GitLabProjectResponse>,
    primaryLanguage?: string | null
  ): RepositoryMetadata {
    let description = data.description;
    if (description === null || description === undefined) {
      description = undefined;
    } else if (description.length > 500) {
      description = description.substring(0, 497) + '...';
    }

    const lang = primaryLanguage === null ? undefined : primaryLanguage;

    return {
      stars: data.star_count || 0,
      description,
      primaryLanguage: lang,
      lastUpdated: data.last_activity_at || new Date().toISOString(),
      forks: data.forks_count || 0,
      openIssues: data.open_issues_count || 0,
      defaultBranch: data.default_branch || 'main'
    };
  }

  /**
   * Normalize GitHub metadata
   */
  normalizeGitHubMetadata(data: Partial<GitHubRepoResponse>): RepositoryMetadata {
    let description = data.description;
    if (description === null || description === undefined) {
      description = undefined;
    } else if (description.length > 500) {
      description = description.substring(0, 497) + '...';
    }

    const primaryLanguage = data.language === null ? undefined : data.language;

    return {
      stars: data.stargazers_count || 0,
      description,
      primaryLanguage,
      lastUpdated: data.updated_at || new Date().toISOString(),
      forks: data.forks_count || 0,
      openIssues: data.open_issues_count || 0,
      defaultBranch: data.default_branch || 'main'
    };
  }

  /**
   * Fetch from appropriate API based on platform
   */
  private async fetchFromAPI(repository: Repository): Promise<RepositoryMetadata> {
    switch (repository.platform) {
      case RepositoryPlatform.GITHUB:
        return this.githubClient.fetchMetadata(repository);
      case RepositoryPlatform.GITLAB:
        return this.gitlabClient.fetchMetadata(repository);
      default:
        throw new Error(`Unsupported platform: ${repository.platform}`);
    }
  }

  /**
   * Generate cache key for repository
   */
  private getCacheKey(repository: Repository): string {
    return `repo-metadata-${repository.platform}-${repository.owner}-${repository.name}`;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}