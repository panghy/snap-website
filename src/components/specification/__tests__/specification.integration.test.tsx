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

    // Click on a section to expand it
    await user.click(screen.getByText('Core Concepts'));

    // Select a document
    await user.click(screen.getByText('01-transactions.md'));

    // Wait for document to load
    await waitFor(() => {
      expect(screen.getByText(/Test Document/)).toBeInTheDocument();
    });

    // Verify content is rendered
    expect(screen.getByText(/Section 1/)).toBeInTheDocument();
  });

  it('should persist state across navigation', async () => {
    const user = userEvent.setup();

    render(<SpecificationPage />);

    // Wait for load
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Expand a section
    await user.click(screen.getByText('Overview'));

    // Select a document
    await user.click(screen.getByText('01-introduction.md'));

    // Navigate to another document
    await user.click(screen.getByText('02-principles.md'));

    // Verify the section remains expanded
    const overviewSection = screen.getByTestId('section-00-overview');
    expect(overviewSection).toHaveClass('expanded');
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
            sections: [{
              id: '00-overview',
              title: 'Overview',
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
    window.location.hash = '#01-transactions';

    render(<SpecificationPage />);

    // Should auto-load the specified document
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('01-transactions.md')
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
    await userEvent.click(screen.getByText('01-introduction.md'));

    // Check history was updated
    expect(pushStateSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.stringContaining('01-introduction')
    );
  });

  it('should handle back/forward browser navigation', async () => {
    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Navigate to first document
    await userEvent.click(screen.getByText('01-introduction.md'));

    // Navigate to second document
    await userEvent.click(screen.getByText('02-principles.md'));

    // Simulate browser back button
    window.dispatchEvent(new PopStateEvent('popstate'));

    // Should load previous document
    await waitFor(() => {
      expect(global.fetch).toHaveBeenLastCalledWith(
        expect.stringContaining('01-introduction.md')
      );
    });
  });

  it('should prefetch adjacent documents for performance', async () => {
    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Select a document
    await userEvent.click(screen.getByText('01-introduction.md'));

    // Should prefetch the next document
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('02-principles.md')
      );
    });
  });

  it('should search across all documents', async () => {
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