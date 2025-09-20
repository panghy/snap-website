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
  metadata?: MarkdownFrontmatter;
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
  sections: SpecificationSection[];
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
  author?: string | string[];
  tags?: string | string[];
  order?: number;
  description?: string;
  version?: string;
  date?: string;
  status?: string;
  [key: string]: string | string[] | number | undefined;
}

export type DocumentStatus = 'draft' | 'released' | 'deprecated';
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type NavigationSource = 'toc' | 'link' | 'search' | 'url';

export const SPECIFICATION_CONSTANTS = {
  // Maximum number of documents to keep in memory cache for performance
  MAX_CACHED_DOCUMENTS: 50,

  // Delay in milliseconds before executing search after user stops typing
  SEARCH_DEBOUNCE_MS: 300,

  // Scroll offset in pixels to account for fixed header (120px) + visual padding (60px)
  SCROLL_OFFSET_PX: 180,

  // Mobile breakpoint in pixels - TOC becomes collapsible below this width
  TOC_BREAKPOINT_PX: 768,

  // Default version string for specification when not specified
  DEFAULT_SPEC_VERSION: '0.1.0',

  // Default icon for sections when custom icon not provided
  DEFAULT_SECTION_ICON: '📄',

  // Scroll animation duration in milliseconds for smooth scrolling
  SCROLL_ANIMATION_DURATION_MS: 1000,

  // Scroll animation duration in milliseconds for instant scrolling
  SCROLL_INSTANT_DURATION_MS: 100,

  // Delay before initial scroll to allow DOM to settle
  SCROLL_INITIAL_DELAY_MS: 50,

  // Duration to show highlight effect on scroll target
  SCROLL_HIGHLIGHT_DURATION_MS: 2000,
} as const;