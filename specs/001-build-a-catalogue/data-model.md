# Data Model: SNAPs Catalogue System

## Core Entities

### 1. SnapEntry
Represents a single SNAP implementation in the catalogue.

**Attributes:**
- `id: string` - Unique identifier (e.g., "fdb-queue-java")
- `name: string` - Display name (e.g., "FDB Queue")
- `description: string` - Brief description (max 200 chars)
- `category: SnapCategory` - Primary classification
- `repository: string` - GitHub repository URL
- `specificationRepository?: string` - Optional specification repo URL
- `specificationId?: string` - Reference to specification if implementing one
- `languages: string[]` - Supported programming languages
- `capabilities: SnapCapabilities` - Feature support flags
- `platforms: PlatformRequirement[]` - Runtime requirements
- `specificationVersion?: string` - SNAP spec version compliance
- `maintainers: string[]` - GitHub usernames of maintainers
- `tags?: string[]` - Additional searchable tags
- `archived?: boolean` - Mark deprecated/unmaintained SNAPs

**Derived Attributes (from GitHub API):**
- `stars: number` - GitHub star count
- `lastCommit: Date` - Most recent commit timestamp
- `lastRelease?: string` - Latest release version
- `openIssues: number` - Count of open issues

### 2. SnapSpecification
Represents a language-agnostic SNAP specification that can have multiple implementations.

**Attributes:**
- `id: string` - Unique identifier (e.g., "spec-queue")
- `name: string` - Specification name
- `description: string` - What the specification defines
- `repository: string` - GitHub repository with spec documentation
- `version: string` - Current specification version
- `implementations: string[]` - Array of SnapEntry IDs that implement this spec

### 3. SnapCategory (Enum)
Classification of SNAP by primary function.

**Values:**
- `queue` - Message/Task queues
- `blobstore` - Binary/Large object storage
- `search` - Full-text search indices
- `graph` - Graph databases
- `timeseries` - Time-series data stores
- `cache` - Caching layers
- `pubsub` - Publish-Subscribe systems
- `workflow` - Workflow engines
- `other` - Uncategorized

### 4. SnapCapabilities
Feature flags indicating SNAP capabilities.

**Attributes:**
- `otelMetrics: boolean` - OpenTelemetry metrics support
- `otelTracing: boolean` - OpenTelemetry distributed tracing
- `multiTenancy: boolean` - Built-in multi-tenant isolation
- `encryption: boolean` - At-rest encryption support
- `compression: boolean` - Data compression support
- `streaming: boolean` - Stream processing capabilities
- `batchOperations: boolean` - Batch API support
- `asyncApi: boolean` - Asynchronous operations

### 5. PlatformRequirement
Technical requirements for running a SNAP.

**Attributes:**
- `type: PlatformType` - Type of requirement
- `name: string` - Specific platform/runtime (e.g., "Java", "Python")
- `version: string` - Minimum version required (e.g., "11+", "3.8+")

### 6. PlatformType (Enum)
Types of platform requirements.

**Values:**
- `language` - Programming language runtime
- `foundationdb` - FoundationDB version
- `os` - Operating system
- `library` - Required library/framework

## Data Relationships

### SnapEntry ↔ SnapSpecification
- A SnapEntry MAY implement a SnapSpecification (many-to-one)
- A SnapSpecification MAY have multiple SnapEntry implementations (one-to-many)
- Linked via `specificationId` in SnapEntry and `implementations[]` in SnapSpecification

### Cross-References
- Multiple SnapEntries can share the same `category`
- Multiple SnapEntries can support the same `languages[]`
- Tags enable cross-category discovery

## State Management

### Filter State
```typescript
interface FilterState {
  searchQuery: string;
  selectedCategories: SnapCategory[];
  selectedLanguages: string[];
  selectedCapabilities: (keyof SnapCapabilities)[];
  showArchived: boolean;
  viewMode: 'snaps' | 'specifications';
}
```

### Sort State
```typescript
interface SortState {
  field: 'name' | 'stars' | 'lastCommit' | 'category';
  direction: 'asc' | 'desc';
}
```

### Cache State
```typescript
interface CacheEntry {
  repository: string;
  data: GitHubMetrics;
  timestamp: number;
  ttl: number; // milliseconds
}

interface GitHubMetrics {
  stars: number;
  lastCommit: string;
  lastRelease?: string;
  openIssues: number;
}
```

## Validation Rules

### Required Fields
- All SnapEntries MUST have: id, name, description, category, repository
- All SnapSpecifications MUST have: id, name, description, repository, version

### Format Constraints
- `id`: lowercase, alphanumeric with hyphens (regex: `/^[a-z0-9-]+$/`)
- `repository`: Valid GitHub URL format
- `version`: Semantic versioning format (e.g., "1.0.0")
- `description`: Maximum 200 characters

### Business Rules
- No duplicate `id` values within snaps or specifications
- If `specificationId` is set, must reference existing specification
- `archived` SNAPs shown only when filter explicitly enabled
- At least one language must be specified for each SNAP

## JSON File Structure

```typescript
interface CatalogueData {
  version: string;        // Schema version
  lastUpdated: string;    // ISO 8601 timestamp
  snaps: SnapEntry[];
  specifications: SnapSpecification[];
}
```

## TypeScript Type Definitions

Location: `/src/types/snap.ts`

```typescript
export interface SnapEntry {
  // ... as defined above
}

export interface SnapSpecification {
  // ... as defined above
}

export enum SnapCategory {
  // ... as defined above
}

export interface SnapCapabilities {
  // ... as defined above
}

export interface PlatformRequirement {
  // ... as defined above
}

export type CatalogueData = {
  version: string;
  lastUpdated: string;
  snaps: SnapEntry[];
  specifications: SnapSpecification[];
}
```

## Migration Strategy

### Version 1.0.0 (Initial)
- Base schema as defined above

### Future Versions
- Add `deprecated` flag with migration date
- Add `alternativeTo` for replacement SNAPs
- Add `metrics` for usage statistics
- Backward compatibility via optional fields