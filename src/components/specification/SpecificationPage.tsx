import React, { useState, useEffect, useCallback } from 'react';
import { TOCSidebar } from './TOCSidebar';
import { MarkdownRenderer } from './MarkdownRenderer';
import { SpecificationHeader } from './SpecificationHeader';
import { SpecificationStatusBar } from './SpecificationStatusBar';
import { ScrollToAnchor } from './ScrollToAnchor';
import { SpecificationService } from '../../services/specification';
import type {
  SpecificationDocument,
  SpecificationMetadata,
  TableOfContents,
} from '../../types/specification';
import styles from './SpecificationPage.module.css';

export const SpecificationPage: React.FC = () => {
  const [metadata, setMetadata] = useState<SpecificationMetadata | null>(null);
  const [toc, setToc] = useState<TableOfContents | null>(null);
  const [currentDocument, setCurrentDocument] = useState<SpecificationDocument | null>(null);
  const [currentHeadingId, setCurrentHeadingId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [isTocVisible, setIsTocVisible] = useState(() => window.innerWidth > 768);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [documentMetadata, setDocumentMetadata] = useState<Map<string, SpecificationDocument>>(new Map());

  const service = React.useMemo(() => new SpecificationService(), []);

  // Load initial data
  useEffect(() => {
    loadSpecification();
  }, []);

  const loadSpecification = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { metadata: meta, toc: tableOfContents } = await service.loadSpecification();
      setMetadata(meta);
      setToc(tableOfContents);

      // Preload all document metadata for TOC display
      const docMetadata = new Map<string, SpecificationDocument>();
      for (const section of tableOfContents.sections) {
        for (const docName of section.documents) {
          try {
            const doc = await service.loadDocument(`${section.id}/${docName}`);
            docMetadata.set(`${section.id}/${docName}`, doc);
          } catch (err) {
            console.error(`Failed to load metadata for ${section.id}/${docName}:`, err);
          }
        }
      }
      setDocumentMetadata(docMetadata);

      // Expand all sections by default
      if (tableOfContents.sections.length > 0) {
        setExpandedSections(new Set(tableOfContents.sections.map(s => s.id)));

        // Check if there's a hash in the URL to restore
        const hash = window.location.hash.slice(1);
        let documentLoaded = false;

        if (hash) {
          // Try to find and load the document from the hash
          for (const section of tableOfContents.sections) {
            for (const docName of section.documents) {
              // Match how the ID is generated in the service
              const docId = `${section.id}-${docName.replace('.md', '')}`.replace(/^\d+-/, '');
              if (docId === hash || hash.startsWith(docId + '-')) {
                await selectDocument(`${section.id}/${docName}`);
                documentLoaded = true;

                // If hash contains a heading ID, scroll to it after a short delay
                if (hash.includes('-') && hash !== docId) {
                  setTimeout(() => {
                    const element = document.getElementById(hash);
                    if (element) {
                      const offset = 180; // Account for fixed header with extra padding
                      const elementPosition = element.getBoundingClientRect().top;
                      const offsetPosition = elementPosition + window.pageYOffset - offset;
                      window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth',
                      });
                      setCurrentHeadingId(hash);
                    }
                  }, 100);
                } else {
                  // Restore scroll position if available
                  const savedPosition = sessionStorage.getItem('specScrollPosition');
                  if (savedPosition) {
                    setTimeout(() => {
                      window.scrollTo({
                        top: parseInt(savedPosition, 10),
                        behavior: 'instant',
                      });
                    }, 100);
                  }
                }
                break;
              }
            }
            if (documentLoaded) break;
          }
        }

        // If no document was loaded from hash, load the first document
        if (!documentLoaded) {
          const firstSection = tableOfContents.sections[0];
          if (firstSection.documents.length > 0) {
            await selectDocument(`${firstSection.id}/${firstSection.documents[0]}`);
          }
        }
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectDocument = useCallback(async (documentPath: string) => {
    try {
      const doc = await service.loadDocument(documentPath);
      setCurrentDocument(doc);
      setCurrentHeadingId(null);

      // Update URL
      const url = new URL(window.location.href);
      url.hash = doc.id;
      window.history.pushState(null, '', url.toString());

      // Scroll to top of content (accounting for fixed header)
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    } catch (err) {
      console.error('Failed to load document:', err);
      setError(err as Error);
    }
  }, [service]);

  const selectHeading = useCallback((headingId: string) => {
    setCurrentHeadingId(headingId);

    const element = document.getElementById(headingId);
    if (element) {
      const offset = 180; // Account for fixed header with extra padding
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  }, []);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const toggleToc = useCallback(() => {
    setIsTocVisible(prev => !prev);
  }, []);

  // Handle window resize to show/hide TOC
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth > 768;
      setIsTocVisible(isDesktop);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        // Check if it's a document ID or heading ID
        if (hash.includes('-')) {
          // Try to find the document
          if (toc) {
            for (const section of toc.sections) {
              for (const docName of section.documents) {
                // Match how the ID is generated in the service
                const docId = `${section.id}-${docName.replace('.md', '')}`.replace(/^\d+-/, '');
                if (docId === hash) {
                  selectDocument(`${section.id}/${docName}`);
                  return;
                }
              }
            }
          }
          // If not a document, treat as heading
          selectHeading(hash);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);

    // Handle initial hash
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [toc, selectDocument, selectHeading]);

  // Handle scroll tracking for active heading
  useEffect(() => {
    if (!currentDocument) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180; // Offset for header with extra padding

      // Save scroll position to sessionStorage
      sessionStorage.setItem('specScrollPosition', String(window.scrollY));

      let activeHeading: string | null = null;

      // Flatten all headings (including nested ones)
      const flattenHeadings = (headings: any[]): any[] => {
        let flat: any[] = [];
        for (const heading of headings) {
          // Only track h2 headings since that's what we show in TOC
          if (heading.level === 2) {
            flat.push(heading);
          }
          if (heading.children && heading.children.length > 0) {
            flat = flat.concat(flattenHeadings(heading.children));
          }
        }
        return flat;
      };

      const allHeadings = flattenHeadings(currentDocument.headings);

      // Find the current active heading based on scroll position
      for (const heading of allHeadings) {
        const element = document.getElementById(heading.id);
        if (element) {
          const { top } = element.getBoundingClientRect();
          const absoluteTop = top + window.scrollY;

          if (absoluteTop <= scrollPosition) {
            activeHeading = heading.id;
          }
        }
      }

      if (activeHeading !== currentHeadingId) {
        setCurrentHeadingId(activeHeading);
      }
    };

    // Debounce scroll events
    let scrollTimeout: NodeJS.Timeout;
    const debouncedScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 100);
    };

    window.addEventListener('scroll', debouncedScroll);
    return () => {
      window.removeEventListener('scroll', debouncedScroll);
      clearTimeout(scrollTimeout);
    };
  }, [currentDocument, currentHeadingId]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer} data-testid="loading-spinner">
        <div className={styles.spinner} />
        <p>Loading specification...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Failed to load specification</h2>
        <p>{error.message}</p>
        <button onClick={loadSpecification} className={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.specificationPage}>
      <ScrollToAnchor />

      {metadata && (
        <>
          <SpecificationHeader
            metadata={metadata}
            currentDocument={currentDocument}
            onTocToggle={toggleToc}
            isTocVisible={isTocVisible}
          />
          <SpecificationStatusBar metadata={metadata} />
        </>
      )}

      <div className={styles.specificationContent}>
        {/* Mobile overlay for TOC */}
        {toc && isTocVisible && (
          <div
            className={styles.tocOverlay}
            onClick={toggleToc}
          />
        )}

        {toc && (
          <TOCSidebar
            toc={toc}
            documentMetadata={documentMetadata}
            currentDocumentId={currentDocument?.id || null}
            currentHeadingId={currentHeadingId}
            expandedSections={expandedSections}
            onDocumentSelect={selectDocument}
            onHeadingSelect={selectHeading}
            onSectionToggle={toggleSection}
            isVisible={isTocVisible}
            onClose={toggleToc}
          />
        )}

        <main className={`${styles.mainContent} ${!isTocVisible ? styles.fullWidth : ''}`}>
          {currentDocument ? (
            <MarkdownRenderer
              document={currentDocument}
              onHeadingClick={selectHeading}
              currentHeadingId={currentHeadingId}
            />
          ) : (
            <div className={styles.placeholder}>
              <p>Select a document from the table of contents to get started.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};