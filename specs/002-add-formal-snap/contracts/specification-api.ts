/**
 * API Contracts for SNAP Specification Feature
 *
 * Note: This is a client-side only feature using file system.
 * These contracts define the internal API structure for components.
 */

// ============================================================================
// Data Types
// ============================================================================

export interface SpecificationDocument {
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

export interface Heading {
  id: string;
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: Heading[];
  documentId: string;
}

export interface SpecificationSection {
  id: string;
  title: string;
  description: string;
  order: number;
  documents: string[];
  icon?: string;
}

export interface TableOfContents {
  version: string;
  generated: string;
  sections: SpecificationSection[];
  documents: Map<string, SpecificationDocument>;
  activeDocument?: string;
  expandedSections: Set<string>;
}

export interface SpecificationMetadata {
  specVersion: string;
  releaseDate: string;
  status: 'draft' | 'released';
  changelog: ChangeEntry[];
  authors: string[];
  license: string;
}

export interface ChangeEntry {
  version: string;
  date: string;
  changes: string[];
}

export interface SearchResult {
  documentId: string;
  sectionId: string;
  headingId?: string;
  title: string;
  excerpt: string;
  score: number;
}

// ============================================================================
// Service Interfaces
// ============================================================================

export interface SpecificationService {
  /**
   * Load all specification metadata and structure
   */
  loadSpecification(): Promise<{
    metadata: SpecificationMetadata;
    toc: TableOfContents;
  }>;

  /**
   * Load a specific document by ID
   */
  loadDocument(documentId: string): Promise<SpecificationDocument>;

  /**
   * Load all documents in a section
   */
  loadSection(sectionId: string): Promise<SpecificationDocument[]>;

  /**
   * Search across all specification documents
   */
  search(query: string): Promise<SearchResult[]>;

  /**
   * Get the table of contents structure
   */
  getTableOfContents(): Promise<TableOfContents>;

  /**
   * Parse markdown content and extract headings
   */
  parseDocument(content: string, path: string): SpecificationDocument;
}

// ============================================================================
// React Hook Interfaces
// ============================================================================

export interface UseSpecificationReturn {
  // Data
  metadata: SpecificationMetadata | null;
  toc: TableOfContents | null;
  currentDocument: SpecificationDocument | null;

  // UI State
  isLoading: boolean;
  error: Error | null;
  isTocVisible: boolean;

  // Actions
  selectDocument: (documentId: string) => Promise<void>;
  selectHeading: (headingId: string) => void;
  toggleSection: (sectionId: string) => void;
  toggleToc: () => void;
  search: (query: string) => Promise<SearchResult[]>;
}

// ============================================================================
// Component Props
// ============================================================================

export interface SpecificationPageProps {
  initialDocumentId?: string;
  initialHeadingId?: string;
}

export interface TOCSidebarProps {
  toc: TableOfContents;
  currentDocumentId: string | null;
  currentHeadingId: string | null;
  expandedSections: Set<string>;
  onDocumentSelect: (documentId: string) => void;
  onHeadingSelect: (headingId: string) => void;
  onSectionToggle: (sectionId: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

export interface MarkdownRendererProps {
  document: SpecificationDocument;
  onHeadingClick: (headingId: string) => void;
  currentHeadingId: string | null;
}

export interface SpecificationHeaderProps {
  metadata: SpecificationMetadata;
  currentDocument: SpecificationDocument | null;
  onTocToggle: () => void;
  isTocVisible: boolean;
}

// ============================================================================
// Markdown File Frontmatter Schema
// ============================================================================

export interface MarkdownFrontmatter {
  title: string;
  version: string;
  date: string;
  status: 'draft' | 'released' | 'deprecated';
  author?: string[];
  tags?: string[];
  order?: number;
  description?: string;
}

// ============================================================================
// File System Structure
// ============================================================================

export interface FileSystemStructure {
  root: '/docs/specification/';
  metadataFile: 'metadata.json';
  sectionPattern: /^\d{2}-[\w-]+$/;
  documentPattern: /^\d{2}-[\w-]+\.md$/;
  sectionMetadataFile: '_section.md';
}

// ============================================================================
// Navigation Events
// ============================================================================

export interface NavigationEvent {
  type: 'document' | 'heading' | 'section';
  targetId: string;
  timestamp: number;
  source: 'toc' | 'link' | 'search' | 'url';
}

// ============================================================================
// Error Types
// ============================================================================

export class SpecificationError extends Error {
  constructor(
    message: string,
    public code: 'NOT_FOUND' | 'PARSE_ERROR' | 'NETWORK_ERROR' | 'VALIDATION_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'SpecificationError';
  }
}

// ============================================================================
// Utility Types
// ============================================================================

export type DocumentStatus = 'draft' | 'released' | 'deprecated';
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type NavigationSource = 'toc' | 'link' | 'search' | 'url';

// ============================================================================
// Constants
// ============================================================================

export const SPECIFICATION_CONSTANTS = {
  MAX_CACHED_DOCUMENTS: 50,
  SEARCH_DEBOUNCE_MS: 300,
  SCROLL_OFFSET_PX: 100,
  TOC_BREAKPOINT_PX: 768,
  DEFAULT_SPEC_VERSION: '0.1.0',
  DEFAULT_SECTION_ICON: '📄',
} as const;

// ============================================================================
// Test Helpers (for contract testing)
// ============================================================================

export const mockSpecificationDocument: SpecificationDocument = {
  id: 'overview-introduction',
  path: '00-overview/01-introduction.md',
  title: 'Introduction to SNAPs',
  version: '0.1.0',
  date: '2025-01-19',
  status: 'draft',
  order: 1,
  section: '00-overview',
  content: '# Introduction\n\nThis is the introduction...',
  headings: [
    {
      id: 'introduction',
      text: 'Introduction',
      level: 1,
      children: [],
      documentId: 'overview-introduction',
    },
  ],
  metadata: {},
};

export const mockTableOfContents: TableOfContents = {
  version: '1.0.0',
  generated: new Date().toISOString(),
  sections: [
    {
      id: '00-overview',
      title: 'Overview',
      description: 'Introduction and principles',
      order: 0,
      documents: ['overview-introduction'],
    },
  ],
  documents: new Map([['overview-introduction', mockSpecificationDocument]]),
  activeDocument: undefined,
  expandedSections: new Set(),
};