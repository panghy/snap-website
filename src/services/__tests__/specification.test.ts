import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpecificationService } from '../specification';
import type { SpecificationDocument, TableOfContents, SpecificationMetadata } from '../../types/specification';

// Mock fetch globally
global.fetch = vi.fn();

describe('SpecificationService', () => {
  let service: SpecificationService;

  beforeEach(() => {
    service = new SpecificationService();
    vi.clearAllMocks();
  });

  describe('loadSpecification', () => {
    it('should load metadata and table of contents', async () => {
      const mockMetadata: SpecificationMetadata = {
        specVersion: '0.1.0',
        releaseDate: '2025-01-19',
        status: 'draft',
        changelog: [],
        authors: ['Test Author'],
        license: 'MIT',
        sections: [
          {
            id: '00-overview',
            title: 'Overview',
            description: 'Test overview',
            order: 0,
            documents: ['01-introduction.md'],
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetadata,
      });

      const result = await service.loadSpecification();

      expect(result).toBeDefined();
      expect(result.metadata).toEqual(mockMetadata);
      expect(result.toc).toBeDefined();
      expect(global.fetch).toHaveBeenCalledWith('/docs/specification/metadata.json');
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(service.loadSpecification()).rejects.toThrow('Network error');
    });
  });

  describe('loadDocument', () => {
    it('should load and parse a markdown document', async () => {
      const mockMarkdown = `---
title: Test Document
version: 0.1.0
date: 2025-01-19
status: draft
---

# Test Heading

This is test content.`;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockMarkdown,
      });

      const document = await service.loadDocument('00-overview/01-introduction.md');

      expect(document).toBeDefined();
      expect(document.title).toBe('Test Document');
      expect(document.metadata?.version).toBe('0.1.0');
      expect(document.content).toContain('# Test Heading');
      expect(document.headings).toBeDefined();
      expect(document.headings.length).toBeGreaterThan(0);
    });

    it('should handle missing frontmatter', async () => {
      const mockMarkdown = `# Test Heading

This is test content without frontmatter.`;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockMarkdown,
      });

      const document = await service.loadDocument('test.md');

      expect(document).toBeDefined();
      expect(document.content).toContain('# Test Heading');
    });

    it('should generate document ID from path', async () => {
      const mockMarkdown = `---
title: Test
version: 0.1.0
date: 2025-01-19
status: draft
---

Content`;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockMarkdown,
      });

      const document = await service.loadDocument('00-overview/01-introduction.md');

      expect(document.id).toBe('overview-01-introduction');
    });
  });

  describe('parseDocument', () => {
    it('should extract headings from markdown', () => {
      const markdown = `# Heading 1
## Heading 2
### Heading 3
Content here
## Another Heading 2`;

      const result = service.parseDocument(markdown, 'test.md');

      expect(result.headings).toHaveLength(1); // Only H1 at top level
      expect(result.headings[0].level).toBe(1);
      expect(result.headings[0].text).toBe('Heading 1');
      expect(result.headings[0].children).toHaveLength(2); // Two H2s under H1
      expect(result.headings[0].children[0].level).toBe(2);
    });

    it('should generate heading IDs', () => {
      const markdown = `# Test Heading`;

      const result = service.parseDocument(markdown, 'test.md');

      expect(result.headings[0].id).toBe('test-heading');
    });

    it('should handle nested heading structure', () => {
      const markdown = `# H1
## H2 under H1
### H3 under H2
## Another H2
# Another H1`;

      const result = service.parseDocument(markdown, 'test.md');

      expect(result.headings).toHaveLength(2); // Two H1s at top level
      expect(result.headings[0].children).toHaveLength(2); // First H1 has two H2s
      expect(result.headings[0].children[0].children).toHaveLength(1); // First H2 has one H3
    });
  });

  describe('buildTableOfContents', () => {
    it('should construct TOC from metadata sections', async () => {
      const mockMetadata: SpecificationMetadata = {
        specVersion: '0.1.0',
        releaseDate: '2025-01-19',
        status: 'draft',
        changelog: [],
        authors: ['Test'],
        license: 'MIT',
        sections: [
          {
            id: '00-overview',
            title: 'Overview',
            description: 'Test',
            order: 0,
            documents: ['01-intro.md'],
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetadata,
      });

      const toc = await service.buildTableOfContents();

      expect(toc).toBeDefined();
      expect(toc.sections).toHaveLength(1);
      expect(toc.sections[0].id).toBe('00-overview');
    });

    it('should sort sections by order', async () => {
      const mockMetadata: SpecificationMetadata = {
        specVersion: '0.1.0',
        releaseDate: '2025-01-19',
        status: 'draft',
        changelog: [],
        authors: ['Test'],
        license: 'MIT',
        sections: [
          { id: 'b', title: 'B', description: '', order: 2, documents: [] },
          { id: 'a', title: 'A', description: '', order: 1, documents: [] },
          { id: 'c', title: 'C', description: '', order: 3, documents: [] },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetadata,
      });

      const toc = await service.buildTableOfContents();

      expect(toc.sections[0].id).toBe('a');
      expect(toc.sections[1].id).toBe('b');
      expect(toc.sections[2].id).toBe('c');
    });
  });

  describe('extractHeadings', () => {
    it('should extract headings with proper hierarchy', () => {
      const markdown = `# Title
## Section 1
### Subsection 1.1
### Subsection 1.2
## Section 2`;

      const headings = service.extractHeadings(markdown, 'test-doc');

      expect(headings).toHaveLength(1); // One H1 at top level
      expect(headings[0].text).toBe('Title');
      expect(headings[0].children).toHaveLength(2); // Two H2s under the H1
      expect(headings[0].children[0].text).toBe('Section 1');
    });

    it('should handle special characters in heading text', () => {
      const markdown = `# Heading with **bold** and *italic*`;

      const headings = service.extractHeadings(markdown, 'test-doc');

      expect(headings[0].text).toBe('Heading with bold and italic');
    });

    it('should skip code blocks when extracting headings', () => {
      const markdown = `# Real Heading
\`\`\`
# This is in a code block
\`\`\`
## Another Real Heading`;

      const headings = service.extractHeadings(markdown, 'test-doc');

      expect(headings).toHaveLength(1); // One H1 at top level
      expect(headings[0].text).toBe('Real Heading');
      expect(headings[0].children).toHaveLength(1); // H2 is nested under H1
      expect(headings[0].children[0].text).toBe('Another Real Heading');
    });
  });
});