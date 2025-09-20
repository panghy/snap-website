import type {
  SpecificationDocument,
  SpecificationMetadata,
  TableOfContents,
  Heading,
  MarkdownFrontmatter,
} from '../types/specification';

export class SpecificationService {
  private cache = new Map<string, SpecificationDocument>();
  private metadataCache: SpecificationMetadata | null = null;

  async loadSpecification(): Promise<{
    metadata: SpecificationMetadata;
    toc: TableOfContents;
  }> {
    const metadata = await this.loadMetadata();
    const toc = await this.buildTableOfContents();

    return { metadata, toc };
  }

  async loadMetadata(): Promise<SpecificationMetadata> {
    if (this.metadataCache) {
      return this.metadataCache;
    }

    const response = await fetch('/docs/specification/metadata.json');
    if (!response.ok) {
      throw new Error(`Failed to load metadata: ${response.statusText}`);
    }

    const metadata = await response.json();
    this.metadataCache = metadata;
    return metadata;
  }

  async loadDocument(path: string): Promise<SpecificationDocument> {
    // Check cache first
    if (this.cache.has(path)) {
      return this.cache.get(path)!;
    }

    const response = await fetch(`/docs/specification/${path}`);
    if (!response.ok) {
      throw new Error(`Failed to load document ${path}: ${response.statusText}`);
    }

    const text = await response.text();
    const document = this.parseDocument(text, path);

    // Cache the parsed document
    this.cache.set(path, document);

    return document;
  }

  parseDocument(content: string, path: string): SpecificationDocument {
    // Simple frontmatter parser that works in the browser
    let frontmatter: MarkdownFrontmatter = {
      title: 'Untitled',
    };

    let markdown = content;

    // Check if content starts with frontmatter
    if (content.startsWith('---\n')) {
      const endIndex = content.indexOf('\n---\n', 4);
      if (endIndex !== -1) {
        const frontmatterText = content.substring(4, endIndex);
        markdown = content.substring(endIndex + 5);

        // Parse YAML-like frontmatter manually
        const lines = frontmatterText.split('\n');
        for (const line of lines) {
          const colonIndex = line.indexOf(':');
          if (colonIndex !== -1) {
            const key = line.substring(0, colonIndex).trim();
            let value = line.substring(colonIndex + 1).trim();

            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1);
            }

            // Parse arrays (simple implementation)
            if (value.startsWith('[') && value.endsWith(']')) {
              const arrayValue = value.slice(1, -1).split(',').map(v => v.trim().replace(/["']/g, ''));
              frontmatter[key] = arrayValue;
            } else {
              frontmatter[key] = value;
            }
          }
        }
      }
    }

    const id = path
      .replace(/\//g, '-')
      .replace('.md', '')
      .replace(/^\d+-/, ''); // Remove number prefix

    const section = path.split('/')[0];
    const headings = this.extractHeadings(markdown, id);

    return {
      id,
      path,
      title: frontmatter.title || 'Untitled',
      order: frontmatter.order || 0,
      section,
      content: markdown,
      headings,
      metadata: frontmatter,
    };
  }

  extractHeadings(markdown: string, documentId: string): Heading[] {
    const headings: Heading[] = [];
    const lines = markdown.split('\n');
    let inCodeBlock = false;

    for (const line of lines) {
      // Skip code blocks
      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }

      if (inCodeBlock) {
        continue;
      }

      // Match heading syntax
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length as Heading['level'];
        const text = headingMatch[2]
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
          .replace(/\*(.*?)\*/g, '$1') // Remove italic
          .replace(/`(.*?)`/g, '$1') // Remove inline code
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Remove links

        const id = this.generateHeadingId(text);

        headings.push({
          id,
          text,
          level,
          children: [],
          documentId,
        });
      }
    }

    return this.nestHeadings(headings);
  }

  private nestHeadings(flatHeadings: Heading[]): Heading[] {
    const nested: Heading[] = [];
    const stack: Heading[] = [];

    for (const heading of flatHeadings) {
      // Pop stack items with level >= current heading
      while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        // Top-level heading
        nested.push(heading);
      } else {
        // Child of last stack item
        stack[stack.length - 1].children.push(heading);
      }

      stack.push(heading);
    }

    return nested;
  }

  private generateHeadingId(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  async buildTableOfContents(): Promise<TableOfContents> {
    const metadata = await this.loadMetadata();
    const sections = metadata.sections || [];

    // Sort sections by order
    const sortedSections = [...sections].sort((a, b) => a.order - b.order);

    return {
      version: metadata.specVersion,
      generated: new Date().toISOString(),
      sections: sortedSections,
      documents: new Map(),
      expandedSections: new Set(),
    };
  }

  async loadSection(sectionId: string): Promise<SpecificationDocument[]> {
    const toc = await this.buildTableOfContents();
    const section = toc.sections.find(s => s.id === sectionId);

    if (!section) {
      throw new Error(`Section ${sectionId} not found`);
    }

    const documents = await Promise.all(
      section.documents.map(doc => this.loadDocument(`${sectionId}/${doc}`))
    );

    return documents;
  }

  async search(query: string): Promise<any[]> {
    // Simplified search implementation
    // In a real implementation, this would use a proper search index
    const results: any[] = [];
    const toc = await this.buildTableOfContents();

    for (const section of toc.sections) {
      if (!section.documents) continue;

      for (const docPath of section.documents) {
        try {
          const doc = await this.loadDocument(`${section.id}/${docPath}`);

          // Search in title and content
          const queryLower = query.toLowerCase();
          const titleMatch = doc.title.toLowerCase().includes(queryLower);
          const contentMatch = doc.content.toLowerCase().includes(queryLower);

          if (titleMatch || contentMatch) {
            results.push({
              documentId: doc.id,
              sectionId: section.id,
              title: doc.title,
              excerpt: this.extractExcerpt(doc.content, query),
              score: titleMatch ? 2 : 1,
            });
          }
        } catch (error) {
          console.error(`Failed to search document ${docPath}:`, error);
        }
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  private extractExcerpt(content: string, query: string): string {
    const index = content.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return '';

    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + query.length + 50);

    let excerpt = content.substring(start, end);
    if (start > 0) excerpt = '...' + excerpt;
    if (end < content.length) excerpt = excerpt + '...';

    return excerpt;
  }

  clearCache(): void {
    this.cache.clear();
    this.metadataCache = null;
  }
}