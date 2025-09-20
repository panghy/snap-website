/**
 * GitHub API Response Types
 * Based on GitHub REST API v3
 */

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: GitHubUser;
  html_url: string;
  description: string | null;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  has_issues: boolean;
  has_projects: boolean;
  has_downloads: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  forks_count: number;
  archived: boolean;
  disabled: boolean;
  open_issues_count: number;
  license: GitHubLicense | null;
  topics: string[];
  default_branch: string;
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  url: string;
  html_url: string;
  type: string;
}

export interface GitHubLicense {
  key: string;
  name: string;
  spdx_id: string;
  url: string;
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string | null;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  assets: GitHubAsset[];
  body: string | null;
}

export interface GitHubAsset {
  id: number;
  name: string;
  size: number;
  download_count: number;
  created_at: string;
  updated_at: string;
  browser_download_url: string;
}

/**
 * Extracted metrics for catalogue display
 */
export interface GitHubMetrics {
  stars: number;
  lastCommit: string;
  lastRelease?: string;
  openIssues: number;
  isArchived: boolean;
  topics: string[];
  license?: string;
}

/**
 * API Service Interface
 */
export interface IGitHubService {
  /**
   * Fetch repository metrics from GitHub
   * @param repositoryUrl Full GitHub repository URL
   * @returns Promise resolving to metrics or null if error
   */
  fetchRepositoryMetrics(repositoryUrl: string): Promise<GitHubMetrics | null>;

  /**
   * Batch fetch multiple repositories
   * @param repositoryUrls Array of repository URLs
   * @returns Map of URL to metrics (or null for failures)
   */
  fetchBatchMetrics(repositoryUrls: string[]): Promise<Map<string, GitHubMetrics | null>>;

  /**
   * Check remaining API rate limit
   * @returns Remaining requests and reset time
   */
  getRateLimit(): Promise<{ remaining: number; reset: Date }>;
}

/**
 * Cache Service Interface
 */
export interface ICacheService {
  /**
   * Get cached metrics for repository
   * @param repositoryUrl Repository URL as cache key
   * @returns Cached metrics or null if not found/expired
   */
  get(repositoryUrl: string): GitHubMetrics | null;

  /**
   * Store metrics in cache
   * @param repositoryUrl Repository URL as cache key
   * @param metrics Metrics to cache
   * @param ttl Time to live in milliseconds
   */
  set(repositoryUrl: string, metrics: GitHubMetrics, ttl: number): void;

  /**
   * Clear all cached entries
   */
  clear(): void;

  /**
   * Remove expired entries
   */
  prune(): void;
}

/**
 * Filter and Sort Interfaces
 */
export interface FilterOptions {
  searchQuery?: string;
  categories?: string[];
  languages?: string[];
  capabilities?: string[];
  showArchived?: boolean;
  hasSpecification?: boolean;
}

export interface SortOptions {
  field: 'name' | 'stars' | 'lastCommit' | 'category';
  direction: 'asc' | 'desc';
}

/**
 * API Error Response
 */
export interface GitHubError {
  message: string;
  documentation_url?: string;
  status?: number;
}