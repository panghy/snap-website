// Type definitions for SNAPs Catalogue System

export const SnapCategory = {
  Queue: 'queue',
  BlobStore: 'blobstore',
  Search: 'search',
  Graph: 'graph',
  TimeSeries: 'timeseries',
  Cache: 'cache',
  PubSub: 'pubsub',
  Workflow: 'workflow',
  Other: 'other'
} as const;

export type SnapCategory = typeof SnapCategory[keyof typeof SnapCategory];

export const PlatformType = {
  Language: 'language',
  FoundationDB: 'foundationdb',
  OS: 'os',
  Library: 'library'
} as const;

export type PlatformType = typeof PlatformType[keyof typeof PlatformType];

export interface SnapCapabilities {
  otelMetrics?: boolean;
  otelTracing?: boolean;
  multiTenancy?: boolean;
  encryption?: boolean;
  compression?: boolean;
  streaming?: boolean;
  batchOperations?: boolean;
  asyncApi?: boolean;
}

export interface PlatformRequirement {
  type: PlatformType;
  name: string;
  version: string;
}

export interface SnapEntry {
  id: string;
  name: string;
  description: string;
  category: SnapCategory;
  repository: string;
  specificationRepository?: string;
  specificationId?: string;
  languages: string[];
  capabilities?: SnapCapabilities;
  platforms?: PlatformRequirement[];
  specificationVersion?: string;
  maintainers?: string[];
  tags?: string[];
  archived?: boolean;
  // Derived from GitHub API
  stars?: number;
  lastCommit?: string;
  lastRelease?: string;
  openIssues?: number;
}

export interface SnapSpecification {
  id: string;
  name: string;
  description: string;
  repository: string;
  version: string;
  implementations?: string[];
}

export interface CatalogueData {
  version: string;
  lastUpdated: string;
  snaps: SnapEntry[];
  specifications: SnapSpecification[];
}

// Filter and Sort types
export interface FilterState {
  searchQuery: string;
  selectedCategories: SnapCategory[];
  selectedLanguages: string[];
  selectedCapabilities: (keyof SnapCapabilities)[];
  showArchived: boolean;
  viewMode: 'snaps' | 'specifications';
}

export interface SortState {
  field: 'name' | 'stars' | 'lastCommit' | 'category';
  direction: 'asc' | 'desc';
}

// GitHub API types
export interface GitHubMetrics {
  stars: number;
  lastCommit: string;
  lastRelease?: string;
  openIssues: number;
  isArchived: boolean;
  topics?: string[];
  license?: string;
}

// Cache types
export interface CacheEntry {
  repository: string;
  data: GitHubMetrics;
  timestamp: number;
  ttl: number;
}