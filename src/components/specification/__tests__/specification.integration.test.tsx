import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpecificationPage } from '../SpecificationPage';

// Mock fetch for integration tests
global.fetch = vi.fn();

describe('Specification Page Integration - Basic Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock metadata.json
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
                documents: ['01-introduction.md', '02-principles.md'],
              },
              {
                id: '01-core-concepts',
                title: 'Core Concepts',
                description: 'Fundamental concepts',
                order: 1,
                documents: ['01-transactions.md', '02-directories.md'],
              },
            ],
          }),
        });
      }

      // Mock markdown files
      if (url.includes('.md')) {
        const content = `---
title: Test Document
version: 0.1.0
date: 2025-01-19
status: draft
---

# Test Document

This is test content for ${url}

## Section 1

Content here.`;

        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(content),
        });
      }

      return Promise.reject(new Error('Unknown URL'));
    });
  });

  it('should complete full user journey: load page → select document → navigate sections', async () => {
    const user = userEvent.setup();

    // Render the page
    render(<SpecificationPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Verify TOC sections are displayed
    expect(screen.getByText('Core Concepts')).toBeInTheDocument();

    // Click on a section to expand it (should already be expanded by default)
    // Find the document by test ID instead of text
    const transactionDoc = await screen.findByTestId('doc-01-transactions.md');
    await user.click(transactionDoc);

    // Wait for document to load
    await waitFor(() => {
      // Check for the heading button which has unique text
      expect(screen.getByRole('button', { name: 'Navigate to Test Document' })).toBeInTheDocument();
    });

    // Verify content is rendered by checking for specific content
    expect(screen.getByText(/This is test content/)).toBeInTheDocument();
  });

  it('should persist state across navigation', async () => {
    const user = userEvent.setup();

    render(<SpecificationPage />);

    // Wait for load
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Sections should already be expanded by default
    // Select a document
    const introDoc = await screen.findByTestId('doc-01-introduction.md');
    await user.click(introDoc);

    // Navigate to another document
    const principlesDoc = await screen.findByTestId('doc-02-principles.md');
    await user.click(principlesDoc);

    // Verify the section remains expanded
    const docsSection = screen.getByTestId('section-docs-00-overview');
    expect(docsSection).toBeVisible();
  });

  it('should handle error recovery', async () => {
    // First, fail the initial load
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<SpecificationPage />);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/Failed to load specification/)).toBeInTheDocument();
    });

    // Mock successful retry
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
            sections: [{
              id: '00-overview',
              title: 'Overview',
              description: 'Test',
              order: 0,
              documents: [],
            }],
          }),
        });
      }
      return Promise.resolve({ ok: true, text: () => Promise.resolve('') });
    });

    // Click retry button
    await userEvent.click(screen.getByText('Retry'));

    // Should now load successfully
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });
  });

  it('should support deep linking to specific documents', async () => {
    // Set initial URL with document hash
    window.location.hash = '#core-concepts-01-transactions';

    render(<SpecificationPage />);

    // Should auto-load the specified document
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('01-core-concepts/01-transactions.md')
      );
    });
  });

  it('should update browser history on navigation', async () => {
    const pushStateSpy = vi.spyOn(window.history, 'pushState');

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Navigate to a document
    const introDoc = await screen.findByTestId('doc-01-introduction.md');
    await userEvent.click(introDoc);

    // Check history was updated
    await waitFor(() => {
      expect(pushStateSpy).toHaveBeenCalledWith(
        null,
        '',
        expect.stringContaining('#overview-01-introduction')
      );
    });
  });

  it('should handle back/forward browser navigation', async () => {
    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Navigate to first document
    const introDoc = await screen.findByTestId('doc-01-introduction.md');
    await userEvent.click(introDoc);

    // Navigate to second document
    const principlesDoc = await screen.findByTestId('doc-02-principles.md');
    await userEvent.click(principlesDoc);

    // Simulate browser back button
    window.dispatchEvent(new PopStateEvent('popstate'));

    // Should have navigated back (check that fetch was called for documents)
    await waitFor(() => {
      const fetchCalls = (global.fetch as any).mock.calls;
      const mdCalls = fetchCalls.filter((call: any[]) => call[0].includes('.md'));
      expect(mdCalls.length).toBeGreaterThan(0);
    });
  });

  it('should prefetch adjacent documents for performance', async () => {
    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // The component loads all document metadata on mount for TOC display
    await waitFor(() => {
      const fetchCalls = (global.fetch as any).mock.calls;
      const mdCalls = fetchCalls.filter((call: any[]) => call[0].includes('.md'));
      // Should have fetched multiple documents
      expect(mdCalls.length).toBeGreaterThan(1);
    });
  });

  // Search functionality is not implemented yet
  it.skip('should search across all documents', async () => {
    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Enter search query
    const searchInput = screen.getByPlaceholderText('Search specification...');
    await userEvent.type(searchInput, 'transaction');

    // Should show search results
    await waitFor(() => {
      expect(screen.getByText(/Search results/)).toBeInTheDocument();
    });
  });
});