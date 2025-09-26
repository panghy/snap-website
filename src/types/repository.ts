/**
 * Repository type definitions for GitLab and GitHub support
 */

/**
 * Supported repository hosting platforms
 */
export const RepositoryPlatform = {
  GITHUB: 'GITHUB',
  GITLAB: 'GITLAB'
} as const;

export type RepositoryPlatform = typeof RepositoryPlatform[keyof typeof RepositoryPlatform];

/**
 * Normalized repository metadata across platforms
 */
export interface RepositoryMetadata {
  /** Number of stars/favorites */
  stars: number;

  /** Repository description (max 500 chars) */
  description?: string;

  /** Primary programming language */
  primaryLanguage?: string;

  /** Last activity timestamp (ISO 8601) */
  lastUpdated: string;

  /** Number of forks */
  forks: number;

  /** Number of open issues */
  openIssues: number;

  /** Default branch name */
  defaultBranch: string;

  /** Latest release tag/version */
  lastRelease?: string;

  /** License name */
  license?: string;
}

/**
 * Complete repository information
 */
export interface Repository {
  /** Full repository URL */
  url: string;

  /** Hosting platform */
  platform: RepositoryPlatform;

  /** Repository owner/organization */
  owner: string;

  /** Repository name */
  name: string;

  /** Fetched metadata (may be null if unavailable) */
  metadata?: RepositoryMetadata;

  /** When metadata was last fetched (ISO 8601) */
  fetchedAt?: string;

  /** Error message if metadata fetch failed */
  fetchError?: string;
}

/**
 * GitLab API response types (subset)
 */
export interface GitLabProjectResponse {
  id: number;
  name: string;
  path_with_namespace: string;
  description?: string;
  star_count: number;
  forks_count: number;
  open_issues_count: number;
  last_activity_at: string;
  default_branch: string;
  web_url: string;
}

export interface GitLabLanguagesResponse {
  [language: string]: number; // percentage
}

/**
 * GitHub API response types (subset)
 */
export interface GitHubRepoResponse {
  name: string;
  full_name: string;
  description?: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  updated_at: string;
  default_branch: string;
  language?: string;
  html_url: string;
  license?: {
    name: string;
    spdx_id: string;
  };
}

/**
 * Cache entry for repository metadata
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Repository service interface
 */
export interface IRepositoryService {
  /**
   * Parse repository URL and extract platform info
   */
  parseRepositoryURL(url: string): {
    platform: RepositoryPlatform;
    owner: string;
    name: string;
  } | null;

  /**
   * Validate repository URL format
   */
  validateRepositoryURL(url: string): boolean;

  /**
   * Fetch repository metadata from platform API
   */
  fetchRepositoryMetadata(repository: Repository): Promise<RepositoryMetadata>;
}