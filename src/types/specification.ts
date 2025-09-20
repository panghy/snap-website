/**
 * Type definitions for SNAP Specification Feature
 */

export interface SpecificationDocument {
  id: string;
  path: string;
  title: string;
  order: number;
  section: string;
  content: string;
  headings: Heading[];
  metadata?: Record<string, any>;
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

export interface MarkdownFrontmatter {
  title: string;
  author?: string[];
  tags?: string[];
  order?: number;
  description?: string;
}

export type DocumentStatus = 'draft' | 'released' | 'deprecated';
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type NavigationSource = 'toc' | 'link' | 'search' | 'url';

export const SPECIFICATION_CONSTANTS = {
  MAX_CACHED_DOCUMENTS: 50,
  SEARCH_DEBOUNCE_MS: 300,
  SCROLL_OFFSET_PX: 180,
  TOC_BREAKPOINT_PX: 768,
  DEFAULT_SPEC_VERSION: '0.1.0',
  DEFAULT_SECTION_ICON: '📄',
} as const;