/**
 * TypeScript interfaces for GitLab.com Repository Support
 * Contract version: 1.0.0
 */

/**
 * Supported repository hosting platforms
 */
export enum RepositoryPlatform {
  GITHUB = 'GITHUB',
  GITLAB = 'GITLAB'
}

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
 * Language-specific SNAP implementation
 */
export interface SNAPImplementation {
  /** Programming language */
  language: string;

  /** Repository information */
  repository: Repository;

  /** Implementation version (semantic) */
  version?: string;

  /** SNAP specification version (semantic) */
  specVersion: string;
}

/**
 * SNAP catalogue entry
 */
export interface SNAPEntry {
  /** Unique SNAP name */
  name: string;

  /** SNAP description (max 500 chars) */
  description: string;

  /** SNAP category */
  category: string;

  /** Language implementations */
  implementations: SNAPImplementation[];

  /** Maintainer contact */
  maintainer: string;

  /** When added to catalogue (ISO 8601) */
  addedDate: string;
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

  /**
   * Get platform icon/indicator for UI
   */
  getPlatformIcon(platform: RepositoryPlatform): string;
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
}