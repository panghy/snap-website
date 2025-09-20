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

describe('Specification Page Integration - Mobile Responsiveness (T010)', () => {
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

  const setMobileViewport = () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667,
    });

    // Update matchMedia mock for mobile
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(max-width: 768px)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    fireEvent(window, new Event('resize'));
  };

  const setTabletViewport = () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(max-width: 1024px)' || query === '(min-width: 768px)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    fireEvent(window, new Event('resize'));
  };

  const setDesktopViewport = () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    });

    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes('min-width: 1024px'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    fireEvent(window, new Event('resize'));
  };

  it('should render mobile layout with hamburger menu', async () => {
    setMobileViewport();

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Should show hamburger menu button
    const hamburgerButton = screen.getByLabelText(/toggle.*menu|menu.*toggle/i);
    expect(hamburgerButton).toBeInTheDocument();
    expect(hamburgerButton).toBeVisible();

    // TOC sidebar should be hidden by default on mobile
    const tocSidebar = screen.getByTestId('toc-sidebar');
    expect(tocSidebar).toHaveClass('mobile-hidden');
  });

  it('should toggle TOC sidebar visibility with hamburger menu', async () => {
    setMobileViewport();
    const user = userEvent.setup();

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    const hamburgerButton = screen.getByLabelText(/toggle.*menu|menu.*toggle/i);
    const tocSidebar = screen.getByTestId('toc-sidebar');

    // Initially hidden
    expect(tocSidebar).toHaveClass('mobile-hidden');

    // Click to show
    await user.click(hamburgerButton);
    await waitFor(() => {
      expect(tocSidebar).not.toHaveClass('mobile-hidden');
      expect(tocSidebar).toHaveClass('mobile-visible');
    });

    // Click to hide
    await user.click(hamburgerButton);
    await waitFor(() => {
      expect(tocSidebar).toHaveClass('mobile-hidden');
    });
  });

  it('should handle touch interactions for section expansion', async () => {
    setMobileViewport();
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Open mobile menu
    const hamburgerButton = screen.getByLabelText(/toggle.*menu|menu.*toggle/i);
    await user.click(hamburgerButton);

    await waitFor(() => {
      const tocSidebar = screen.getByTestId('toc-sidebar');
      expect(tocSidebar).toHaveClass('mobile-visible');
    });

    // Touch to expand section
    const coreConceptsSection = screen.getByText('Core Concepts');

    // Simulate touch events
    fireEvent.touchStart(coreConceptsSection, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    fireEvent.touchEnd(coreConceptsSection, {
      changedTouches: [{ clientX: 100, clientY: 100 }],
    });

    await user.click(coreConceptsSection);

    // Section should expand
    await waitFor(() => {
      expect(screen.getByText('01-transactions.md')).toBeInTheDocument();
    });
  });

  it('should automatically close TOC when document is selected on mobile', async () => {
    setMobileViewport();
    const user = userEvent.setup();

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Open mobile menu
    const hamburgerButton = screen.getByLabelText(/toggle.*menu|menu.*toggle/i);
    await user.click(hamburgerButton);

    const tocSidebar = screen.getByTestId('toc-sidebar');
    await waitFor(() => {
      expect(tocSidebar).toHaveClass('mobile-visible');
    });

    // Expand section and select document
    await user.click(screen.getByText('Overview'));
    await user.click(screen.getByText('01-introduction.md'));

    // TOC should auto-close on mobile after document selection
    await waitFor(() => {
      expect(tocSidebar).toHaveClass('mobile-hidden');
    });

    // Document should load
    await waitFor(() => {
      expect(screen.getByText(/Test Mobile Document/)).toBeInTheDocument();
    });
  });

  it('should adapt content layout for mobile screens', async () => {
    setMobileViewport();

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Select a document to test content layout
    const hamburgerButton = screen.getByLabelText(/toggle.*menu|menu.*toggle/i);
    await userEvent.click(hamburgerButton);

    await waitFor(() => {
      const tocSidebar = screen.getByTestId('toc-sidebar');
      expect(tocSidebar).toHaveClass('mobile-visible');
    });

    await userEvent.click(screen.getByText('Overview'));
    await userEvent.click(screen.getByText('01-introduction.md'));

    await waitFor(() => {
      expect(screen.getByText(/Test Mobile Document/)).toBeInTheDocument();
    });

    // Content area should take full width on mobile
    const contentArea = screen.getByTestId('content-area');
    expect(contentArea).toHaveClass('mobile-full-width');

    // Text should be readable with appropriate sizing
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toHaveClass('mobile-heading');
  });

  it('should handle tablet layout properly', async () => {
    setTabletViewport();

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Tablet should show TOC in collapsed state but accessible
    const tocSidebar = screen.getByTestId('toc-sidebar');
    expect(tocSidebar).toHaveClass('tablet-layout');
    expect(tocSidebar).not.toHaveClass('mobile-hidden');

    // Should still have hamburger menu for easy access
    const hamburgerButton = screen.getByLabelText(/toggle.*menu|menu.*toggle/i);
    expect(hamburgerButton).toBeInTheDocument();
  });

  it('should maintain desktop layout on larger screens', async () => {
    setDesktopViewport();

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Desktop should show full sidebar
    const tocSidebar = screen.getByTestId('toc-sidebar');
    expect(tocSidebar).toHaveClass('desktop-layout');
    expect(tocSidebar).toBeVisible();

    // No hamburger menu needed on desktop
    expect(screen.queryByLabelText(/toggle.*menu|menu.*toggle/i)).not.toBeInTheDocument();

    // Content should have proper margins for sidebar
    const contentArea = screen.getByTestId('content-area');
    expect(contentArea).toHaveClass('desktop-with-sidebar');
  });

  it('should handle orientation changes gracefully', async () => {
    setMobileViewport();

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Simulate landscape orientation
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 667,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 375,
    });

    fireEvent(window, new Event('orientationchange'));
    fireEvent(window, new Event('resize'));

    // Layout should adapt to landscape
    await waitFor(() => {
      const tocSidebar = screen.getByTestId('toc-sidebar');
      expect(tocSidebar).toHaveClass('landscape-mobile');
    });
  });

  it('should support swipe gestures for TOC navigation', async () => {
    setMobileViewport();
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    const tocSidebar = screen.getByTestId('toc-sidebar');

    // Simulate swipe right to open TOC
    fireEvent.touchStart(document.body, {
      touches: [{ clientX: 10, clientY: 100 }],
    });
    fireEvent.touchMove(document.body, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    fireEvent.touchEnd(document.body, {
      changedTouches: [{ clientX: 100, clientY: 100 }],
    });

    await waitFor(() => {
      expect(tocSidebar).toHaveClass('mobile-visible');
    });

    // Simulate swipe left to close TOC
    fireEvent.touchStart(tocSidebar, {
      touches: [{ clientX: 200, clientY: 100 }],
    });
    fireEvent.touchMove(tocSidebar, {
      touches: [{ clientX: 50, clientY: 100 }],
    });
    fireEvent.touchEnd(tocSidebar, {
      changedTouches: [{ clientX: 50, clientY: 100 }],
    });

    await waitFor(() => {
      expect(tocSidebar).toHaveClass('mobile-hidden');
    });
  });

  it('should handle safe area insets on mobile devices', async () => {
    setMobileViewport();

    // Mock safe area environment variables
    Object.defineProperty(document.documentElement.style, 'setProperty', {
      value: vi.fn(),
    });

    // Mock CSS environment variables for safe areas
    const mockGetComputedStyle = vi.fn().mockReturnValue({
      getPropertyValue: vi.fn().mockImplementation((prop) => {
        if (prop === 'env(safe-area-inset-top)') return '44px';
        if (prop === 'env(safe-area-inset-bottom)') return '34px';
        return '';
      }),
    });
    window.getComputedStyle = mockGetComputedStyle;

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    const appContainer = screen.getByTestId('app-container');
    expect(appContainer).toHaveClass('safe-area-insets');
  });

  it('should optimize performance for mobile rendering', async () => {
    setMobileViewport();
    const performanceNowSpy = vi.spyOn(performance, 'now').mockReturnValue(0);

    render(<SpecificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Verify that expensive operations are debounced on mobile
    const hamburgerButton = screen.getByLabelText(/toggle.*menu|menu.*toggle/i);

    // Rapid clicks should be debounced
    await userEvent.click(hamburgerButton);
    await userEvent.click(hamburgerButton);
    await userEvent.click(hamburgerButton);

    // Should not cause excessive re-renders
    expect(performanceNowSpy).toHaveBeenCalledTimes(1);

    performanceNowSpy.mockRestore();
  });
});