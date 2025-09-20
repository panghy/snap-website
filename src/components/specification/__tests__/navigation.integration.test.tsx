import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpecificationPage } from '../SpecificationPage';

// Mock fetch for integration tests
global.fetch = vi.fn();

// Mock IntersectionObserver for scroll-based navigation
global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
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

describe('Specification Page Integration - Navigation Scenarios (T011)', () => {
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
              {
                id: '02-implementation',
                title: 'Implementation',
                description: 'Implementation details',
                order: 2,
                documents: ['01-client.md', '02-server.md'],
              },
            ],
          }),
        });
      }

      if (url.includes('.md')) {
        const fileName = url.split('/').pop();
        let content = '';

        if (fileName === '01-introduction.md') {
          content = `---
title: Introduction to SNAPs
version: 0.1.0
date: 2025-01-19
status: draft
---

# Introduction to SNAPs

This document provides an overview of the SNAP protocol.

## What are SNAPs?

SNAPs (Secure Network Authentication Protocol) are a new approach to secure authentication.

### Key Features

- Secure by design
- Scalable architecture
- Easy integration

### Benefits

- Enhanced security
- Better performance

## Getting Started

Follow these steps to get started with SNAPs.

### Prerequisites

Ensure you have the following installed:

1. Node.js 18+
2. Docker
3. Git

### Installation

Run the following commands:

\`\`\`bash
npm install @snap/core
\`\`\`

## Next Steps

Continue to the [Principles](02-principles.md) document.`;
        } else if (fileName === '02-principles.md') {
          content = `---
title: Core Principles
version: 0.1.0
date: 2025-01-19
status: draft
---

# Core Principles

The fundamental principles that guide SNAP development.

## Design Philosophy

Our design philosophy focuses on simplicity and security.

### Principle 1: Security First

Security is our top priority in all design decisions.

### Principle 2: Performance

High performance is essential for production deployments.

## Implementation Guidelines

Follow these guidelines when implementing SNAP features.

### Code Quality

Maintain high code quality standards.

### Testing

Comprehensive testing is required for all features.

## Architecture Overview

The SNAP architecture consists of multiple layers.`;
        } else if (fileName === '01-transactions.md') {
          content = `---
title: Transaction Processing
version: 0.1.0
date: 2025-01-19
status: draft
---

# Transaction Processing

How SNAPs handle transaction processing.

## Transaction Types

There are several types of transactions supported.

### Authentication Transactions

Used for user authentication.

### Data Transactions

Used for data transfer.

## Processing Flow

The transaction processing flow follows these steps.

### Validation

All transactions must be validated.

### Execution

Valid transactions are executed.

### Confirmation

Executed transactions are confirmed.`;
        } else {
          content = `---
title: ${fileName.replace('.md', '').replace(/^\d+-/, '').replace('-', ' ')}
version: 0.1.0
date: 2025-01-19
status: draft
---

# ${fileName.replace('.md', '').replace(/^\d+-/, '').replace('-', ' ')}

Sample content for ${fileName}

## Section 1

Content for section 1.

## Section 2

Content for section 2.`;
        }

        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(content),
        });
      }

      return Promise.reject(new Error('Unknown URL'));
    });

    // Mock smooth scrolling behavior
    Object.defineProperty(window, 'scrollTo', {
      value: vi.fn().mockImplementation((options) => {
        if (typeof options === 'object' && options.behavior === 'smooth') {
          // Simulate smooth scroll completion
          setTimeout(() => {
            fireEvent.scroll(window, { target: { scrollY: options.top || 0 } });
          }, 100);
        }
      }),
      writable: true,
    });
  });

  afterEach(() => {
    window.scrollTo = originalScrollTo;
    vi.clearAllTimers();
  });

  it('should navigate through TOC sections and documents', async () => {
    const user = userEvent.setup();

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Start with Overview section collapsed, expand it
    await user.click(screen.getByText('Overview'));

    await waitFor(() => {
      expect(screen.getByText('01-introduction.md')).toBeInTheDocument();
    });

    // Navigate to first document
    await user.click(screen.getByText('01-introduction.md'));

    await waitFor(() => {
      expect(screen.getByText('Introduction to SNAPs')).toBeInTheDocument();
      expect(screen.getByText('What are SNAPs?')).toBeInTheDocument();
    });

    // Navigate to second document in same section
    await user.click(screen.getByText('02-principles.md'));

    await waitFor(() => {
      expect(screen.getByText('Core Principles')).toBeInTheDocument();
    });

    // Navigate to different section
    await user.click(screen.getByText('Core Concepts'));
    await user.click(screen.getByText('01-transactions.md'));

    await waitFor(() => {
      expect(screen.getByText('Transaction Processing')).toBeInTheDocument();
    });
  });

  it('should handle TOC heading navigation with smooth scrolling', async () => {
    const user = userEvent.setup();

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Load a document with headings
    await user.click(screen.getByText('Overview'));
    await user.click(screen.getByText('01-introduction.md'));

    await waitFor(() => {
      expect(screen.getByText('Introduction to SNAPs')).toBeInTheDocument();
    });

    // Click on a heading in the TOC
    const whatAreSNAPsHeading = screen.getByRole('button', { name: /what are snaps/i });
    await user.click(whatAreSNAPsHeading);

    // Should trigger smooth scroll to the heading
    await waitFor(() => {
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      });
    });

    // Should update current heading highlight
    await waitFor(() => {
      expect(whatAreSNAPsHeading).toHaveClass('active');
    });
  });

  it('should support anchor navigation via URL hash', async () => {
    // Set initial hash before rendering
    window.location.hash = '#what-are-snaps';

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Should automatically navigate to the document and heading
    await waitFor(() => {
      expect(screen.getByText('Introduction to SNAPs')).toBeInTheDocument();
    });

    // Should scroll to the specific heading
    await waitFor(() => {
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });

    // Should highlight the current heading
    const targetHeading = screen.getByText('What are SNAPs?');
    expect(targetHeading.closest('[data-heading-id="what-are-snaps"]')).toHaveClass('active');
  });

  it('should update URL hash when navigating to headings', async () => {
    const pushStateSpy = vi.spyOn(history, 'pushState');
    const user = userEvent.setup();

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Navigate to a document
    await user.click(screen.getByText('Overview'));
    await user.click(screen.getByText('01-introduction.md'));

    await waitFor(() => {
      expect(screen.getByText('Introduction to SNAPs')).toBeInTheDocument();
    });

    // Click on a heading
    const keyFeaturesHeading = screen.getByText('Key Features');
    await user.click(keyFeaturesHeading);

    // Should update browser history with hash
    await waitFor(() => {
      expect(pushStateSpy).toHaveBeenCalledWith(
        null,
        '',
        expect.stringContaining('#key-features')
      );
    });

    pushStateSpy.mockRestore();
  });

  it('should handle back/forward navigation with heading context', async () => {
    const user = userEvent.setup();

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Navigate through multiple documents and headings
    await user.click(screen.getByText('Overview'));
    await user.click(screen.getByText('01-introduction.md'));

    await waitFor(() => {
      expect(screen.getByText('Introduction to SNAPs')).toBeInTheDocument();
    });

    await user.click(screen.getByText('What are SNAPs?'));

    await user.click(screen.getByText('02-principles.md'));

    await waitFor(() => {
      expect(screen.getByText('Core Principles')).toBeInTheDocument();
    });

    // Simulate browser back button
    window.history.back();
    window.dispatchEvent(new PopStateEvent('popstate', {
      state: { documentId: '01-introduction', headingId: 'what-are-snaps' }
    }));

    // Should return to previous document and heading
    await waitFor(() => {
      expect(screen.getByText('Introduction to SNAPs')).toBeInTheDocument();
      const whatAreSNAPsHeading = screen.getByText('What are SNAPs?');
      expect(whatAreSNAPsHeading.closest('[data-heading-id="what-are-snaps"]')).toHaveClass('active');
    });
  });

  it('should provide breadcrumb navigation', async () => {
    const user = userEvent.setup();

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Navigate to a nested location
    await user.click(screen.getByText('Core Concepts'));
    await user.click(screen.getByText('01-transactions.md'));

    await waitFor(() => {
      expect(screen.getByText('Transaction Processing')).toBeInTheDocument();
    });

    // Should show breadcrumb navigation
    const breadcrumbs = screen.getByTestId('breadcrumb-navigation');
    expect(breadcrumbs).toBeInTheDocument();
    expect(within(breadcrumbs).getByText('Core Concepts')).toBeInTheDocument();
    expect(within(breadcrumbs).getByText('Transaction Processing')).toBeInTheDocument();

    // Clicking on breadcrumb should navigate
    await user.click(within(breadcrumbs).getByText('Core Concepts'));

    // Should expand the section and show documents list
    await waitFor(() => {
      expect(screen.getByText('01-transactions.md')).toBeInTheDocument();
      expect(screen.getByText('02-directories.md')).toBeInTheDocument();
    });
  });

  it('should support keyboard navigation through TOC', async () => {
    const user = userEvent.setup();

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Focus on first section
    const overviewSection = screen.getByText('Overview');
    overviewSection.focus();

    // Arrow down should move to next section
    await user.keyboard('{ArrowDown}');

    const coreConceptsSection = screen.getByText('Core Concepts');
    expect(coreConceptsSection).toHaveFocus();

    // Enter should expand section
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('01-transactions.md')).toBeInTheDocument();
    });

    // Arrow down should move to first document
    await user.keyboard('{ArrowDown}');

    const firstDoc = screen.getByText('01-transactions.md');
    expect(firstDoc).toHaveFocus();

    // Enter should select document
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Transaction Processing')).toBeInTheDocument();
    });
  });

  it('should track scroll position and highlight current heading', async () => {
    const user = userEvent.setup();
    const intersectionObserverCallback = vi.fn();

    // Mock IntersectionObserver to simulate heading visibility
    global.IntersectionObserver = vi.fn().mockImplementation((callback) => {
      intersectionObserverCallback.mockImplementation(callback);
      return {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
        root: null,
        rootMargin: '',
        thresholds: [],
      };
    });

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Load document with headings
    await user.click(screen.getByText('Overview'));
    await user.click(screen.getByText('01-introduction.md'));

    await waitFor(() => {
      expect(screen.getByText('Introduction to SNAPs')).toBeInTheDocument();
    });

    // Simulate scrolling to a heading
    const headingElement = screen.getByText('What are SNAPs?');
    intersectionObserverCallback([
      {
        target: headingElement.closest('[data-heading-id]'),
        isIntersecting: true,
        intersectionRatio: 1,
      },
    ]);

    // TOC should highlight the current heading
    await waitFor(() => {
      const tocHeading = screen.getByRole('button', { name: /what are snaps/i });
      expect(tocHeading).toHaveClass('active');
    });
  });

  it('should handle jump-to-section functionality', async () => {
    const user = userEvent.setup();

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Load a document
    await user.click(screen.getByText('Overview'));
    await user.click(screen.getByText('01-introduction.md'));

    await waitFor(() => {
      expect(screen.getByText('Introduction to SNAPs')).toBeInTheDocument();
    });

    // Click "Jump to section" button for a specific heading
    const jumpButton = screen.getByLabelText('Jump to Getting Started section');
    await user.click(jumpButton);

    // Should scroll to the section
    await waitFor(() => {
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      });
    });

    // Should update URL hash
    expect(window.location.hash).toBe('#getting-started');
  });

  it('should support cross-document reference navigation', async () => {
    const user = userEvent.setup();

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Load introduction document
    await user.click(screen.getByText('Overview'));
    await user.click(screen.getByText('01-introduction.md'));

    await waitFor(() => {
      expect(screen.getByText('Introduction to SNAPs')).toBeInTheDocument();
    });

    // Click on cross-reference link to Principles document
    const principlesLink = screen.getByRole('link', { name: /principles/i });
    await user.click(principlesLink);

    // Should navigate to the referenced document
    await waitFor(() => {
      expect(screen.getByText('Core Principles')).toBeInTheDocument();
    });

    // Should update TOC selection
    const principlesDoc = screen.getByText('02-principles.md');
    expect(principlesDoc.closest('.toc-document')).toHaveClass('active');
  });

  it('should maintain navigation state across page refreshes', async () => {
    const user = userEvent.setup();

    // Set initial state in localStorage
    localStorage.setItem('snap-spec-navigation', JSON.stringify({
      currentDocument: '01-introduction',
      currentHeading: 'key-features',
      expandedSections: ['00-overview'],
    }));

    render(<SpecificationPage />);

    // Should restore previous navigation state
    await waitFor(() => {
      expect(screen.getByText('Introduction to SNAPs')).toBeInTheDocument();
    });

    await waitFor(() => {
      const keyFeaturesHeading = screen.getByText('Key Features');
      expect(keyFeaturesHeading.closest('[data-heading-id="key-features"]')).toHaveClass('active');
    });

    // Overview section should be expanded
    expect(screen.getByText('01-introduction.md')).toBeInTheDocument();
    expect(screen.getByText('02-principles.md')).toBeInTheDocument();
  });
});