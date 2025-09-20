import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MarkdownRenderer } from '../MarkdownRenderer';
import type { SpecificationDocument } from '../../../types/specification';

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
      { id: 'test-document', text: 'Test Document', level: 1, children: [], documentId: 'test-doc' },
      { id: 'section-1', text: 'Section 1', level: 2, children: [], documentId: 'test-doc' },
      { id: 'subsection-1-1', text: 'Subsection 1.1', level: 3, children: [], documentId: 'test-doc' },
      { id: 'section-2', text: 'Section 2', level: 2, children: [], documentId: 'test-doc' },
    ],
    metadata: {},
  };

  const defaultProps = {
    document: mockDocument,
    onHeadingClick: vi.fn(),
    currentHeadingId: null,
  };

  it('should render markdown content', () => {
    render(<MarkdownRenderer {...defaultProps} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Test Document' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Section 1' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Subsection 1.1' })).toBeInTheDocument();
  });

  it('should render formatted text', () => {
    render(<MarkdownRenderer {...defaultProps} />);

    expect(screen.getByText('bold')).toBeInTheDocument();
    expect(screen.getByText('italic')).toBeInTheDocument();
  });

  it('should render code blocks with syntax highlighting', () => {
    render(<MarkdownRenderer {...defaultProps} />);

    const codeBlock = screen.getByText(/function hello/);
    expect(codeBlock).toBeInTheDocument();
    expect(codeBlock.closest('pre')).toHaveClass('language-javascript');
  });

  it('should render lists', () => {
    render(<MarkdownRenderer {...defaultProps} />);

    expect(screen.getByText('List item 1')).toBeInTheDocument();
    expect(screen.getByText('List item 2')).toBeInTheDocument();
    expect(screen.getByText('List item 3')).toBeInTheDocument();
  });

  it('should render links', () => {
    render(<MarkdownRenderer {...defaultProps} />);

    const link = screen.getByRole('link', { name: 'This is a link' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('should handle heading clicks', async () => {
    const onHeadingClick = vi.fn();
    render(<MarkdownRenderer {...defaultProps} onHeadingClick={onHeadingClick} />);

    const user = userEvent.setup();
    const heading = screen.getByRole('heading', { name: 'Section 1' });
    await user.click(heading);

    expect(onHeadingClick).toHaveBeenCalledWith('section-1');
  });

  it('should highlight current heading', () => {
    render(<MarkdownRenderer {...defaultProps} currentHeadingId="section-1" />);

    const heading = screen.getByRole('heading', { name: 'Section 1' });
    expect(heading).toHaveClass('active');
  });

  it('should render tables from markdown', () => {
    const docWithTable = {
      ...mockDocument,
      content: `| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |`,
    };

    render(<MarkdownRenderer document={docWithTable} {...defaultProps} />);

    expect(screen.getByText('Column 1')).toBeInTheDocument();
    expect(screen.getByText('Cell 1')).toBeInTheDocument();
  });

  it('should render blockquotes', () => {
    const docWithBlockquote = {
      ...mockDocument,
      content: '> This is a blockquote\n> with multiple lines',
    };

    render(<MarkdownRenderer document={docWithBlockquote} {...defaultProps} />);

    const blockquote = screen.getByText(/This is a blockquote/);
    expect(blockquote.closest('blockquote')).toBeInTheDocument();
  });

  it('should render inline code', () => {
    const docWithInlineCode = {
      ...mockDocument,
      content: 'This is `inline code` in a paragraph.',
    };

    render(<MarkdownRenderer document={docWithInlineCode} {...defaultProps} />);

    const inlineCode = screen.getByText('inline code');
    expect(inlineCode.tagName).toBe('CODE');
  });

  it('should handle images', () => {
    const docWithImage = {
      ...mockDocument,
      content: '![Alt text](/path/to/image.png)',
    };

    render(<MarkdownRenderer document={docWithImage} {...defaultProps} />);

    const image = screen.getByAltText('Alt text');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/path/to/image.png');
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

    render(<MarkdownRenderer document={docWithPseudocode} {...defaultProps} />);

    const codeBlock = screen.getByText(/PROCEDURE QuickSort/);
    expect(codeBlock).toBeInTheDocument();
    expect(codeBlock.closest('pre')).toHaveClass('language-pseudocode');
  });

  it('should handle horizontal rules', () => {
    const docWithHr = {
      ...mockDocument,
      content: 'Content above\n\n---\n\nContent below',
    };

    render(<MarkdownRenderer document={docWithHr} {...defaultProps} />);

    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('should apply custom CSS classes for styling', () => {
    render(<MarkdownRenderer {...defaultProps} />);

    const container = screen.getByTestId('markdown-content');
    expect(container).toHaveClass('markdownContent');
  });

  it('should handle empty document gracefully', () => {
    const emptyDoc = {
      ...mockDocument,
      content: '',
    };

    render(<MarkdownRenderer document={emptyDoc} {...defaultProps} />);

    const container = screen.getByTestId('markdown-content');
    expect(container).toBeEmptyDOMElement();
  });

  it('should sanitize dangerous HTML', () => {
    const docWithScript = {
      ...mockDocument,
      content: '<script>alert("XSS")</script>Normal content',
    };

    render(<MarkdownRenderer document={docWithScript} {...defaultProps} />);

    expect(screen.queryByText('alert("XSS")')).not.toBeInTheDocument();
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });
});