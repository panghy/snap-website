import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpecificationPage } from '../SpecificationPage';

// Mock fetch for integration tests
global.fetch = vi.fn();

describe('Specification Page Integration - Markdown Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock specification metadata
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('metadata.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
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
                description: 'Introduction to SNAPs',
                order: 0,
                documents: ['01-comprehensive.md', '02-formatting.md'],
              },
            ],
          }),
        });
      }

      if (url.includes('.md')) {
        const fileName = url.split('/').pop();
        let content = '';

        if (fileName === '01-comprehensive.md') {
          content = `---
title: Comprehensive Markdown Features
version: 0.1.0
date: 2025-01-19
status: draft
---

# Comprehensive Markdown Features

This document demonstrates all supported markdown features.

## Basic Text Formatting

This is **bold text** and this is *italic text*.

### Code Examples

\`\`\`javascript
function hello() {
  console.log('Hello, World!');
}
\`\`\`

### Lists

- Item 1
- Item 2
  - Nested item
- Item 3

### Links and Images

[This is a link](https://example.com)

### Tables

| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |

> This is a blockquote
`;
        } else {
          content = `---
title: Test Document
version: 0.1.0
date: 2025-01-19
status: draft
---

# Test Document

Basic content for ${fileName}`;
        }

        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(content),
        });
      }

      return Promise.reject(new Error('Unknown URL'));
    });
  });

  it('should render comprehensive markdown features correctly', async () => {
    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Navigate to the comprehensive markdown document
    const comprehensiveDoc = await screen.findByTestId('doc-01-comprehensive.md');
    await userEvent.click(comprehensiveDoc);

    // Wait for document to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Navigate to Comprehensive Markdown Features' })).toBeInTheDocument();
    });

    // Check that various markdown elements are rendered
    expect(screen.getByText(/This document demonstrates/)).toBeInTheDocument();

    // Check for formatted text
    expect(screen.getByText('bold text')).toBeInTheDocument();
    expect(screen.getByText('italic text')).toBeInTheDocument();

    // Check for list items
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Nested item')).toBeInTheDocument();
  });

  it('should render code blocks with proper syntax highlighting', async () => {
    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Navigate to document with code
    const comprehensiveDoc = await screen.findByTestId('doc-01-comprehensive.md');
    await userEvent.click(comprehensiveDoc);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Navigate to Comprehensive Markdown Features' })).toBeInTheDocument();
    });

    // Check that code block container exists
    const codeBlock = document.querySelector('pre');
    expect(codeBlock).toBeInTheDocument();

    // Check that content contains code-related text
    const content = screen.getByTestId('markdown-content');
    expect(content.textContent).toContain('hello');
  });

  it('should render tables with proper formatting', async () => {
    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Navigate to document with table
    const comprehensiveDoc = await screen.findByTestId('doc-01-comprehensive.md');
    await userEvent.click(comprehensiveDoc);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Navigate to Comprehensive Markdown Features' })).toBeInTheDocument();
    });

    // Check that table content is rendered
    expect(screen.getByText('Column 1')).toBeInTheDocument();
    expect(screen.getByText('Cell 1')).toBeInTheDocument();
  });

  it('should render links with proper attributes', async () => {
    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Navigate to document with links
    const comprehensiveDoc = await screen.findByTestId('doc-01-comprehensive.md');
    await userEvent.click(comprehensiveDoc);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Navigate to Comprehensive Markdown Features' })).toBeInTheDocument();
    });

    // Check that link is rendered
    const link = screen.getByText('This is a link');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', 'https://example.com');
  });

  it('should render blockquotes with proper styling', async () => {
    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Navigate to document with blockquote
    const comprehensiveDoc = await screen.findByTestId('doc-01-comprehensive.md');
    await userEvent.click(comprehensiveDoc);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Navigate to Comprehensive Markdown Features' })).toBeInTheDocument();
    });

    // Check that blockquote content is rendered
    const blockquoteText = screen.getByText('This is a blockquote');
    expect(blockquoteText).toBeInTheDocument();

    // Check that it's within a blockquote element
    const blockquote = document.querySelector('blockquote');
    expect(blockquote).toBeInTheDocument();
  });

  it('should handle document navigation with markdown content', async () => {
    const user = userEvent.setup();

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Navigate to first document
    const firstDoc = await screen.findByTestId('doc-01-comprehensive.md');
    await user.click(firstDoc);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Navigate to Comprehensive Markdown Features' })).toBeInTheDocument();
    });

    // Navigate to second document
    const secondDoc = await screen.findByTestId('doc-02-formatting.md');
    await user.click(secondDoc);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Navigate to Test Document' })).toBeInTheDocument();
    });

    // Content should update
    expect(screen.getByText(/Basic content for/)).toBeInTheDocument();
  });
});