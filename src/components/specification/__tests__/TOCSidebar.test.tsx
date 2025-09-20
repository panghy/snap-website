import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TOCSidebar } from '../TOCSidebar';
import type { TableOfContents } from '../../../types/specification';

describe('TOCSidebar', () => {
  const mockToc: TableOfContents = {
    version: '1.0.0',
    generated: new Date().toISOString(),
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        description: 'Introduction to SNAPs',
        order: 0,
        documents: ['intro', 'principles'],
      },
      {
        id: 'concepts',
        title: 'Core Concepts',
        description: 'Fundamental concepts',
        order: 1,
        documents: ['transactions', 'directories'],
      },
    ],
    documents: new Map(),
    expandedSections: new Set(['overview']),
  };

  const defaultProps = {
    toc: mockToc,
    currentDocumentId: null,
    currentHeadingId: null,
    expandedSections: new Set<string>(),
    onDocumentSelect: vi.fn(),
    onHeadingSelect: vi.fn(),
    onSectionToggle: vi.fn(),
    isVisible: true,
    onClose: vi.fn(),
  };

  it('should render all sections', () => {
    render(<TOCSidebar {...defaultProps} />);

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Core Concepts')).toBeInTheDocument();
  });

  it('should render section descriptions', () => {
    render(<TOCSidebar {...defaultProps} />);

    expect(screen.getByText('Introduction to SNAPs')).toBeInTheDocument();
    expect(screen.getByText('Fundamental concepts')).toBeInTheDocument();
  });

  it('should highlight current document', () => {
    render(
      <TOCSidebar {...defaultProps} currentDocumentId="intro" />
    );

    const introLink = screen.getByTestId('doc-intro');
    expect(introLink).toHaveClass('active');
  });

  it('should handle document selection', async () => {
    const onDocumentSelect = vi.fn();
    render(
      <TOCSidebar {...defaultProps} onDocumentSelect={onDocumentSelect} />
    );

    const user = userEvent.setup();
    await user.click(screen.getByTestId('doc-intro'));

    expect(onDocumentSelect).toHaveBeenCalledWith('intro');
  });

  it('should toggle section expansion', async () => {
    const onSectionToggle = vi.fn();
    render(
      <TOCSidebar {...defaultProps} onSectionToggle={onSectionToggle} />
    );

    const user = userEvent.setup();
    await user.click(screen.getByTestId('section-toggle-overview'));

    expect(onSectionToggle).toHaveBeenCalledWith('overview');
  });

  it('should show expanded sections', () => {
    render(
      <TOCSidebar
        {...defaultProps}
        expandedSections={new Set(['overview'])}
      />
    );

    const overviewDocs = screen.getByTestId('section-docs-overview');
    expect(overviewDocs).toBeVisible();
  });

  it('should hide collapsed sections', () => {
    render(
      <TOCSidebar
        {...defaultProps}
        expandedSections={new Set()}
      />
    );

    const overviewDocs = screen.getByTestId('section-docs-overview');
    expect(overviewDocs).not.toBeVisible();
  });

  it('should handle close button on mobile', async () => {
    const onClose = vi.fn();
    render(
      <TOCSidebar {...defaultProps} onClose={onClose} />
    );

    const user = userEvent.setup();
    await user.click(screen.getByLabelText('Close sidebar'));

    expect(onClose).toHaveBeenCalled();
  });

  it('should be hidden when isVisible is false', () => {
    render(
      <TOCSidebar {...defaultProps} isVisible={false} />
    );

    const sidebar = screen.getByTestId('toc-sidebar');
    expect(sidebar).toHaveClass('hidden');
  });

  it('should render document headings when available', () => {
    const tocWithHeadings = {
      ...mockToc,
      documents: new Map([
        ['intro', {
          id: 'intro',
          headings: [
            { id: 'what-are-snaps', text: 'What are SNAPs?', level: 2 },
            { id: 'why-snaps', text: 'Why SNAPs?', level: 2 },
          ],
        }],
      ]),
    };

    render(
      <TOCSidebar
        {...defaultProps}
        toc={tocWithHeadings}
        expandedSections={new Set(['overview'])}
        currentDocumentId="intro"
      />
    );

    expect(screen.getByText('What are SNAPs?')).toBeInTheDocument();
    expect(screen.getByText('Why SNAPs?')).toBeInTheDocument();
  });

  it('should handle heading selection', async () => {
    const onHeadingSelect = vi.fn();
    const tocWithHeadings = {
      ...mockToc,
      documents: new Map([
        ['intro', {
          id: 'intro',
          headings: [
            { id: 'what-are-snaps', text: 'What are SNAPs?', level: 2 },
          ],
        }],
      ]),
    };

    render(
      <TOCSidebar
        {...defaultProps}
        toc={tocWithHeadings}
        expandedSections={new Set(['overview'])}
        currentDocumentId="intro"
        onHeadingSelect={onHeadingSelect}
      />
    );

    const user = userEvent.setup();
    await user.click(screen.getByText('What are SNAPs?'));

    expect(onHeadingSelect).toHaveBeenCalledWith('what-are-snaps');
  });

  it('should highlight current heading', () => {
    const tocWithHeadings = {
      ...mockToc,
      documents: new Map([
        ['intro', {
          id: 'intro',
          headings: [
            { id: 'what-are-snaps', text: 'What are SNAPs?', level: 2 },
          ],
        }],
      ]),
    };

    render(
      <TOCSidebar
        {...defaultProps}
        toc={tocWithHeadings}
        currentDocumentId="intro"
        currentHeadingId="what-are-snaps"
        expandedSections={new Set(['overview'])}
      />
    );

    const heading = screen.getByTestId('heading-what-are-snaps');
    expect(heading).toHaveClass('active');
  });

  it('should handle keyboard navigation', async () => {
    const onDocumentSelect = vi.fn();
    render(
      <TOCSidebar {...defaultProps} onDocumentSelect={onDocumentSelect} />
    );

    const user = userEvent.setup();
    const firstDoc = screen.getByTestId('doc-intro');

    firstDoc.focus();
    await user.keyboard('{Enter}');

    expect(onDocumentSelect).toHaveBeenCalledWith('intro');
  });

  it('should display section icons if provided', () => {
    const tocWithIcons = {
      ...mockToc,
      sections: [
        {
          ...mockToc.sections[0],
          icon: '📚',
        },
      ],
    };

    render(<TOCSidebar {...defaultProps} toc={tocWithIcons} />);

    expect(screen.getByText('📚')).toBeInTheDocument();
  });
});