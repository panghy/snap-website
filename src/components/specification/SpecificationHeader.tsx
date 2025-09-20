import React from 'react';
import type { SpecificationMetadata, SpecificationDocument } from '../../types/specification';
import styles from './SpecificationHeader.module.css';

interface SpecificationHeaderProps {
  metadata: SpecificationMetadata;
  currentDocument: SpecificationDocument | null;
  onTocToggle: () => void;
  isTocVisible: boolean;
}

export const SpecificationHeader: React.FC<SpecificationHeaderProps> = ({
  metadata,
  currentDocument,
  onTocToggle,
  isTocVisible,
}) => {
  return (
    <header className={styles.specificationHeader}>
      <div className={styles.headerContent}>
        {/* TOC toggle button */}
        <button
          className={`${styles.tocToggle} ${isTocVisible ? styles.active : ''}`}
          onClick={onTocToggle}
          aria-label={isTocVisible ? 'Hide table of contents' : 'Show table of contents'}
          aria-expanded={isTocVisible}
        >
          <span className={styles.hamburger}>
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
          </span>
        </button>

        {/* Title */}
        <div className={styles.title}>
          <h1>SNAP Specification</h1>
          <span className={styles.version}>v{metadata.specVersion}</span>
        </div>
      </div>
    </header>
  );
};