import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpecificationPage } from '../SpecificationPage';

// Mock fetch for integration tests
global.fetch = vi.fn();

// Mock ResizeObserver for mobile testing
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia for responsive testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('Specification Page Integration - Mobile Responsiveness', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock specification metadata and documents
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

      if (url.includes('.md')) {
        const content = `---
title: Test Mobile Document
version: 0.1.0
date: 2025-01-19
status: draft
---

# Test Mobile Document

This is a test document for mobile responsiveness testing.

## Section 1

Mobile content here with long text that should wrap properly on small screens and maintain readability across different viewport sizes.

### Subsection 1.1

More detailed content that tests the responsive layout behavior.

## Section 2

Additional content for navigation testing.`;

        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(content),
        });
      }

      return Promise.reject(new Error('Unknown URL'));
    });
  });

  afterEach(() => {
    // Restore original viewport size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });

    // Fire resize event to update components
    fireEvent(window, new Event('resize'));
  });

  it('should render specification page on mobile viewport', async () => {
    // Set mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Should render TOC sidebar even on mobile
    const tocSidebar = screen.getByTestId('toc-sidebar');
    expect(tocSidebar).toBeInTheDocument();
  });

  it('should load and display documents on mobile', async () => {
    // Set mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Document should be accessible
    const introDoc = await screen.findByTestId('doc-01-introduction.md');
    expect(introDoc).toBeInTheDocument();

    // Click to load document
    await userEvent.click(introDoc);

    // Document should load - check for markdown content container instead
    await waitFor(() => {
      const content = screen.getByTestId('markdown-content');
      expect(content).toBeInTheDocument();
    });
  });

  it('should handle viewport resize events', async () => {
    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Start with desktop viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200,
    });
    fireEvent(window, new Event('resize'));

    // TOC should be visible
    const tocSidebar = screen.getByTestId('toc-sidebar');
    expect(tocSidebar).toBeInTheDocument();

    // Change to mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    fireEvent(window, new Event('resize'));

    // TOC should still exist but may be hidden
    expect(tocSidebar).toBeInTheDocument();
  });
});