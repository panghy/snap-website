import React from 'react';
import type {
  TableOfContents,
  SpecificationDocument,
  Heading,
} from '../../types/specification';
import styles from './TOCSidebar.module.css';

interface TOCSidebarProps {
  toc: TableOfContents;
  documentMetadata: Map<string, SpecificationDocument>;
  currentDocumentId: string | null;
  currentHeadingId: string | null;
  expandedSections: Set<string>;
  onDocumentSelect: (documentPath: string) => void;
  onHeadingSelect: (headingId: string) => void;
  onSectionToggle: (sectionId: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

export const TOCSidebar: React.FC<TOCSidebarProps> = ({
  toc,
  documentMetadata,
  currentDocumentId,
  currentHeadingId,
  expandedSections,
  onDocumentSelect,
  onHeadingSelect,
  onSectionToggle,
  isVisible,
  onClose,
}) => {
  const renderHeadings = (headings: Heading[], documentId: string, maxLevel: number = 3, skipLevel1: boolean = true): React.ReactNode[] => {
    return headings
      .map((heading): React.ReactNode => {
        // Skip h1 headings but still process their children
        if (skipLevel1 && heading.level === 1) {
          if (heading.children.length > 0) {
            return renderHeadings(heading.children, documentId, maxLevel, false);
          }
          return null;
        }

        // Skip headings beyond max level
        if (heading.level > maxLevel) {
          return null;
        }

        return (
          <li key={heading.id} className={styles.headingItem}>
            <button
              data-testid={`heading-${heading.id}`}
              className={`${styles.headingLink} ${
                currentHeadingId === heading.id ? styles.active : ''
              } ${styles[`level${heading.level}`]}`}
              onClick={() => onHeadingSelect(heading.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onHeadingSelect(heading.id);
                }
              }}
              title={heading.text}
            >
              {heading.text}
            </button>
            {heading.children.length > 0 && heading.level < maxLevel && (
              <ul className={styles.headingsList}>
                {renderHeadings(heading.children, documentId, maxLevel, false)}
              </ul>
            )}
          </li>
        );
      })
      .flat()
      .filter(Boolean);
  };

  const renderDocument = (documentName: string, sectionId: string) => {
    const documentPath = `${sectionId}/${documentName}`;
    const document = documentMetadata.get(documentPath);
    const documentId = document?.id || `${sectionId}-${documentName.replace('.md', '')}`;
    const isActive = currentDocumentId === documentId;
    const displayTitle = document?.title || documentName.replace('.md', '').replace(/^\d+-/, '');

    return (
      <li key={documentName} className={styles.documentItem}>
        <button
          data-testid={`doc-${documentName}`}
          className={`${styles.documentLink} ${isActive ? styles.active : ''}`}
          onClick={() => onDocumentSelect(documentPath)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onDocumentSelect(documentPath);
            }
          }}
          title={displayTitle}
        >
          <span className={styles.documentTitle}>
            {displayTitle}
          </span>
        </button>

        {/* Render only h2 headings for current document */}
        {isActive && document?.headings && document.headings.length > 0 && (
          <ul className={styles.headingsList}>
            {renderHeadings(document.headings, documentId, 2)}
          </ul>
        )}
      </li>
    );
  };

  const renderSection = (section: typeof toc.sections[0]) => {
    const isExpanded = expandedSections.has(section.id);

    return (
      <li key={section.id} className={styles.sectionItem}>
        <button
          data-testid={`section-toggle-${section.id}`}
          className={`${styles.sectionToggle} ${isExpanded ? styles.expanded : ''}`}
          onClick={() => onSectionToggle(section.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSectionToggle(section.id);
            }
          }}
          aria-expanded={isExpanded}
          aria-controls={`section-docs-${section.id}`}
        >
          <div className={styles.sectionContent}>
            <span className={styles.sectionTitle}>{section.title}</span>
          </div>
          <span className={`${styles.chevron} ${isExpanded ? styles.rotated : ''}`}>
            ▼
          </span>
        </button>

        <div
          data-testid={`section-docs-${section.id}`}
          className={`${styles.sectionDocuments} ${isExpanded ? styles.visible : ''}`}
          style={{ display: isExpanded ? 'block' : 'none' }}
        >
          <ul className={styles.documentsList}>
            {section.documents.map((docName) => renderDocument(docName, section.id))}
          </ul>
        </div>
      </li>
    );
  };

  return (
    <aside
      data-testid="toc-sidebar"
      className={`${styles.tocSidebar} ${isVisible ? styles.visible : styles.hidden}`}
    >
      <div className={styles.sidebarHeader}>
        <h2 className={styles.sidebarTitle}>Contents</h2>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close sidebar"
          title="Close sidebar"
        >
          ✕
        </button>
      </div>

      <div className={styles.sidebarContent}>
        <nav className={styles.navigation} aria-label="Table of contents">
          <ul className={styles.sectionsList}>
            {toc.sections
              .sort((a, b) => a.order - b.order)
              .map(renderSection)}
          </ul>
        </nav>
      </div>

    </aside>
  );
};