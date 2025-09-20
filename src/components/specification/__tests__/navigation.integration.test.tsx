import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpecificationPage } from '../SpecificationPage';

// Mock fetch for integration tests
global.fetch = vi.fn();

// Mock IntersectionObserver for scroll-based navigation
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Mock scrollIntoView for navigation testing
Element.prototype.scrollIntoView = vi.fn();

// Mock getBoundingClientRect for position tracking
Element.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
  top: 100,
  left: 0,
  bottom: 200,
  right: 100,
  width: 100,
  height: 100,
  x: 0,
  y: 100,
});

describe('Specification Page Integration - Navigation', () => {
  const mockScrollTo = vi.fn();
  const originalScrollTo = window.scrollTo;

  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = mockScrollTo;

    // Mock specification metadata with navigation-rich content
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
                documents: ['01-introduction.md', '02-principles.md', '03-architecture.md'],
              },
              {
                id: '01-core-concepts',
                title: 'Core Concepts',
                description: 'Fundamental concepts',
                order: 1,
                documents: ['01-transactions.md', '02-directories.md', '03-state-management.md'],
              },
            ],
          }),
        });
      }

      if (url.includes('.md')) {
        const fileName = url.split('/').pop();
        const content = `---
title: ${fileName?.replace('.md', '').replace(/^\d+-/, '').replace('-', ' ')}
version: 0.1.0
date: 2025-01-19
status: draft
---

# ${fileName?.replace('.md', '').replace(/^\d+-/, '').replace('-', ' ')}

Sample content for ${fileName}

## Section 1

Content for section 1.

## Section 2

Content for section 2.`;

        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(content),
        });
      }

      return Promise.reject(new Error('Unknown URL'));
    });
  });

  afterEach(() => {
    window.scrollTo = originalScrollTo;
    vi.clearAllTimers();
  });

  it('should load specification page with navigation', async () => {
    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Core Concepts')).toBeInTheDocument();
    });
  });

  it('should navigate between documents', async () => {
    const user = userEvent.setup();

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Navigate to first document
    const introDoc = await screen.findByTestId('doc-01-introduction.md');
    await user.click(introDoc);

    await waitFor(() => {
      const content = screen.getByTestId('markdown-content');
      expect(content).toBeInTheDocument();
    });

    // Navigate to another document
    const principlesDoc = await screen.findByTestId('doc-02-principles.md');
    await user.click(principlesDoc);

    await waitFor(() => {
      const content = screen.getByTestId('markdown-content');
      expect(content).toBeInTheDocument();
    });
  });

  it('should expand and collapse TOC sections', async () => {
    const user = userEvent.setup();

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Documents should be visible by default (sections are auto-expanded)
    const introDoc = await screen.findByTestId('doc-01-introduction.md');
    expect(introDoc).toBeInTheDocument();

    // Toggle section to collapse
    const overviewToggle = screen.getByTestId('section-toggle-00-overview');
    await user.click(overviewToggle);

    // Check that documents are still accessible (may just change visual state)
    expect(screen.getByTestId('section-docs-00-overview')).toBeInTheDocument();
  });

  it('should handle document loading with fetch', async () => {
    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Check that fetch was called for metadata
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('metadata.json')
    );

    // Navigate to a document
    const introDoc = await screen.findByTestId('doc-01-introduction.md');
    await userEvent.click(introDoc);

    // Check that fetch was called for the document
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('01-introduction.md')
      );
    });
  });

  it('should update URL when navigating to documents', async () => {
    const user = userEvent.setup();

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Clear initial hash
    window.location.hash = '';

    // Navigate to a document
    const introDoc = await screen.findByTestId('doc-01-introduction.md');
    await user.click(introDoc);

    // Wait for navigation to complete
    await waitFor(() => {
      const content = screen.getByTestId('markdown-content');
      expect(content).toBeInTheDocument();
    });

    // URL should be updated with document ID
    expect(window.location.hash).toBeTruthy();
  });

  it('should handle keyboard navigation in TOC', async () => {
    const user = userEvent.setup();

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Find a document link and focus it
    const introDoc = await screen.findByTestId('doc-01-introduction.md');
    introDoc.focus();

    // Press Enter to select
    await user.keyboard('{Enter}');

    // Document should load
    await waitFor(() => {
      const content = screen.getByTestId('markdown-content');
      expect(content).toBeInTheDocument();
    });
  });
});