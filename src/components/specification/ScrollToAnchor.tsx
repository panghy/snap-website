import React, { useEffect, useRef } from 'react';
import { SPECIFICATION_CONSTANTS } from '../../types/specification';

interface ScrollToAnchorProps {
  offset?: number;
  behavior?: ScrollBehavior;
  onHashChange?: (hash: string) => void;
}

export const ScrollToAnchor: React.FC<ScrollToAnchorProps> = ({
  offset = SPECIFICATION_CONSTANTS.SCROLL_OFFSET_PX,
  behavior = 'smooth',
  onHashChange,
}) => {
  const previousHashRef = useRef<string>('');
  const isScrollingRef = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Function to scroll to an element by ID
  const scrollToElement = (elementId: string, scrollBehavior: ScrollBehavior = behavior) => {
    if (!elementId || isScrollingRef.current) return;

    // Guard against SSR/test environments
    if (typeof document === 'undefined') return;

    const element = document.getElementById(elementId);
    if (!element) {
      console.warn(`ScrollToAnchor: Element with ID "${elementId}" not found`);
      return;
    }

    isScrollingRef.current = true;

    try {
      const elementRect = element.getBoundingClientRect();
      const elementTop = elementRect.top + window.pageYOffset;
      const targetPosition = Math.max(0, elementTop - offset);

      window.scrollTo({
        top: targetPosition,
        behavior: scrollBehavior,
      });

      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Reset scrolling flag after animation completes
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
      }, scrollBehavior === 'smooth' ? SPECIFICATION_CONSTANTS.SCROLL_ANIMATION_DURATION_MS : SPECIFICATION_CONSTANTS.SCROLL_INSTANT_DURATION_MS);

      // Add visual highlight to the target element
      element.classList.add('scroll-target-highlight');
      setTimeout(() => {
        element.classList.remove('scroll-target-highlight');
      }, SPECIFICATION_CONSTANTS.SCROLL_HIGHLIGHT_DURATION_MS);

    } catch (error) {
      console.error('ScrollToAnchor: Error scrolling to element:', error);
      isScrollingRef.current = false;
    }
  };

  // Function to handle hash changes
  const handleHashChange = () => {
    const currentHash = window.location.hash.slice(1); // Remove the '#' prefix

    // Only process if hash actually changed
    if (currentHash === previousHashRef.current) return;

    previousHashRef.current = currentHash;

    // Call optional callback
    if (onHashChange) {
      onHashChange(currentHash);
    }

    // Scroll to the element if hash exists
    if (currentHash) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        scrollToElement(currentHash);
      }, SPECIFICATION_CONSTANTS.SCROLL_INITIAL_DELAY_MS);
    }
  };

  // Function to handle click events on links
  const handleLinkClick = (event: Event) => {
    const target = event.target as HTMLElement;
    const link = target.closest('a[href^="#"]') as HTMLAnchorElement;

    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#')) return;

    const targetId = href.slice(1);
    if (!targetId) return;

    // Prevent default behavior to handle smooth scrolling ourselves
    event.preventDefault();

    // Update the URL hash
    if (window.history.pushState) {
      const newUrl = `${window.location.pathname}${window.location.search}#${targetId}`;
      window.history.pushState(null, '', newUrl);
    } else {
      window.location.hash = targetId;
    }

    // Scroll to the target element
    scrollToElement(targetId);
  };

  // Set up event listeners
  useEffect(() => {
    // Guard against SSR/test environments
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Handle initial hash on component mount
    const initialHash = window.location.hash.slice(1);
    if (initialHash) {
      previousHashRef.current = initialHash;
      // Delay initial scroll to ensure content is rendered
      setTimeout(() => {
        scrollToElement(initialHash, 'auto'); // Use instant scroll for initial load
      }, SPECIFICATION_CONSTANTS.SCROLL_INSTANT_DURATION_MS);
    }

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    // Listen for clicks on anchor links
    document.addEventListener('click', handleLinkClick);

    // Cleanup
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      document.removeEventListener('click', handleLinkClick);

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Update offset when it changes
  useEffect(() => {
    // Guard against SSR/test environments
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Re-scroll to current hash if offset changes significantly
    const currentHash = window.location.hash.slice(1);
    if (currentHash && !isScrollingRef.current) {
      const element = document.getElementById(currentHash);
      if (element) {
        const elementRect = element.getBoundingClientRect();
        const currentOffset = window.pageYOffset + elementRect.top;
        const expectedOffset = window.pageYOffset + offset;

        // If the difference is significant, re-scroll
        if (Math.abs(currentOffset - expectedOffset) > 50) {
          setTimeout(() => {
            scrollToElement(currentHash, 'auto');
          }, SPECIFICATION_CONSTANTS.SCROLL_INITIAL_DELAY_MS);
        }
      }
    }
  }, [offset]);

  // This component doesn't render anything visible
  return (
    <>
      <style>
        {`
          .scroll-target-highlight {
            animation: scrollHighlight 2s ease-out;
          }

          @keyframes scrollHighlight {
            0% {
              background-color: rgba(102, 126, 234, 0.2);
              box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
            }
            100% {
              background-color: transparent;
              box-shadow: none;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .scroll-target-highlight {
              animation: none;
              background-color: rgba(102, 126, 234, 0.1);
            }
          }
        `}
      </style>
    </>
  );
};