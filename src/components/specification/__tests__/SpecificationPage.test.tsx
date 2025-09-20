import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpecificationPage } from '../SpecificationPage';
import { SpecificationService } from '../../../services/specification';

// Mock the service
vi.mock('../../../services/specification');

// Mock child components
vi.mock('../TOCSidebar', () => ({
  TOCSidebar: ({ onDocumentSelect }: any) => (
    <div data-testid="toc-sidebar">
      <button onClick={() => onDocumentSelect('test-doc')}>Select Document</button>
    </div>
  ),
}));

vi.mock('../MarkdownRenderer', () => ({
  MarkdownRenderer: ({ document }: any) => (
    <div data-testid="markdown-renderer">{document?.title}</div>
  ),
}));

describe('SpecificationPage', () => {
  const mockService = {
    loadSpecification: vi.fn(),
    loadDocument: vi.fn(),
    buildTableOfContents: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (SpecificationService as any).mockImplementation(() => mockService);
  });

  it('should render the specification page layout', async () => {
    mockService.loadSpecification.mockResolvedValue({
      metadata: {
        specVersion: '0.1.0',
        status: 'draft',
      },
      toc: {
        sections: [
          {
            id: 'overview',
            title: 'Overview',
            documents: ['intro'],
          },
        ],
      },
    });

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByTestId('toc-sidebar')).toBeInTheDocument();
    });
  });

  it('should load the first document by default', async () => {
    const mockToc = {
      sections: [
        {
          id: 'overview',
          documents: ['intro'],
        },
      ],
    };

    mockService.loadSpecification.mockResolvedValue({
      metadata: {},
      toc: mockToc,
    });

    mockService.loadDocument.mockResolvedValue({
      id: 'intro',
      title: 'Introduction',
      content: '# Introduction',
    });

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(mockService.loadDocument).toHaveBeenCalledWith('intro');
    });
  });

  it('should handle document selection from TOC', async () => {
    mockService.loadSpecification.mockResolvedValue({
      metadata: {},
      toc: {
        sections: [
          {
            id: 'overview',
            documents: ['intro', 'concepts'],
          },
        ],
      },
    });

    mockService.loadDocument.mockResolvedValue({
      id: 'concepts',
      title: 'Core Concepts',
      content: '# Core Concepts',
    });

    render(<SpecificationPage />);

    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('Select Document')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Select Document'));

    await waitFor(() => {
      expect(mockService.loadDocument).toHaveBeenCalledWith('test-doc');
    });
  });

  it('should show loading state while fetching', async () => {
    mockService.loadSpecification.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<SpecificationPage />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should handle errors gracefully', async () => {
    mockService.loadSpecification.mockRejectedValue(new Error('Failed to load'));

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load/)).toBeInTheDocument();
    });
  });

  it('should toggle TOC visibility', async () => {
    mockService.loadSpecification.mockResolvedValue({
      metadata: {},
      toc: { sections: [] },
    });

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByTestId('toc-sidebar')).toBeInTheDocument();
    });

    const toggleButton = screen.getByLabelText('Toggle TOC');
    await userEvent.click(toggleButton);

    expect(screen.getByTestId('toc-sidebar')).toHaveClass('hidden');
  });

  it('should update URL when document changes', async () => {
    const mockPushState = vi.fn();
    window.history.pushState = mockPushState;

    mockService.loadSpecification.mockResolvedValue({
      metadata: {},
      toc: {
        sections: [{ id: 'overview', documents: ['intro'] }],
      },
    });

    mockService.loadDocument.mockResolvedValue({
      id: 'intro',
      title: 'Introduction',
    });

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(mockPushState).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.stringContaining('intro')
      );
    });
  });

  it('should scroll to heading when hash changes', async () => {
    const mockScrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = mockScrollIntoView;

    mockService.loadSpecification.mockResolvedValue({
      metadata: {},
      toc: { sections: [] },
    });

    render(<SpecificationPage />);

    // Simulate hash change
    window.location.hash = '#test-heading';
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    await waitFor(() => {
      expect(mockScrollIntoView).toHaveBeenCalled();
    });
  });

  it('should render mobile-responsive layout', async () => {
    // Mock mobile viewport
    window.innerWidth = 500;

    mockService.loadSpecification.mockResolvedValue({
      metadata: {},
      toc: { sections: [] },
    });

    render(<SpecificationPage />);

    await waitFor(() => {
      const sidebar = screen.getByTestId('toc-sidebar');
      expect(sidebar).toHaveClass('mobile');
    });
  });

  it('should preserve expanded sections in TOC', async () => {
    mockService.loadSpecification.mockResolvedValue({
      metadata: {},
      toc: {
        sections: [{ id: 'overview', documents: [] }],
        expandedSections: new Set(['overview']),
      },
    });

    render(<SpecificationPage />);

    await waitFor(() => {
      const section = screen.getByTestId('section-overview');
      expect(section).toHaveClass('expanded');
    });
  });
});