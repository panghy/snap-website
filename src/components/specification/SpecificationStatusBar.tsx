import React from 'react';
import type { SpecificationMetadata } from '../../types/specification';
import styles from './SpecificationStatusBar.module.css';

interface SpecificationStatusBarProps {
  metadata: SpecificationMetadata;
}

export const SpecificationStatusBar: React.FC<SpecificationStatusBarProps> = ({ metadata }) => {
  return (
    <div className={styles.statusBar}>
      <div className={styles.statusContent}>
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>Version</span>
          <span className={styles.statusValue}>{metadata.specVersion}</span>
        </div>

        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>Release Date</span>
          <span className={styles.statusValue}>
            {new Date(metadata.releaseDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </span>
        </div>

        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>Status</span>
          <span className={`${styles.statusValue} ${styles[metadata.status]}`}>
            {metadata.status.toUpperCase()}
          </span>
        </div>

        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>Generated</span>
          <span className={styles.statusValue}>
            {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      </div>
    </div>
  );
};