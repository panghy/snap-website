import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MarkdownRenderer } from '../MarkdownRenderer';
import type { SpecificationDocument, Heading } from '../../../types/specification';

describe('MarkdownRenderer', () => {
  const mockDocument: SpecificationDocument = {
    id: 'test-doc',
    path: 'test.md',
    title: 'Test Document',
    version: '0.1.0',
    date: '2025-01-19',
    status: 'draft',
    order: 0,
    section: 'overview',
    content: `# Test Document

This is a **bold** text and this is *italic*.

## Section 1

Here's a code block:

\`\`\`javascript
function hello() {
  console.log('Hello, World!');
}
\`\`\`

### Subsection 1.1

- List item 1
- List item 2
- List item 3

## Section 2

[This is a link](https://example.com)`,
    headings: [
      {
        id: 'test-document',
        text: 'Test Document',
        level: 1,
        children: [
          {
            id: 'section-1',
            text: 'Section 1',
            level: 2,
            children: [
              { id: 'subsection-1-1', text: 'Subsection 1.1', level: 3, children: [] }
            ]
          },
          { id: 'section-2', text: 'Section 2', level: 2, children: [] }
        ]
      },
    ] as Heading[],
    metadata: {},
  };

  const defaultProps = {
    document: mockDocument,
    onHeadingClick: vi.fn(),
    currentHeadingId: null,
  };

  it('should render markdown content', () => {
    render(<MarkdownRenderer {...defaultProps} />);

    // Headings have role="button" because they're clickable
    expect(screen.getByRole('button', { name: 'Navigate to Test Document' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Navigate to Section 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Navigate to Subsection 1.1' })).toBeInTheDocument();
  });

  it('should render formatted text', () => {
    render(<MarkdownRenderer {...defaultProps} />);

    expect(screen.getByText('bold')).toBeInTheDocument();
    expect(screen.getByText('italic')).toBeInTheDocument();
  });

  it('should render code blocks with syntax highlighting', () => {
    render(<MarkdownRenderer {...defaultProps} />);

    // The syntax highlighter might split the text, so check for parts
    expect(screen.getByText(/hello/)).toBeInTheDocument();
    // Check that code is within a pre element
    const preElements = document.querySelectorAll('pre');
    expect(preElements.length).toBeGreaterThan(0);
  });

  it('should render lists', () => {
    render(<MarkdownRenderer {...defaultProps} />);

    expect(screen.getByText('List item 1')).toBeInTheDocument();
    expect(screen.getByText('List item 2')).toBeInTheDocument();
    expect(screen.getByText('List item 3')).toBeInTheDocument();
  });

  it('should render links', () => {
    render(<MarkdownRenderer {...defaultProps} />);

    const link = screen.getByText('This is a link');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', 'https://example.com');
  });

  it('should handle heading clicks', async () => {
    const onHeadingClick = vi.fn();
    render(<MarkdownRenderer {...defaultProps} onHeadingClick={onHeadingClick} />);

    const user = userEvent.setup();
    const heading = screen.getByRole('button', { name: 'Navigate to Section 1' });
    await user.click(heading);

    expect(onHeadingClick).toHaveBeenCalledWith('section-1');
  });

  it('should highlight current heading', () => {
    render(<MarkdownRenderer {...defaultProps} currentHeadingId="section-1" />);

    const heading = screen.getByRole('button', { name: 'Navigate to Section 1' });
    // Check for module CSS class
    expect(heading.className).toContain('active');
  });

  it('should render tables from markdown', () => {
    const docWithTable = {
      ...mockDocument,
      content: `| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |`,
    };

    render(<MarkdownRenderer {...defaultProps} document={docWithTable} />);

    expect(screen.getByText('Column 1')).toBeInTheDocument();
    expect(screen.getByText('Cell 1')).toBeInTheDocument();
  });

  it('should render blockquotes', () => {
    const docWithBlockquote = {
      ...mockDocument,
      content: '> This is a blockquote\n> with multiple lines',
    };

    render(<MarkdownRenderer {...defaultProps} document={docWithBlockquote} />);

    const blockquoteText = screen.getByText(/This is a blockquote/);
    expect(blockquoteText).toBeInTheDocument();
    const blockquoteElement = document.querySelector('blockquote');
    expect(blockquoteElement).toBeInTheDocument();
  });

  it('should render inline code', () => {
    const docWithInlineCode = {
      ...mockDocument,
      content: 'This is `inline code` in a paragraph.',
    };

    render(<MarkdownRenderer {...defaultProps} document={docWithInlineCode} />);

    const inlineCode = screen.getByText('inline code');
    expect(inlineCode.tagName.toLowerCase()).toBe('code');
  });

  it('should handle images', () => {
    const docWithImage = {
      ...mockDocument,
      content: '![Alt text](/path/to/image.png)',
    };

    render(<MarkdownRenderer {...defaultProps} document={docWithImage} />);

    const image = screen.getByAltText('Alt text') as HTMLImageElement;
    expect(image).toBeInTheDocument();
    expect(image.src).toContain('/path/to/image.png');
  });

  it('should render pseudocode blocks with special highlighting', () => {
    const docWithPseudocode = {
      ...mockDocument,
      content: `\`\`\`pseudocode
PROCEDURE QuickSort(arr, low, high)
  IF low < high THEN
    pivot ← Partition(arr, low, high)
    QuickSort(arr, low, pivot - 1)
    QuickSort(arr, pivot + 1, high)
  END IF
END PROCEDURE
\`\`\``,
    };

    render(<MarkdownRenderer {...defaultProps} document={docWithPseudocode} />);

    // Check that the pseudocode is rendered (might be split across elements)
    const content = screen.getByTestId('markdown-content');
    expect(content.textContent).toContain('PROCEDURE');
    expect(content.textContent).toContain('QuickSort');
    // Check for code language label
    expect(screen.getByText('pseudocode')).toBeInTheDocument();
  });

  it('should handle horizontal rules', () => {
    const docWithHr = {
      ...mockDocument,
      content: 'Content above\n\n---\n\nContent below',
    };

    render(<MarkdownRenderer {...defaultProps} document={docWithHr} />);

    // Check for hr element
    const hrElement = document.querySelector('hr');
    expect(hrElement).toBeInTheDocument();
  });

  it('should apply custom CSS classes for styling', () => {
    render(<MarkdownRenderer {...defaultProps} />);

    const container = screen.getByTestId('markdown-content');
    // Check for module CSS class
    expect(container.className).toContain('markdownContent');
  });

  it('should handle empty document gracefully', () => {
    const emptyDoc = {
      ...mockDocument,
      content: '',
    };

    render(<MarkdownRenderer {...defaultProps} document={emptyDoc} />);

    const container = screen.getByTestId('markdown-content');
    // Component shows a message for empty content
    expect(container.textContent).toBe('No content available for this document.');
  });

  it('should sanitize dangerous HTML', () => {
    const docWithScript = {
      ...mockDocument,
      content: '<script>alert("XSS")</script>Normal content',
    };

    render(<MarkdownRenderer {...defaultProps} document={docWithScript} />);

    // ReactMarkdown escapes HTML by default, so the script tag becomes text
    expect(document.querySelector('script')).not.toBeInTheDocument();
    // The text content might be rendered differently
    expect(screen.getByText(/Normal content/)).toBeInTheDocument();
  });
});