import React from 'react';
import type { SnapEntry, SnapSpecification } from '../../types/snap';
import type { Repository } from '../../types/repository';
import { RepositoryPlatform } from '../../types/repository';
import styles from './SnapCard.module.css';

interface SnapCardProps {
  snap: SnapEntry;
  specification?: SnapSpecification;
  isLoadingMetrics?: boolean;
  onLanguageClick?: (language: string) => void;
  onCapabilityClick?: (capability: string) => void;
}

export const SnapCard: React.FC<SnapCardProps> = ({
  snap,
  specification,
  isLoadingMetrics = false,
  onLanguageClick,
  onCapabilityClick,
}) => {
  // Parse repository to determine platform (for icon display)
  const repository: Repository | null = React.useMemo(() => {
    if (!snap.repository) return null;

    if (typeof snap.repository === 'string') {
      const url = snap.repository;
      const githubMatch = url.match(/github\.com\/([^/]+)\/([^/]+)/);
      const gitlabMatch = url.match(/gitlab\.com\/([\w\-./]+)\/([^/]+)$/);

      if (githubMatch) {
        return {
          url,
          platform: RepositoryPlatform.GITHUB,
          owner: githubMatch[1],
          name: githubMatch[2]
        };
      } else if (gitlabMatch) {
        return {
          url,
          platform: RepositoryPlatform.GITLAB,
          owner: gitlabMatch[1],
          name: gitlabMatch[2]
        };
      }
      return null;
    }

    return snap.repository;
  }, [snap.repository]);

  // Don't fetch metadata individually - it's already provided from parent
  // The parent (CataloguePage) fetches all metadata and passes enriched snaps
  const effectiveStars = snap.stars;
  const effectiveLastCommit = snap.lastCommit;
  const effectiveLastRelease = snap.lastRelease;
  const effectiveLicense = snap.license;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      queue: '#667eea',
      blobstore: '#764ba2',
      search: '#f093fb',
      graph: '#4facfe',
      timeseries: '#43e97b',
      cache: '#fa709a',
      pubsub: '#feca57',
      workflow: '#48dbfb',
      persistence: '#ff6b6b',
      other: '#a29bfe',
    };
    return colors[category] || '#667eea';
  };

  const getCategoryDisplayName = (category: string): string => {
    const displayNames: Record<string, string> = {
      queue: 'Task Queue',
      blobstore: 'Blob Store',
      search: 'Vector Search',
      graph: 'Graph Database',
      timeseries: 'Time Series',
      cache: 'Cache',
      pubsub: 'Pub/Sub',
      workflow: 'Workflow Engine',
      persistence: 'Persistence',
      other: 'Other'
    };
    return displayNames[category] || category;
  };

  const getRepositoryUrl = () => {
    if (!snap.repository) return null;
    if (typeof snap.repository === 'string') {
      return snap.repository;
    }
    return snap.repository.url;
  };

  const getRepositoryDisplay = () => {
    const url = getRepositoryUrl();
    if (!url) return '';
    return url.replace(/https?:\/\/(github|gitlab)\.com\//, '');
  };

  const getRepositoryIcon = () => {
    if (!repository) {
      // Default to GitHub icon for backward compatibility
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
      );
    }

    if (repository.platform === RepositoryPlatform.GITLAB) {
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M15.97 9.058l-.895-2.756L13.3.842a.451.451 0 00-.859 0l-1.776 5.46H5.335L3.56.842a.451.451 0 00-.859 0L.926 6.302.031 9.058a.9.9 0 00.327 1.007L8 15.635l7.642-5.57a.9.9 0 00.328-1.007z" />
        </svg>
      );
    }

    // GitHub icon
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
      </svg>
    );
  };

  return (
    <div className={`${styles.snapCard} ${snap.archived ? styles.archived : ''}`}>
      <div className={styles.cardHeader}>
        <div className={styles.titleSection}>
          {snap.beta && (
            <span className={styles.betaBadge}>BETA</span>
          )}
          <a
            href={getRepositoryUrl() || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.snapNameLink}
          >
            <h3 className={styles.snapName}>{snap.name}</h3>
          </a>
        </div>
        <span
          className={styles.categoryBadge}
          style={{ backgroundColor: getCategoryColor(snap.category) }}
        >
          {getCategoryDisplayName(snap.category)}
        </span>
      </div>

      <p className={styles.snapDescription}>{snap.description}</p>

      <div className={styles.snapMeta}>
        <div className={styles.languages}>
          {snap.language && (
            <span
              className={styles.languageTag}
              onClick={() => onLanguageClick?.(snap.language!)}
              style={{ cursor: onLanguageClick ? 'pointer' : 'default' }}
            >
              {snap.language}
            </span>
          )}
        </div>

        {snap.capabilities && (
          <div className={styles.capabilities}>
            {Object.entries(snap.capabilities).map(([key, value]) =>
              value ? (
                <span
                  key={key}
                  className={styles.capabilityBadge}
                  onClick={() => onCapabilityClick?.(key)}
                  style={{ cursor: onCapabilityClick ? 'pointer' : 'default' }}
                >
                  {key === 'otelMetrics' && 'otel-metrics'}
                  {key === 'otelTracing' && 'otel-tracing'}
                  {key === 'multiTenancy' && 'multi-tenant'}
                  {key === 'encryption' && 'encrypted'}
                  {key === 'compression' && 'compressed'}
                  {key === 'streaming' && 'streaming'}
                  {key === 'batchOperations' && 'batch-ops'}
                  {key === 'asyncApi' && 'async'}
                </span>
              ) : null
            )}
          </div>
        )}
      </div>

      <div className={styles.snapStats}>
        <a
          href={getRepositoryUrl() || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.repoLink}
        >
          {getRepositoryIcon()}
          {getRepositoryDisplay()}
        </a>

        {isLoadingMetrics ? (
          <span className={styles.loadingMetrics}>Loading...</span>
        ) : (
          <>
            {effectiveStars !== undefined && (
              <span className={styles.stars}>⭐ {effectiveStars}</span>
            )}
            {effectiveLastRelease && (
              <span className={styles.lastRelease}>
                🚀 {effectiveLastRelease}
              </span>
            )}
            {effectiveLicense && (
              <span className={styles.license}>
                📜 {effectiveLicense}
              </span>
            )}
            {effectiveLastCommit && (
              <span className={styles.lastUpdate}>
                Updated {formatDate(effectiveLastCommit)}
              </span>
            )}
          </>
        )}
      </div>

      {specification && (
        <div className={styles.specificationLink}>
          <a href={specification.repository} target="_blank" rel="noopener noreferrer">
            📋 {specification.name}
          </a>
        </div>
      )}

      {snap.platforms && snap.platforms.length > 0 && (
        <div className={styles.platforms}>
          {snap.platforms.map((platform, idx) => (
            <span key={idx} className={styles.platformReq}>
              {platform.name} {platform.version}
            </span>
          ))}
        </div>
      )}

      {snap.archived && (
        <div className={styles.archivedNotice}>
          ⚠️ This SNAP is archived and may no longer be maintained
        </div>
      )}
    </div>
  );
};