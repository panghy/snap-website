# Data Model: Add Formal SNAP Specification

## Entity Definitions

### 1. SpecificationDocument
Represents a single markdown file in the specification.

**Properties**:
- `id: string` - Unique identifier (derived from file path)
- `path: string` - File system path relative to /docs/specification/
- `title: string` - Document title from frontmatter
- `version: string` - Specification version (e.g., "0.1.0")
- `date: string` - Last modified date
- `status: 'draft' | 'released' | 'deprecated'` - Document status
- `order: number` - Sort order within section
- `section: string` - Parent section identifier
- `content: string` - Raw markdown content
- `headings: Heading[]` - Extracted headings for TOC
- `metadata: Record<string, any>` - Additional frontmatter fields

**Validation Rules**:
- Path must exist in file system
- Version must follow semantic versioning
- Date must be valid ISO date
- Title is required and non-empty

### 2. Heading
Represents a heading within a document for TOC generation.

**Properties**:
- `id: string` - Anchor ID for navigation
- `text: string` - Heading text content
- `level: number` - Heading level (1-6)
- `children: Heading[]` - Nested subheadings
- `documentId: string` - Reference to parent document

**Validation Rules**:
- Level must be between 1 and 6
- ID must be unique within document
- Text is required and non-empty

### 3. SpecificationSection
Represents a logical grouping of documents.

**Properties**:
- `id: string` - Section identifier (e.g., "00-overview")
- `title: string` - Display title
- `description: string` - Section description
- `order: number` - Display order
- `documents: string[]` - Document IDs in this section
- `icon?: string` - Optional icon for UI

**Validation Rules**:
- ID must match directory name pattern
- Order must be unique across sections
- At least one document required

### 4. TableOfContents
Represents the complete navigation structure.

**Properties**:
- `version: string` - TOC structure version
- `generated: string` - Generation timestamp
- `sections: SpecificationSection[]` - All sections
- `documents: Map<string, SpecificationDocument>` - Document lookup
- `activeDocument?: string` - Currently selected document
- `expandedSections: Set<string>` - UI state for expanded sections

**Validation Rules**:
- Sections must be ordered
- No orphaned documents
- Active document must exist in documents map

### 5. SpecificationMetadata
Global metadata for the entire specification.

**Properties**:
- `specVersion: string` - Overall specification version
- `releaseDate: string` - Release date
- `status: 'draft' | 'released'` - Overall status
- `changelog: ChangeEntry[]` - Version history
- `authors: string[]` - Specification authors
- `license: string` - License information

**Validation Rules**:
- Version must be semantic
- Release date required for 'released' status

### 6. SearchIndex
Search functionality support (future enhancement).

**Properties**:
- `documentId: string` - Source document
- `sectionId: string` - Source section
- `headingId?: string` - Specific heading
- `content: string` - Indexed text
- `keywords: string[]` - Extracted keywords
- `weight: number` - Relevance weight

## State Management

### SpecificationContext
React context for specification state.

```typescript
interface SpecificationState {
  // Data
  metadata: SpecificationMetadata;
  toc: TableOfContents;
  documents: Map<string, SpecificationDocument>;

  // UI State
  activeDocumentId: string | null;
  activeHeadingId: string | null;
  expandedSections: Set<string>;
  isTocVisible: boolean;
  isLoading: boolean;
  error: Error | null;

  // Actions
  selectDocument: (documentId: string) => void;
  selectHeading: (headingId: string) => void;
  toggleSection: (sectionId: string) => void;
  toggleToc: () => void;
  search: (query: string) => SearchResult[];
}
```

## File System Structure

```
/docs/specification/
├── metadata.json                 # Global specification metadata
├── 00-overview/
│   ├── _section.md              # Section metadata
│   ├── 01-introduction.md       # Ordered documents
│   ├── 02-principles.md
│   └── 03-architecture.md
├── 01-core-concepts/
│   ├── _section.md
│   ├── 01-transactions.md
│   ├── 02-directories.md
│   └── 03-subspaces.md
├── 02-requirements/
│   ├── _section.md
│   ├── 01-compliance.md
│   ├── 02-interfaces.md
│   └── 03-testing.md
└── 03-examples/
    ├── _section.md
    ├── 01-task-queue.md
    ├── 02-blob-store.md
    └── 03-search-engine.md
```

## Frontmatter Schema

```yaml
---
title: string            # Required: Document title
version: string          # Required: Document version
date: string            # Required: ISO date
status: string          # Required: draft|released|deprecated
author: string[]        # Optional: Document authors
tags: string[]          # Optional: Searchable tags
order: number           # Optional: Override sort order
description: string     # Optional: Brief description
---
```

## Data Flow

### 1. Initialization
```
Load metadata.json
→ Scan directories for sections
→ Load _section.md files
→ Build section structure
→ Load document list (lazy)
```

### 2. Document Selection
```
User clicks TOC item
→ Load document if not cached
→ Parse frontmatter with gray-matter
→ Extract headings from AST
→ Update active document
→ Render markdown content
→ Scroll to top or anchor
```

### 3. Navigation
```
User clicks heading
→ Find target element
→ Smooth scroll to position
→ Update URL hash
→ Update active heading
→ Highlight in TOC
```

## Caching Strategy

### Document Cache
- Cache parsed documents in memory
- Invalidate on version change
- Maximum 50 documents cached
- LRU eviction policy

### TOC Cache
- Generate once on load
- Regenerate on file system changes (dev mode)
- Store in sessionStorage for navigation

## TypeScript Interfaces

```typescript
interface SpecificationDocument {
  id: string;
  path: string;
  title: string;
  version: string;
  date: string;
  status: 'draft' | 'released' | 'deprecated';
  order: number;
  section: string;
  content: string;
  headings: Heading[];
  metadata: Record<string, any>;
}

interface Heading {
  id: string;
  text: string;
  level: number;
  children: Heading[];
  documentId: string;
}

interface SpecificationSection {
  id: string;
  title: string;
  description: string;
  order: number;
  documents: string[];
  icon?: string;
}

interface TableOfContents {
  version: string;
  generated: string;
  sections: SpecificationSection[];
  documents: Map<string, SpecificationDocument>;
  activeDocument?: string;
  expandedSections: Set<string>;
}
```

## Validation Rules Summary

1. **File Naming**: Documents must follow `NN-slug.md` pattern
2. **Section Naming**: Sections must follow `NN-category/` pattern
3. **Frontmatter**: Required fields must be present and valid
4. **Heading IDs**: Must be unique within document
5. **Cross-references**: Internal links must resolve
6. **Version Format**: Must follow semantic versioning
7. **Date Format**: Must be valid ISO 8601
8. **Status Values**: Must be one of allowed values

## Performance Considerations

1. **Lazy Loading**: Load documents only when selected
2. **Memoization**: Cache parsed markdown and headings
3. **Debouncing**: Debounce scroll events for TOC highlighting
4. **Virtual Scrolling**: Consider for very long documents (future)
5. **Search Indexing**: Build index asynchronously (future)